"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toStoredPhone } from "@/lib/business/phone";
import { isWithinBolivar } from "@/lib/addresses/bolivar";
import { MAX_USER_ADDRESSES, BOLIVAR_DEFAULTS } from "@/lib/addresses/constants";
import { addressFormSchema } from "@/lib/addresses/schemas";
import { addressToSummary, rowToAddress, type AddressRow } from "@/lib/addresses/db";
import type { UserAddress } from "@/lib/addresses/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Tenés que iniciar sesión");
  return { supabase, user };
}

function assertBolivarCoords(lat: number | null, lng: number | null) {
  if (lat == null || lng == null) return;
  if (!isWithinBolivar(lat, lng)) {
    throw new Error("Por ahora solo operamos en San Carlos de Bolívar");
  }
}

export async function listUserAddressesAction() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as AddressRow[]).map(rowToAddress);
}

export async function saveUserAddressAction(input: unknown, addressId?: string) {
  const parsed = addressFormSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const { supabase, user } = await requireUser();
  const data = parsed.data;

  assertBolivarCoords(data.lat, data.lng);

  const storedPhone = toStoredPhone(data.contactPhoneLocal);
  if (!storedPhone) throw new Error("Teléfono inválido");

  const row = {
    street: data.street.trim(),
    street_number: data.noNumber ? null : data.streetNumber.trim() || null,
    no_number: data.noNumber,
    delivery_notes: data.deliveryNotes.trim(),
    contact_first_name: data.contactFirstName.trim(),
    contact_last_name: data.contactLastName.trim(),
    contact_phone: storedPhone,
    city: BOLIVAR_DEFAULTS.city,
    province: BOLIVAR_DEFAULTS.province,
    postal_code: BOLIVAR_DEFAULTS.postalCode,
    lat: data.lat,
    lng: data.lng,
    updated_at: new Date().toISOString(),
  };

  if (addressId) {
    const { error } = await supabase
      .from("user_addresses")
      .update(row)
      .eq("id", addressId)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
    revalidatePath("/");
    const list = await listUserAddressesAction();
    return list.find((a) => a.id === addressId)!;
  }

  const { count } = await supabase
    .from("user_addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= MAX_USER_ADDRESSES) {
    throw new Error(`Podés guardar hasta ${MAX_USER_ADDRESSES} direcciones`);
  }

  const { data: existing } = await supabase
    .from("user_addresses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  const isFirst = !existing?.length;

  const { data: inserted, error } = await supabase
    .from("user_addresses")
    .insert({
      user_id: user.id,
      ...row,
      is_default: isFirst,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (isFirst) {
    await syncPrimaryAddress(supabase, user.id, rowToAddress(inserted as AddressRow));
  }

  revalidatePath("/");
  return rowToAddress(inserted as AddressRow);
}

async function syncPrimaryAddress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  addr: UserAddress,
) {
  const label = addressToSummary(addr).label;
  await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      primary_address: label,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

export async function setDefaultAddressAction(addressId: string) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("user_addresses")
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  const { data, error } = await supabase
    .from("user_addresses")
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq("id", addressId)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const addr = rowToAddress(data as AddressRow);
  await syncPrimaryAddress(supabase, user.id, addr);
  revalidatePath("/");
  return addr;
}

export async function deleteUserAddressAction(addressId: string) {
  const { supabase, user } = await requireUser();

  const { data: target, error: fetchErr } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("id", addressId)
    .eq("user_id", user.id)
    .single();
  if (fetchErr || !target) throw new Error("Dirección no encontrada");

  const deleted = rowToAddress(target as AddressRow);
  const wasDefault = deleted.isDefault;

  const { error } = await supabase
    .from("user_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  if (wasDefault) {
    const { data: next } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase
        .from("user_addresses")
        .update({ is_default: true })
        .eq("id", (next as AddressRow).id);
      await syncPrimaryAddress(supabase, user.id, rowToAddress(next as AddressRow));
    } else {
      await supabase.from("user_profiles").upsert(
        { user_id: user.id, primary_address: "", updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    }
  }

  revalidatePath("/");
  return deleted;
}

export async function restoreUserAddressAction(addr: UserAddress) {
  const { supabase, user } = await requireUser();

  const { count } = await supabase
    .from("user_addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= MAX_USER_ADDRESSES) {
    throw new Error("No hay espacio para restaurar la dirección");
  }

  const { data: existing } = await supabase
    .from("user_addresses")
    .select("id")
    .eq("user_id", user.id);

  const makeDefault = addr.isDefault || !(existing?.length);

  if (makeDefault) {
    await supabase
      .from("user_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const { data, error } = await supabase
    .from("user_addresses")
    .insert({
      id: addr.id,
      user_id: user.id,
      street: addr.street,
      street_number: addr.streetNumber,
      no_number: addr.noNumber,
      delivery_notes: addr.deliveryNotes,
      contact_first_name: addr.contactFirstName,
      contact_last_name: addr.contactLastName,
      contact_phone: addr.contactPhone,
      city: addr.city,
      province: addr.province,
      postal_code: addr.postalCode,
      lat: addr.lat,
      lng: addr.lng,
      is_default: makeDefault,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const restored = rowToAddress(data as AddressRow);
  if (makeDefault) await syncPrimaryAddress(supabase, user.id, restored);
  revalidatePath("/");
  return restored;
}

export async function getUserAddressAction(addressId: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("id", addressId)
    .eq("user_id", user.id)
    .single();
  if (error) throw new Error(error.message);
  return rowToAddress(data as AddressRow);
}
