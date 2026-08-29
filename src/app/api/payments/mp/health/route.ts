import { NextRequest, NextResponse } from "next/server";
import { requireBusinessMember } from "@/lib/business/require-member-api";
import { getMpHealth } from "@/lib/mercadopago/health";

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId")?.trim();
  if (!businessId) return NextResponse.json({ error: "businessId requerido" }, { status: 400 });

  const auth = await requireBusinessMember(businessId);
  if ("error" in auth && auth.error) return auth.error;

  try {
    return NextResponse.json(await getMpHealth(businessId));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
