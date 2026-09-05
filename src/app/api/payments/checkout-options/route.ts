import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  // Verificación de Escalera de Confianza para Pago en Efectivo (BP-9)
  let canPayCash = false;
  let cashDisabledReason: string | null = null;
  let completedOrdersCount = 0;

  if (!data.accepts_cash) {
    canPayCash = false;
    cashDisabledReason = "Este comercio no acepta efectivo";
  } else {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        canPayCash = false;
        cashDisabledReason = "Iniciá sesión para ver opciones de pago";
      } else {
        const { count } = await svc
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("customer_user_id", user.id)
          .eq("status", "delivered")
          .eq("payment_status", "paid");

        completedOrdersCount = count ?? 0;

        if (completedOrdersCount === 0) {
          canPayCash = false;
          cashDisabledReason =
            "El pago en efectivo se habilita a partir de tu segunda compra completada en la plataforma.";
        } else {
          const { data: activeCashOrder } = await svc
            .from("orders")
            .select("id")
            .eq("customer_user_id", user.id)
            .eq("payment_method", "cash")
            .in("status", ["pending", "accepted", "preparing", "ready_for_pickup", "delivering"])
            .maybeSingle();

          if (activeCashOrder) {
            canPayCash = false;
            cashDisabledReason =
              "Ya tenés un pedido en efectivo en curso. Podrás realizar otro cuando se complete la entrega.";
          } else {
            canPayCash = true;
            cashDisabledReason = null;
          }
        }
      }
    } catch {
      canPayCash = false;
      cashDisabledReason = "No se pudo verificar la disponibilidad de efectivo";
    }
  }

  return NextResponse.json({
    mpReady: data.mp_ready,
    acceptsCash: data.accepts_cash,
    offerQrPay: paySettings.offerQrPay,
    absorbFastPayFee: true, // El comercio siempre absorbe la comisión en la beta
    fastPaySurchargeBps: 0,
    qrDiscountBps: QR_DISCOUNT_BPS,
    mpCostsHelpUrl: MP_COSTS_HELP_URL,
    canPayCash,
    cashDisabledReason,
    completedOrdersCount,
  });
}
