/** Mercado Pago — app BolivarPide (integrador marketplace). */
export function resolveSiteOrigin(override?: string): string {
  const raw = (override ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** Origin para back_urls de Checkout Pro (túnel ngrok, etc.). */
export function checkoutReturnOrigin(requestOrigin?: string): string {
  const tunnel = process.env.MP_CHECKOUT_RETURN_BASE?.trim();
  if (tunnel) return resolveSiteOrigin(tunnel);
  return resolveSiteOrigin(requestOrigin);
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "::1") return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return true;
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(h);
}

/** MP solo acepta back_urls HTTPS públicas cuando hay auto_return. */
export function isMpPublicReturnOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    return !isPrivateOrLocalHost(u.hostname);
  } catch {
    return false;
  }
}

export function mpCheckoutBackUrls(origin: string, orderId: string) {
  if (!isMpPublicReturnOrigin(origin)) return null;
  const base = new URL("/pago/resultado", origin);
  base.searchParams.set("orderId", orderId);
  const withStatus = (status: string) => {
    const u = new URL(base);
    u.searchParams.set("status", status);
    return u.toString();
  };
  return {
    back_urls: {
      success: withStatus("success"),
      failure: withStatus("failure"),
      pending: withStatus("pending"),
    },
    auto_return: "approved" as const,
  };
}

export function mpEnv() {
  return {
    appId: process.env.MP_APP_ID ?? "",
    clientSecret: process.env.MP_CLIENT_SECRET ?? "",
    redirectUri: process.env.MP_REDIRECT_URI ?? "",
    tokenSecret: process.env.MP_TOKEN_SECRET ?? process.env.AUTH_SECRET ?? "",
    webhookSecret: process.env.MP_WEBHOOK_SECRET ?? "",
    siteUrl: resolveSiteOrigin(),
    /** Debe coincidir con «use_pkce» en el panel MP (GET /applications/:id). */
    oauthUsePkce: process.env.MP_OAUTH_USE_PKCE === "true",
  };
}

export function assertMpOAuthConfigured() {
  const { appId, clientSecret, redirectUri, tokenSecret } = mpEnv();
  if (!appId || !clientSecret || !redirectUri) {
    throw new Error("Mercado Pago OAuth no configurado (MP_APP_ID, MP_CLIENT_SECRET, MP_REDIRECT_URI).");
  }
  if (!tokenSecret) {
    throw new Error("Falta MP_TOKEN_SECRET para cifrar tokens OAuth.");
  }
  return { appId, clientSecret, redirectUri, tokenSecret };
}
