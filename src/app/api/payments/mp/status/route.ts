import { NextRequest, NextResponse } from "next/server";
import { requireBusinessMember } from "@/lib/business/require-member-api";
import { getProvisioningStatus } from "@/lib/mercadopago/repository";

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId")?.trim();
  if (!businessId) {
    return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
  }

  const auth = await requireBusinessMember(businessId);
  if ("error" in auth && auth.error) return auth.error;

  try {
    const status = await getProvisioningStatus(businessId);
    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al consultar estado MP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
