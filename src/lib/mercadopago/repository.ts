import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { encryptMpToken, decryptMpToken } from "@/lib/mercadopago/crypto";
import { assertMpOAuthConfigured, mpEnv } from "@/lib/mercadopago/env";
import { mpFetch, MP_API } from "@/lib/mercadopago/mp-fetch";

const AUTH_URL = "https://auth.mercadopago.com/authorization";
const STATE_TTL_MS = 10 * 60 * 1000;
const REFRESH_MARGIN_MS = 5 * 24 * 60 * 60 * 1000;

export type MpConnectionRow = {
  id: string;
  business_id: string;
  mp_user_id: string;
  access_token_enc: string | null;
  refresh_token_enc: string | null;
  expires_at: string | null;
  nickname: string | null;
  display_name: string | null;
  email: string | null;
  status: string;
  linked_at: string;
};

export type MpProvisioningStatus = {
  linked: boolean;
  status: "active" | "expired" | "revoked" | null;
  mpUserId: string | null;
  nickname: string | null;
  displayName: string | null;
  email: string | null;
  linkedAt: string | null;
  expiresAt: string | null;
  mpReady: boolean;
  store: { name: string; mpStoreId: string; externalStoreId: string } | null;
  pos: { externalPosId: string; mpPosId: string; operatingMode: string } | null;
  isOrphan: boolean;
};

function db() {
  return createServiceClient();
}

export function resolveOAuthRedirectUrl(candidate: string | null | undefined): string {
  const fallback = mpEnv().siteUrl;
  if (!candidate) return new URL(fallback).origin;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return new URL(fallback).origin;
    const allowed = new URL(fallback).origin;
    if (u.origin === allowed) return u.origin;
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return u.origin;
    return allowed;
  } catch {
    return new URL(fallback).origin;
  }
}

