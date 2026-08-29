import { createServiceClient } from "@/lib/supabase/service";
import { mpFetch, MpApiError } from "@/lib/mercadopago/mp-fetch";
import {
  getAccessTokenForBusiness,
  getConnection,
  type MpConnectionRow,
} from "@/lib/mercadopago/repository";

type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string;
  province: string;
  postal_code: string;
};

const DEFAULT_LAT = -36.23;
const DEFAULT_LNG = -61.11;

function externalStoreId(slug: string) {
  return `BOLIVARPIDE-${slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 40)}`;
}

function externalPosId(slug: string) {
  return `${externalStoreId(slug)}-POS001`;
}

function parseStreet(address: string | null): { streetName: string; streetNumber: string } {
  if (!address?.trim()) return { streetName: "Sin número", streetNumber: "S/N" };
  const m = address.trim().match(/^(.+?)\s+(\d+\w*)$/);
  if (m) return { streetName: m[1], streetNumber: m[2] };
  return { streetName: address.trim(), streetNumber: "S/N" };
}

async function findStoreByExternalId(token: string, userId: string, externalId: string) {
  try {
    const res = await fetch(
      `https://api.mercadopago.com/users/${userId}/stores/search?external_id=${encodeURIComponent(externalId)}`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(25_000) },
    );
    if (!res.ok) return null;
    const data = await res.json() as { results?: { id: number | string; name?: string }[] } | { results?: unknown[] }[];
    const results = Array.isArray(data) ? (data[0] as { results?: { id: number | string; name?: string }[] })?.results : (data as { results?: { id: number | string; name?: string }[] }).results;
    return results?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function provisionStoreAndPos(business: BusinessRow, connection: MpConnectionRow) {
  const token = await getAccessTokenForBusiness(business.id);
  const extStore = externalStoreId(business.slug);
  const extPos = externalPosId(business.slug);
  const { streetName, streetNumber } = parseStreet(business.address);
  const svc = createServiceClient();

  let mpStoreId: string;
  const existingStore = await svc.from("mp_stores").select("*").eq("business_id", business.id).maybeSingle();
  if (existingStore.data?.mp_store_id) {
    mpStoreId = existingStore.data.mp_store_id;
  } else {
    const found = await findStoreByExternalId(token, connection.mp_user_id, extStore);
    if (found?.id != null) {
      mpStoreId = String(found.id);
    } else {
      const created = await mpFetch<{ id: number | string; name?: string }>(
        token,
        `/users/${connection.mp_user_id}/stores`,
        {
          method: "POST",
          body: JSON.stringify({
            name: business.name,
            external_id: extStore,
            location: {
              street_name: streetName,
              street_number: streetNumber,
              city_name: business.city,
              state_name: business.province,
              latitude: DEFAULT_LAT,
              longitude: DEFAULT_LNG,
              reference: business.address ?? business.name,
            },
          }),
        },
      );
      mpStoreId = String(created.id);
    }

    const { error: storeErr } = await svc.from("mp_stores").upsert(
      {
        business_id: business.id,
        connection_id: connection.id,
        mp_store_id: mpStoreId,
        external_store_id: extStore,
        name: business.name,
        location: {
          street_name: streetName,
          street_number: streetNumber,
          city_name: business.city,
          state_name: business.province,
          latitude: DEFAULT_LAT,
          longitude: DEFAULT_LNG,
        },
      },
      { onConflict: "business_id" },
    );
    if (storeErr) throw storeErr;
  }

  const storeRow = (await svc.from("mp_stores").select("id").eq("business_id", business.id).single()).data;
  if (!storeRow) throw new Error("No se pudo persistir la sucursal MP.");

  const existingPos = await svc.from("mp_pos").select("*").eq("business_id", business.id).maybeSingle();
  if (existingPos.data?.mp_pos_id && existingPos.data.connection_id === connection.id) {
    return { storeId: mpStoreId, posId: existingPos.data.mp_pos_id, externalPosId: existingPos.data.external_pos_id };
  }

  let mpPos: { id: number | string; qr?: { image?: string } };
  try {
    mpPos = await mpFetch<{ id: number | string; qr?: { image?: string } }>(token, "/v2/pos", {
      method: "POST",
      idempotencyKey: `provision-${business.id}`,
      body: JSON.stringify({
        name: `${business.name} — Delivery`,
        store_id: mpStoreId,
        external_store_id: extStore,
        external_id: extPos,
        config: { qr: { operating_mode: "pdv" } },
      }),
    });
  } catch (err) {
    if (err instanceof MpApiError && err.code === "point_of_sale_exists") {
      const listed = await mpFetch<{ results?: { id: number | string; external_id?: string; qr?: { image?: string } }[] }>(
        token,
        `/v2/pos?external_id=${encodeURIComponent(extPos)}`,
        { method: "GET" },
      );
      const hit = listed.results?.find((p) => p.external_id === extPos) ?? listed.results?.[0];
      if (!hit?.id) throw err;
      mpPos = hit;
    } else {
      throw err;
    }
  }

  const { error: posErr } = await svc.from("mp_pos").upsert(
    {
      business_id: business.id,
      store_id: storeRow.id,
      connection_id: connection.id,
      mp_pos_id: String(mpPos.id),
      external_pos_id: extPos,
      operating_mode: "pdv",
      qr_static_image: mpPos.qr?.image ?? null,
    },
    { onConflict: "business_id" },
  );
  if (posErr) throw posErr;

  return { storeId: mpStoreId, posId: String(mpPos.id), externalPosId: extPos };
}

export async function reprovisionPos(businessId: string) {
  const svc = createServiceClient();
  const { data: business, error: bizErr } = await svc
    .from("businesses")
    .select("id, slug, name, address, city, province, postal_code")
    .eq("id", businessId)
    .single();
  if (bizErr || !business) throw new Error("Negocio no encontrado.");

  const conn = await getConnection(businessId);
  if (!conn || conn.status !== "active") {
    throw new Error("Conectá Mercado Pago antes de reprovisionar.");
  }

  await svc.from("mp_pos").delete().eq("business_id", businessId);
  const result = await provisionStoreAndPos(business as BusinessRow, conn);
  await svc.from("businesses").update({ mp_ready: true }).eq("id", businessId);
  return result;
}
