/** Mercado Pago — app BolivarPide (integrador marketplace). */
export function mpEnv() {
  return {
    appId: process.env.MP_APP_ID ?? "",
    clientSecret: process.env.MP_CLIENT_SECRET ?? "",
    redirectUri: process.env.MP_REDIRECT_URI ?? "",
    tokenSecret: process.env.MP_TOKEN_SECRET ?? process.env.AUTH_SECRET ?? "",
    webhookSecret: process.env.MP_WEBHOOK_SECRET ?? "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
