import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getBusinessPaymentSettings } from "@/lib/payments/businessSettings";
import {
  FAST_PAY_SURCHARGE_BPS,
  MP_COSTS_HELP_URL,
  QR_DISCOUNT_BPS,
} from "@/lib/payments/pricing";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("businessSlug")?.trim();
  if (!slug) return NextResponse.json({ error: "businessSlug requerido" }, { status: 400 });

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("businesses")
    .select("id, mp_ready, accepts_cash")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });

  const paySettings = await getBusinessPaymentSettings(data.id);

  return NextResponse.json({
    mpReady: data.mp_ready,
    acceptsCash: data.accepts_cash,
    offerQrPay: paySettings.offerQrPay,
    absorbFastPayFee: paySettings.absorbFastPayFee,
    fastPaySurchargeBps: FAST_PAY_SURCHARGE_BPS,
    qrDiscountBps: QR_DISCOUNT_BPS,
    mpCostsHelpUrl: MP_COSTS_HELP_URL,
  });
}
