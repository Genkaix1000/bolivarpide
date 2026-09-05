import { createServiceClient } from "@/lib/supabase/service";
import { getAccessTokenForBusiness } from "@/lib/mercadopago/repository";
import { mpFetch } from "@/lib/mercadopago/mp-fetch";

export type ExpirableSession = {
  id: string;
  business_id: string;
  order_id: string | null;
  channel: string;
  mp_order_id: string | null;
  status: string;
  expires_at: string | null;
};

/**
 * Expira una sesión de pago vencida (lazy, al consultar el pedido): cancela la
 * order QR remota en MP (best-effort) y marca la sesión + el pedido como
 * expirados con update condicional (no pisa un pedido que ya pagó vía webhook
 * en la carrera pago-vs-expiración).
 */
export async function expirePaymentSession(session: ExpirableSession): Promise<void> {
  if (
    session.status === "expired" ||
    session.status === "canceled" ||
    session.status === "failed" ||
    session.status === "processed"
  ) {
    return;
  }

  const svc = createServiceClient();

  if (session.channel === "qr_dynamic" && session.mp_order_id) {
    try {
      const token = await getAccessTokenForBusiness(session.business_id);
      await mpFetch(token, `/v1/orders/${encodeURIComponent(session.mp_order_id)}/cancel`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    } catch {
      // best-effort: si la cancelación remota falla, la expiración local sigue igual.
    }
  }

  await svc
    .from("payment_sessions")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("id", session.id);

  if (session.order_id) {
    await svc
      .from("orders")
      .update({ payment_status: "expired" })
      .eq("id", session.order_id)
      .in("payment_status", ["unpaid", "awaiting_payment"]);
  }
}