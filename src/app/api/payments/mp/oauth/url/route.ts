import { NextRequest, NextResponse } from "next/server";
import { requireBusinessMember } from "@/lib/business/require-member-api";
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

  const auth = await requireBusinessMember(businessId);
  if ("error" in auth && auth.error) return auth.error;

  const origin = req.headers.get("origin") ?? req.nextUrl.origin;
  const redirectPath = `/negocio/${businessId}/pagos`;

  try {
    const { url } = await insertOAuthState({
      businessId,
      redirectUrl: `${origin}${redirectPath}`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al iniciar OAuth";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
