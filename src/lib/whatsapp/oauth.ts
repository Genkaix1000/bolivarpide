import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { readWhatsAppToken } from "@/lib/whatsapp/connection";

/**
 * Meta Business Login (WhatsApp Business integration).
 *
 * El comercio se autentica con su cuenta de Meta y autoriza la WABA ya
 * vinculada a la app de la plataforma. El callback cambia el code por un
 * token de system user de 60 días, lo guarda cifrado en Supabase Vault y
 * deja la conexión `connected` sin pasar por un admin.
 */

const OAUTH_SCOPES =
  "business_management,whatsapp_business_management,whatsapp_business_messaging";
const STATE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_LONG_LIVED_TTL_S = 60 * 24 * 60 * 60; // 60 días (system user token)

export type MetaOAuthConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  graphBase: string;
  dialogBase: string;
};

export function getMetaOAuthConfig(): MetaOAuthConfig {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    throw new Error("Falta META_APP_ID o META_APP_SECRET");
  }
  const version = process.env.META_GRAPH_VERSION?.trim() || "v22.0";
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const redirectUri =
    process.env.META_OAUTH_REDIRECT_URI?.trim() || `${base}/api/meta/oauth/callback`;
  return {
    appId,
    appSecret,
    redirectUri,
    graphBase: `https://graph.facebook.com/${version}`,
    dialogBase: `https://www.facebook.com/${version}/dialog/oauth`,
  };
}

export type MetaOAuthStateRow = {
  business_id: string;
  user_id: string;
  redirect_url: string;
};

/** Inserta el estado OAuth y devuelve la URL del diálogo de Meta. */
export async function createMetaLoginUrl(input: {
  businessId: string;
  userId: string;
  redirectUrl: string;
}): Promise<string> {
  const cfg = getMetaOAuthConfig();
  const state = randomUUID();

  const { error } = await createServiceClient().from("meta_oauth_states").insert({
    state,
    business_id: input.businessId,
    user_id: input.userId,
    redirect_url: input.redirectUrl,
    expires_at: new Date(Date.now() + STATE_TTL_MS).toISOString(),
  });
  if (error) throw error;

  const params = new URLSearchParams({
    client_id: cfg.appId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    state,
    scope: OAUTH_SCOPES,
  });
  return `${cfg.dialogBase}?${params.toString()}`;
}

/** Consume el estado (single-use, con expiración) y devuelve su fila o null. */
export async function consumeMetaOAuthState(
  state: string,
): Promise<MetaOAuthStateRow | null> {
  if (!state) return null;
  const { data, error } = await createServiceClient().rpc(
    "consume_meta_oauth_state",
    { p_state: state },
  );
  if (error || !Array.isArray(data) || data.length === 0) return null;
  return data[0] as MetaOAuthStateRow;
}

function oauthExchange(url: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  return fetch(url).then(
    async (res): Promise<{ accessToken: string; expiresIn: number }> => {
      const json = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
        error?: { message?: string };
      };
      if (!res.ok || !json.access_token) {
        throw new Error(json.error?.message || "Error al obtener el token de Meta");
      }
      return {
        accessToken: json.access_token,
        expiresIn: json.expires_in ?? DEFAULT_LONG_LIVED_TTL_S,
      };
    },
  );
}

/** Cambia el code de autorización por un token de corta duración (~2 h). */
export function exchangeMetaCode(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const cfg = getMetaOAuthConfig();
  const params = new URLSearchParams({
    client_id: cfg.appId,
    client_secret: cfg.appSecret,
    redirect_uri: cfg.redirectUri,
    code,
  });
  return oauthExchange(`${cfg.graphBase}/oauth/access_token?${params.toString()}`);
}

/** Extiende el token corto a un token de system user de larga duración (60 días). */
export function exchangeForLongLived(shortToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const cfg = getMetaOAuthConfig();
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: cfg.appId,
    client_secret: cfg.appSecret,
    fb_exchange_token: shortToken,
  });
  return oauthExchange(`${cfg.graphBase}/oauth/access_token?${params.toString()}`);
}

async function graphGet<T>(path: string, token: string, fields: string): Promise<T> {
  const cfg = getMetaOAuthConfig();
  const params = new URLSearchParams({ fields, access_token: token });
  const res = await fetch(`${cfg.graphBase}/${path}?${params.toString()}`);
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok || "error" in json) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ||
        "Error de la API de Meta",
    );
  }
  return json;
}

export type MetaWaba = { id: string; name?: string };

/** Duenño del token (system user / business user de Meta) vía /me. */
export async function resolveTokenOwnerId(token: string): Promise<string> {
  const me = await graphGet<{ id?: string }>("me", token, "id");
  if (!me.id) throw new Error("No se pudo identificar la cuenta de Meta");
  return me.id;
}

