import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/** Debe coincidir con src/lib/mercadopago/crypto.ts (Node). */
const TOKEN_INFO = "bolivarpide/mp-token/v1";
const MP_TOKEN_KEY_VERSION = 1;

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function encryptToken(plaintext: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ikm = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "HKDF",
    false,
    ["deriveBits"],
  );
  const keyBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: encoder.encode(TOKEN_INFO) },
    ikm,
    256,
  );
  const key = await crypto.subtle.importKey("raw", keyBits, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plaintext));
  return `v1.${b64url(salt)}.${b64url(iv)}.${b64url(new Uint8Array(ciphertext))}`;
}

function redirectTarget(redirectUrl: string | null | undefined, businessId: string): string {
  const fallback = (Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");
  if (redirectUrl) {
    try {
      const u = new URL(redirectUrl);
      if (u.protocol === "http:" || u.protocol === "https:") return redirectUrl;
    } catch {
      /* fall through */
    }
  }
  return `${fallback}/negocio/${businessId}/configuracion/pagos`;
}

serve(async (req: Request) => {
  const fallbackSite = Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000";
  let failRedirect = fallbackSite;

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return new Response("Faltan code o state", { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: oauthData, error: consumeError } = await supabaseAdmin.rpc("consume_oauth_state", {
      p_state: state,
    });

    if (consumeError || !oauthData || oauthData.length === 0) {
      throw new Error("State inválido o expirado. Reiniciá la vinculación.");
    }

    const { code_verifier, business_id, redirect_url } = oauthData[0];
    const businessId = business_id as string;
    if (!businessId) throw new Error("OAuth sin business_id.");

    const baseTarget = redirectTarget(redirect_url as string | null, businessId);
    failRedirect = baseTarget;

    const mpRedirectUri = Deno.env.get("MP_REDIRECT_URI");
    const mpClientId = Deno.env.get("MP_APP_ID");
    const mpClientSecret = Deno.env.get("MP_CLIENT_SECRET");
    const tokenSecret = Deno.env.get("MP_TOKEN_SECRET");
    const oauthUsePkce = Deno.env.get("MP_OAUTH_USE_PKCE") === "true";

    if (!mpRedirectUri || !mpClientId || !mpClientSecret) {
      throw new Error("Configuración MP incompleta: faltan secrets");
    }
    if (!tokenSecret) {
      throw new Error("Falta MP_TOKEN_SECRET en la Edge Function (supabase secrets set).");
    }

    const tokenParams = new URLSearchParams({
      client_id: mpClientId,
      client_secret: mpClientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: mpRedirectUri,
    });
    if (oauthUsePkce && code_verifier !== "no-pkce") {
      tokenParams.set("code_verifier", code_verifier as string);
    }

    const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      console.error("MP /oauth/token HTTP error:", tokenResponse.status, body);
      throw new Error(`Error HTTP ${tokenResponse.status} al obtener tokens`);
    }

    const tokenData = await tokenResponse.json();
    if (tokenData.error || !tokenData.access_token || !tokenData.refresh_token) {
      throw new Error(tokenData.message || "Mercado Pago no devolvió refresh_token");
    }

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : new Date().toISOString();
    const mpUserId = String(tokenData.user_id);
    const nowIso = new Date().toISOString();

    const accessTokenEnc = await encryptToken(tokenData.access_token, tokenSecret);
    const refreshTokenEnc = await encryptToken(tokenData.refresh_token, tokenSecret);

    // Revocar conexión previa del mismo comercio (otra cuenta MP).
    await supabaseAdmin
      .from("mp_merchant_connections")
      .update({ status: "expired", updated_at: nowIso })
      .eq("business_id", businessId)
      .neq("mp_user_id", mpUserId)
      .eq("status", "active");

    const { error: dbError } = await supabaseAdmin.from("mp_merchant_connections").upsert(
      {
        business_id: businessId,
        mp_user_id: mpUserId,
        access_token_enc: accessTokenEnc,
        refresh_token_enc: refreshTokenEnc,
        key_version: MP_TOKEN_KEY_VERSION,
        expires_at: expiresAt,
        status: "active",
        linked_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "business_id" },
    );
    if (dbError) throw dbError;

    const userResponse = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      const displayName = [userData.first_name, userData.last_name].filter(Boolean).join(" ").trim() || null;
      await supabaseAdmin
        .from("mp_merchant_connections")
        .update({
          nickname: userData.nickname ?? null,
          display_name: displayName,
          email: userData.email ?? null,
          updated_at: nowIso,
        })
        .eq("business_id", businessId);
    }

    const ok = new URL(baseTarget);
    ok.searchParams.set("linked", "true");
    ok.searchParams.set("provision", "1");
    console.log(`[mp-auth-callback] business=${businessId} mp_user=${mpUserId}`);
    return Response.redirect(ok.toString(), 302);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("mp-auth-callback error:", message);
    const fail = new URL(failRedirect);
    fail.searchParams.set("linked", "false");
    fail.searchParams.set("message", message);
    return Response.redirect(fail.toString(), 302);
  }
});
