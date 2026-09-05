import { NextRequest, NextResponse } from "next/server";
import { requireBusinessMember } from "@/lib/business/require-member-api";
import { createServiceClient } from "@/lib/supabase/service";
import { MP_COSTS_HELP_URL } from "@/lib/payments/pricing";
import {
  getBusinessPaymentSettings,
  updateBusinessPaymentSettings,
} from "@/lib/payments/businessSettings";

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId")?.trim();
  if (!businessId) return NextResponse.json({ error: "businessId requerido" }, { status: 400 });

  const auth = await requireBusinessMember(businessId);
  if ("error" in auth) return auth.error;

  const settings = await getBusinessPaymentSettings(businessId);
  const svc = createServiceClient();
  const { data: biz } = await svc
    .from("businesses")
    .select("accepts_cash, mp_ready")
    .eq("id", businessId)
    .maybeSingle();

  return NextResponse.json({
    ...settings,
    acceptsCash: biz?.accepts_cash ?? true,
    mpReady: biz?.mp_ready ?? false,
    mpCostsHelpUrl: MP_COSTS_HELP_URL,
  });
}

export async function PATCH(req: NextRequest) {
  let body: { businessId?: string; offerQrPay?: boolean; absorbFastPayFee?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const businessId = body.businessId?.trim();
  if (!businessId) return NextResponse.json({ error: "businessId requerido" }, { status: 400 });

  // P0 #6: escribir la configuración de pagos es operación de owner.
  const auth = await requireBusinessMember(businessId, "owner");
  if ("error" in auth) return auth.error;

  try {
    const settings = await updateBusinessPaymentSettings(businessId, {
      offerQrPay: body.offerQrPay,
      absorbFastPayFee: body.absorbFastPayFee,
    });
    const svc = createServiceClient();
    const { data: biz } = await svc
      .from("businesses")
      .select("accepts_cash, mp_ready")
      .eq("id", businessId)
      .maybeSingle();

    return NextResponse.json({
      ...settings,
      acceptsCash: biz?.accepts_cash ?? true,
      mpReady: biz?.mp_ready ?? false,
      mpCostsHelpUrl: MP_COSTS_HELP_URL,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo guardar" },
      { status: 500 },
    );
  }
}
