import { NextRequest, NextResponse } from "next/server";
import { requireBusinessMember } from "@/lib/business/require-member-api";
import { autoProvisionBusiness } from "@/lib/mercadopago/provisioning";

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

  try {
    const result = await autoProvisionBusiness(businessId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al provisionar MP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
