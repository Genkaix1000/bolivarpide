import { NextRequest, NextResponse } from "next/server";
import { requireBusinessMember } from "@/lib/business/require-member-api";
import { disconnectConnection } from "@/lib/mercadopago/repository";

export async function DELETE(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId")?.trim();
  if (!businessId) {
    return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
  }

  const auth = await requireBusinessMember(businessId);
  if ("error" in auth && auth.error) return auth.error;

  try {
    await disconnectConnection(businessId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al desvincular";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