export async function insertOAuthState(input: {
  businessId: string;
  redirectUrl: string;
}): Promise<{ url: string }> {
  const { appId, redirectUri } = assertMpOAuthConfigured();
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  const state = randomUUID();
  const expiresAt = new Date(Date.now() + STATE_TTL_MS).toISOString();

  const { error } = await db().from("oauth_states").insert({
    state,
    code_verifier: codeVerifier,
    business_id: input.businessId,
    redirect_url: resolveOAuthRedirectUrl(input.redirectUrl),
    expires_at: expiresAt,
  });
  if (error) throw error;

  const params = new URLSearchParams({
    client_id: appId,
    response_type: "code",
    platform_id: "mp",
    state,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return { url: `${AUTH_URL}?${params.toString()}` };
}

export async function exchangeOAuthCode(code: string, codeVerifier: string) {
  const { appId, clientSecret, redirectUri } = assertMpOAuthConfigured();
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
  const res = await fetch(`${MP_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(25_000),
  });
  const data = await res.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user_id?: number;
    error?: string;
    message?: string;
  };
  if (!res.ok || data.error || !data.access_token) {
    throw new Error(data.message ?? data.error ?? "Error al obtener tokens de Mercado Pago");
  }
  return data;
}

async function refreshAccessToken(refreshToken: string) {
  const { appId, clientSecret } = assertMpOAuthConfigured();
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(`${MP_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    message?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.message ?? "No se pudo refrescar el token OAuth");
  }
  return data;
}

export async function getAccessTokenForBusiness(businessId: string): Promise<string> {
  const conn = await getConnection(businessId);
  if (!conn || conn.status !== "active") {
    throw new Error("El comercio no tiene Mercado Pago vinculado.");
  }
  const { tokenSecret } = assertMpOAuthConfigured();
  if (!conn.access_token_enc || !conn.refresh_token_enc) {
    throw new Error("Tokens OAuth incompletos — reconectá Mercado Pago.");
  }

  const expiresAt = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;
  const needsRefresh = expiresAt - Date.now() < REFRESH_MARGIN_MS;

  if (!needsRefresh) {
    return decryptMpToken(conn.access_token_enc, tokenSecret);
  }

  const refreshPlain = decryptMpToken(conn.refresh_token_enc, tokenSecret);
  const refreshed = await refreshAccessToken(refreshPlain);
  const newAccessEnc = encryptMpToken(refreshed.access_token!, tokenSecret);
  const newRefreshEnc = refreshed.refresh_token
    ? encryptMpToken(refreshed.refresh_token, tokenSecret)
    : conn.refresh_token_enc;
  const newExpires = refreshed.expires_in
    ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    : conn.expires_at;

  await db()
    .from("mp_merchant_connections")
    .update({
      access_token_enc: newAccessEnc,
      refresh_token_enc: newRefreshEnc,
      expires_at: newExpires,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conn.id);

  return refreshed.access_token!;
}

export async function getConnection(businessId: string): Promise<MpConnectionRow | null> {
  const { data, error } = await db()
    .from("mp_merchant_connections")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return data as MpConnectionRow | null;
}

export async function saveConnection(input: {
  businessId: string;
  mpUserId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
  nickname?: string | null;
  displayName?: string | null;
  email?: string | null;
}) {
  const { tokenSecret } = assertMpOAuthConfigured();
  const now = new Date().toISOString();

  await db()
    .from("mp_merchant_connections")
    .update({ status: "expired", updated_at: now })
    .eq("business_id", input.businessId)
    .neq("mp_user_id", input.mpUserId)
    .eq("status", "active");

  const row = {
    business_id: input.businessId,
    mp_user_id: input.mpUserId,
    access_token_enc: encryptMpToken(input.accessToken, tokenSecret),
    refresh_token_enc: input.refreshToken
      ? encryptMpToken(input.refreshToken, tokenSecret)
      : null,
    key_version: 1,
    expires_at: input.expiresAt,
    nickname: input.nickname ?? null,
    display_name: input.displayName ?? null,
    email: input.email ?? null,
    status: "active",
    linked_at: now,
    updated_at: now,
  };

  const { data, error } = await db()
    .from("mp_merchant_connections")
    .upsert(row, { onConflict: "business_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as MpConnectionRow;
}

export async function disconnectConnection(businessId: string) {
  const now = new Date().toISOString();
  await db()
    .from("mp_merchant_connections")
    .update({
      status: "revoked",
      access_token_enc: null,
      refresh_token_enc: null,
      updated_at: now,
    })
    .eq("business_id", businessId);
  await db().from("businesses").update({ mp_ready: false }).eq("id", businessId);
}

export async function setBusinessMpReady(businessId: string, ready: boolean) {
  await db().from("businesses").update({ mp_ready: ready }).eq("id", businessId);
}

export async function getProvisioningStatus(businessId: string): Promise<MpProvisioningStatus> {
  const [connRes, storeRes, posRes, bizRes] = await Promise.all([
    db().from("mp_merchant_connections").select("*").eq("business_id", businessId).maybeSingle(),
    db().from("mp_stores").select("*").eq("business_id", businessId).maybeSingle(),
    db().from("mp_pos").select("*").eq("business_id", businessId).maybeSingle(),
    db().from("businesses").select("mp_ready").eq("id", businessId).single(),
  ]);

  const conn = connRes.data as MpConnectionRow | null;
  const store = storeRes.data;
  const pos = posRes.data;
  const mpReady = Boolean(bizRes.data?.mp_ready);

  const linked = Boolean(conn && conn.status === "active" && conn.refresh_token_enc);
  const isOrphan = Boolean(
    linked && pos && conn && pos.connection_id !== conn.id,
  );

  return {
    linked,
    status: (conn?.status as MpProvisioningStatus["status"]) ?? null,
    mpUserId: conn?.mp_user_id ?? null,
    nickname: conn?.nickname ?? null,
    displayName: conn?.display_name ?? null,
    email: conn?.email ?? null,
    linkedAt: conn?.linked_at ?? null,
    expiresAt: conn?.expires_at ?? null,
    mpReady,
    store: store
      ? {
          name: store.name,
          mpStoreId: store.mp_store_id,
          externalStoreId: store.external_store_id,
        }
      : null,
    pos: pos
      ? {
          externalPosId: pos.external_pos_id,
          mpPosId: pos.mp_pos_id,
          operatingMode: pos.operating_mode,
        }
      : null,
    isOrphan,
  };
}

export async function fetchMpUserProfile(accessToken: string) {
  return mpFetch<{
    nickname?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  }>(accessToken, "/users/me", { method: "GET" });
}