async function listWhatsAppAccounts(
  ownerId: string,
  token: string,
): Promise<MetaWaba[]> {
  const cfg = getMetaOAuthConfig();
  const tryEdge = (path: string) =>
    graphGet<{ data: MetaWaba[] }>(path, token, "id,name").then(
      (j) => j.data ?? [],
    );

  try {
    // Edge documentado para system users: las WABAs a las que el token accede.
    return await tryEdge(`${ownerId}/whatsapp_business_accounts`);
  } catch (err) {
    const unavailable =
      err instanceof Error &&
      err.message.includes("Tried accessing nonexisting field");
    if (unavailable) {
      // Fallback: edge por app (solo apps Business Integration).
      try {
        return await tryEdge(`${cfg.appId}/whatsapp_business_accounts`);
      } catch {
        throw new Error(
          "La app de Meta no está configurada como Business Integration o el token no puede enumerar las cuentas WhatsApp. Verificá que la WABA esté vinculada a la app en Meta.",
        );
      }
    }
    throw err;
  }
}

/** WABAs accesibles con el token (el comercio ya las vinculó en Meta). */
export async function listLinkedWabas(token: string): Promise<MetaWaba[]> {
  const ownerId = await resolveTokenOwnerId(token);
  return listWhatsAppAccounts(ownerId, token);
}

export type MetaPhoneNumber = {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  code_verification_status?: string;
  platform_type?: string;
};

/** Números activos de una WABA. Se usa para auto-detectar el número del local. */
export async function listPhoneNumbers(
  wabaId: string,
  token: string,
): Promise<MetaPhoneNumber[]> {
  const json = await graphGet<{ data: MetaPhoneNumber[] }>(
    `${wabaId}/phone_numbers`,
    token,
    "id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type",
  );
  return json.data ?? [];
}

/** Confirma que el token tiene acceso al número y trae sus datos. */
export async function verifyPhoneAccess(
  phoneNumberId: string,
  token: string,
): Promise<MetaPhoneNumber> {
  return graphGet<MetaPhoneNumber>(
    phoneNumberId,
    token,
    "id,display_phone_number,verified_name,quality_rating,code_verification_status",
  );
}

export type LinkedMetaConnection = {
  phoneNumberId: string;
  displayPhoneNumber: string | null;
  wabaId: string;
  verifiedName: string | null;
};

/**
 * Persiste el vínculo OAuth: guarda el token en Vault, detecta WABA + número,
 * verifica acceso y deja `business_whatsapp` en `connected`/activo.
 */
export async function linkWhatsAppViaOAuth(input: {
  businessId: string;
  token: string;
  expiresIn: number;
}): Promise<LinkedMetaConnection> {
  const service = createServiceClient();

  const ownerId = await resolveTokenOwnerId(input.token);
  const wabas = await listWhatsAppAccounts(ownerId, input.token);
  if (wabas.length === 0) {
    throw new Error(
      "No hay cuentas WhatsApp Business vinculadas a tu usuario de Meta. Vinculá tu WABA a la app en Meta (WhatsApp → Business settings → Linked WABAs) y reintentá.",
    );
  }
  const waba = wabas[0];

  const phones = await listPhoneNumbers(waba.id, input.token);
  if (phones.length === 0) {
    throw new Error("La cuenta WhatsApp Business no tiene números activos.");
  }
  const picked =
    phones.find((p) => p.code_verification_status === "verified") ?? phones[0];
  const verified = await verifyPhoneAccess(picked.id, input.token);

  const { data: existing } = await service
    .from("business_whatsapp")
    .select("id, vault_token_ref, status, is_active, connected_at")
    .eq("business_id", input.businessId)
    .maybeSingle();

  let vaultTokenRef: string;
  if (existing?.vault_token_ref) {
    const { error } = await service
      .schema("vault")
      .rpc("update_secret", {
        secret_id: existing.vault_token_ref,
        new_secret: input.token,
      });
    if (error) throw error;
    vaultTokenRef = existing.vault_token_ref;
  } else {
    const { data, error } = await service
      .schema("vault")
      .rpc("create_secret", {
        new_secret: input.token,
        new_name: `whatsapp_token_${input.businessId}`,
      });
    if (error) throw error;
    vaultTokenRef = data as string;
  }

  const wasConnected =
    existing?.status === "connected" && existing?.is_active === true;
  const { error } = await service.from("business_whatsapp").upsert(
    {
      business_id: input.businessId,
      phone_number_id: verified.id || picked.id,
      display_phone_number:
        verified.display_phone_number || picked.display_phone_number || null,
      verified_name: verified.verified_name || picked.verified_name || null,
      waba_id: waba.id,
      vault_token_ref: vaultTokenRef,
      meta_user_id: ownerId,
      status: "connected",
      is_active: true,
      token_expires_at: new Date(
        Date.now() + input.expiresIn * 1000,
      ).toISOString(),
      connected_at:
        wasConnected && existing?.connected_at
          ? existing.connected_at
          : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" },
  );
  if (error) throw error;

  return {
    phoneNumberId: verified.id || picked.id,
    displayPhoneNumber:
      verified.display_phone_number || picked.display_phone_number || null,
    wabaId: waba.id,
    verifiedName: verified.verified_name || picked.verified_name || null,
  };
}

/** Token vigente de una conexión, verificando expiración. Null si vencido. */
export async function readConnectionToken(row: {
  vault_token_ref: string | null;
  token_expires_at: string | null;
}): Promise<string | null> {
  if (row.token_expires_at && new Date(row.token_expires_at).getTime() <= Date.now()) {
    return null;
  }
  return readWhatsAppToken(row.vault_token_ref);
}