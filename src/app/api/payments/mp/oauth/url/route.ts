import { NextRequest, NextResponse } from "next/server";
import { requireBusinessMember } from "@/lib/business/require-member-api";
import {
  getMpOAuthConfigStatus,
  mergeOAuthIssues,
  probeMpApplicationPanel,
} from "@/lib/mercadopago/oauthConfig";
import { insertOAuthState } from "@/lib/mercadopago/repository";

export async function POST(req: NextRequest) {
  let body: { businessId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const businessId = body.businessId?.trim();
  if (!businessId) {
    return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
  }

  const auth = await requireBusinessMember(businessId, "owner");
  if ("error" in auth && auth.error) return auth.error;

  const origin = req.headers.get("origin") ?? req.nextUrl.origin;
  const redirectPath = `/negocio/${businessId}/configuracion/pagos`;

  const oauthConfig = getMpOAuthConfigStatus();
  if (!oauthConfig.configured) {
    return NextResponse.json(
      { error: oauthConfig.issues.join(" · ") || "Mercado Pago OAuth no configurado" },
      { status: 503 },
    );
  }

  const panel = await probeMpApplicationPanel();
  const warnings = mergeOAuthIssues(oauthConfig, panel);
  if (warnings.length > 0) {
    return NextResponse.json(
      {
        error: warnings.join(" · "),
        panel,
        redirectUri: oauthConfig.redirectUri,
        appId: oauthConfig.appId,
      },
      { status: 409 },
    );
  }

  try {
    const { url } = await insertOAuthState({
      businessId,
      redirectUrl: `${origin}${redirectPath}`,
    });
    return NextResponse.json({
      url,
      redirectUri: oauthConfig.redirectUri,
      appId: oauthConfig.appId,
      oauthUsePkce: oauthConfig.oauthUsePkce,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al iniciar OAuth";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
