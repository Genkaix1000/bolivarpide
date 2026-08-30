import { mpEnv } from "@/lib/mercadopago/env";

/** App bolivarpide en el panel de Mercado Pago (referencia para diagnóstico). */
export const MP_BOLIVARPIDE_APP_ID = "8269242352751853";

export type MpOAuthConfigStatus = {
  configured: boolean;
  appId: string;
  redirectUri: string;
  clientSecretSet: boolean;
  tokenSecretSet: boolean;
  siteUrl: string;
  oauthUsePkce: boolean;
  expectedAppId: string;
  appIdMatchesBolivarpide: boolean;
  issues: string[];
};

export type MpApplicationPanelProbe = {
  ok: boolean;
  callbackUrl: string | null;
  callbackUrls: string[];
  usePkce: boolean | null;
  sandboxMode: boolean | null;
  redirectMatchesPanel: boolean;
  pkceMatchesPanel: boolean;
  message: string;
};

export function getMpOAuthConfigStatus(): MpOAuthConfigStatus {
  const { appId, clientSecret, redirectUri, tokenSecret, siteUrl, oauthUsePkce } = mpEnv();
  const issues: string[] = [];

  if (!appId) issues.push("Falta MP_APP_ID");
  if (!clientSecret) issues.push("Falta MP_CLIENT_SECRET");
  if (!redirectUri) issues.push("Falta MP_REDIRECT_URI");
  if (!tokenSecret) issues.push("Falta MP_TOKEN_SECRET");

  const appIdMatchesBolivarpide = appId === MP_BOLIVARPIDE_APP_ID;
  if (appId && !appIdMatchesBolivarpide) {
    issues.push(
      `MP_APP_ID (${appId}) no coincide con la app bolivarpide (${MP_BOLIVARPIDE_APP_ID}) — Mercado Pago rechaza OAuth`,
    );
  }

  if (redirectUri && !redirectUri.startsWith("https://")) {
    issues.push("MP_REDIRECT_URI debe ser HTTPS (MP exige URL estática idéntica al panel)");
  }

  if (redirectUri && !redirectUri.includes("/functions/v1/mp-auth-callback")) {
    issues.push("MP_REDIRECT_URI debería ser la Edge Function mp-auth-callback de Supabase");
  }

  return {
    configured: Boolean(appId && clientSecret && redirectUri && tokenSecret),
    appId,
    redirectUri,
    clientSecretSet: Boolean(clientSecret),
    tokenSecretSet: Boolean(tokenSecret),
    siteUrl,
    oauthUsePkce,
    expectedAppId: MP_BOLIVARPIDE_APP_ID,
    appIdMatchesBolivarpide,
    issues,
  };
}

function normalizeRedirect(url: string) {
  return url.trim().replace(/\/$/, "");
}

/** Consulta GET /applications/:id con client_credentials y compara redirect/PKCE del panel. */
export async function probeMpApplicationPanel(): Promise<MpApplicationPanelProbe> {
  const { appId, clientSecret, redirectUri, oauthUsePkce } = mpEnv();
  if (!appId || !clientSecret || !redirectUri) {
    return {
      ok: false,
      callbackUrl: null,
      callbackUrls: [],
      usePkce: null,
      sandboxMode: null,
      redirectMatchesPanel: false,
      pkceMatchesPanel: false,
      message: "Faltan credenciales MP para consultar el panel",
    };
  }

  try {
    const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenRes.ok || !tokenData.access_token) {
      return {
        ok: false,
        callbackUrl: null,
        callbackUrls: [],
        usePkce: null,
        sandboxMode: null,
        redirectMatchesPanel: false,
        pkceMatchesPanel: false,
        message: "No se pudo autenticar con Mercado Pago (client_id/secret inválidos)",
      };
    }

    const appRes = await fetch(`https://api.mercadopago.com/applications/${appId}`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(15_000),
    });
    const app = await appRes.json() as {
      callback_url?: string;
      callback_urls?: string[];
      use_pkce?: boolean;
      sandbox_mode?: boolean;
    };
    if (!appRes.ok) {
      return {
        ok: false,
        callbackUrl: null,
        callbackUrls: [],
        usePkce: null,
        sandboxMode: null,
        redirectMatchesPanel: false,
        pkceMatchesPanel: false,
        message: "No se pudo leer la configuración de la app en Mercado Pago",
      };
    }

    const expected = normalizeRedirect(redirectUri);
    const panelUrls = [
      app.callback_url,
      ...(app.callback_urls ?? []),
    ]
      .filter((u): u is string => Boolean(u?.trim()))
      .map(normalizeRedirect);
    const redirectMatchesPanel = panelUrls.some((u) => u === expected);
    const usePkce = Boolean(app.use_pkce);
    const pkceMatchesPanel = oauthUsePkce === usePkce;

    const parts: string[] = [];
    if (!redirectMatchesPanel) {
      parts.push(
        `Redirect en panel MP: ${panelUrls[0] ?? "sin configurar"} — debe ser ${expected}`,
      );
    }
    if (!pkceMatchesPanel) {
      parts.push(
        `PKCE panel=${usePkce ? "on" : "off"} · servidor MP_OAUTH_USE_PKCE=${oauthUsePkce ? "true" : "false"}`,
      );
    }

    return {
      ok: redirectMatchesPanel && pkceMatchesPanel,
      callbackUrl: app.callback_url ?? null,
      callbackUrls: app.callback_urls ?? [],
      usePkce,
      sandboxMode: app.sandbox_mode ?? null,
      redirectMatchesPanel,
      pkceMatchesPanel,
      message: parts.length > 0 ? parts.join(" · ") : "Panel MP alineado con el servidor",
    };
  } catch {
    return {
      ok: false,
      callbackUrl: null,
      callbackUrls: [],
      usePkce: null,
      sandboxMode: null,
      redirectMatchesPanel: false,
      pkceMatchesPanel: false,
      message: "Timeout consultando Mercado Pago",
    };
  }
}

export function mergeOAuthIssues(
  local: MpOAuthConfigStatus,
  panel: MpApplicationPanelProbe,
): string[] {
  const issues = [...local.issues];
  if (!panel.redirectMatchesPanel && local.redirectUri) {
    issues.push(
      `En el panel MP → bolivarpide → Editar → Redirect URL: poné exactamente ${local.redirectUri} (ahora: ${panel.callbackUrl ?? "vacío"})`,
    );
  }
  if (!panel.pkceMatchesPanel && panel.usePkce != null) {
    issues.push(
      panel.usePkce
        ? "En el panel MP activá PKCE o poné MP_OAUTH_USE_PKCE=true en el servidor"
        : "En el panel MP desactivá PKCE o dejá MP_OAUTH_USE_PKCE=false (default)",
    );
  }
  return issues;
}
