import { NextRequest, NextResponse } from "next/server";
import { requireBusinessMember } from "@/lib/business/require-member-api";
import {
  getMpOAuthConfigStatus,
  mergeOAuthIssues,
  probeMpApplicationPanel,
} from "@/lib/mercadopago/oauthConfig";

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId")?.trim();
  if (!businessId) return NextResponse.json({ error: "businessId requerido" }, { status: 400 });

  const auth = await requireBusinessMember(businessId);
  if ("error" in auth && auth.error) return auth.error;

  const config = getMpOAuthConfigStatus();
  const panel = await probeMpApplicationPanel();
  const issues = mergeOAuthIssues(config, panel);

  let edgeFunctionReachable: boolean | null = null;
  if (config.redirectUri) {
    try {
      const res = await fetch(config.redirectUri, { method: "GET", signal: AbortSignal.timeout(8_000) });
      edgeFunctionReachable = res.status === 400 || res.ok;
    } catch {
      edgeFunctionReachable = false;
    }
  }

  return NextResponse.json({
    ...config,
    panel,
    issues,
    readyToLink: config.configured && panel.ok && issues.length === 0,
    edgeFunctionReachable,
    panelChecklist: [
      "Tus integraciones → bolivarpide → Editar → Configuración avanzada",
      `Redirect URL = ${config.redirectUri}`,
      config.oauthUsePkce
        ? "Activar «flujo de código de autorización con PKCE»"
        : "PKCE desactivado (coincide con MP_OAUTH_USE_PKCE=false)",
    ],
  });
}
