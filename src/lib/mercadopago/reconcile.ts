import { createServiceClient } from "@/lib/supabase/service";
import { getAccessTokenForBusiness } from "@/lib/mercadopago/repository";
import { mpFetch } from "@/lib/mercadopago/mp-fetch";

export type MpOrderResponse = {
  id: string;
  status?: string;
  transactions?: { payments?: { id?: string; reference_id?: string | number; status?: string }[] };
};

export type MpPaymentResponse = {
  id: number | string;
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
};

export function mapMpStatus(raw?: string): string {
  if (!raw) return "created";
  const s = raw.toLowerCase();
  if (s === "processed" || s === "approved") return "processed";
  if (s === "expired") return "expired";
  if (s === "cancelled" || s === "canceled" || s === "rejected") return "canceled";
  if (s === "failed") return "failed";
  return "created";
}

export function orderIdFromExternalRef(ref?: string | null): string | null {
  if (!ref?.startsWith("BP-")) return null;
  return ref.slice(3);
}

/**
 * Marca un pedido como pagado de forma idempotente y con verificación de monto:
 * - estado previo paid/refunded → no re-procesa;
 * - update condicional (solo unpaid/awaiting_payment) → un webhook tardío no
 *   re-flipea un pedido cancelado/refundado y un request concurrente no dobla.
 */
export async function markOrderPaid(
  orderId: string,
  paymentId: string | number | null,
  sessionId?: string,
) {
  const svc = createServiceClient();
  const { data: order } = await svc
    .from("orders")
    .select("id, business_id, payment_status, total_cents, mp_payment_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;
  if (order.payment_status === "paid" || order.payment_status === "refunded") return;

  // Verificación de monto (defensa en profundidad).
  if (paymentId != null && order.total_cents != null && order.total_cents > 0) {
    try {
      const token = await getAccessTokenForBusiness(order.business_id);
      const payment = await mpFetch<MpPaymentResponse>(
        token,
        `/v1/payments/${encodeURIComponent(String(paymentId))}`,
        { method: "GET" },
      );
      const remoteCents = Math.round(Number(payment.transaction_amount ?? 0) * 100);
      if (Math.abs(remoteCents - order.total_cents) > 1) return;
    } catch {
      return;
    }
  }

  const { data: updated } = await svc
    .from("orders")
    .update({
      payment_status: "paid",
      mp_payment_id: paymentId != null ? String(paymentId) : order.mp_payment_id ?? null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .in("payment_status", ["unpaid", "awaiting_payment"])
    .select("id")
    .maybeSingle();
  if (!updated) return;

  if (sessionId) {
    await svc
      .from("payment_sessions")
      .update({
        status: "processed",
        payment_id: paymentId != null ? String(paymentId) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
  }

  const { emitOrderPaidNotifications } = await import("@/lib/notifications/emit");
  void emitOrderPaidNotifications(orderId);
}

/** Reconciliación de una order QR MP con la sesión local. Devuelve el business_id resuelto. */
export async function reconcileOrder(mpOrderId: string): Promise<string | null> {
  const svc = createServiceClient();
  const { data: session } = await svc
    .from("payment_sessions")
    .select("id, business_id, order_id, status")
    .eq("mp_order_id", mpOrderId)
    .maybeSingle();
  if (!session) return null;

  const token = await getAccessTokenForBusiness(session.business_id);
  const remote = await mpFetch<MpOrderResponse>(token, `/v1/orders/${encodeURIComponent(mpOrderId)}`, {
    method: "GET",
  });
  const mapped = mapMpStatus(remote.status);
  const paymentId = remote.transactions?.payments?.[0]?.reference_id;

  if (mapped === session.status) return session.business_id;

  await svc
    .from("payment_sessions")
    .update({
      status: mapped,
      payment_id: paymentId != null ? String(paymentId) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (session.order_id && mapped === "processed") {
    await markOrderPaid(session.order_id, paymentId ?? null, session.id);
  } else if (session.order_id && (mapped === "expired" || mapped === "canceled")) {
    await svc.from("orders").update({ payment_status: "expired" }).eq("id", session.order_id);
  }
  return session.business_id;
}

/** Reconciliación de un payment MP (checkout_pro / fallback). Devuelve el business_id resuelto. */
export async function reconcilePayment(
  paymentId: string,
  mpUserId: string | null,
): Promise<string | null> {
  const svc = createServiceClient();
  let businessId: string | null = null;

  if (mpUserId) {
    const { data: conn } = await svc
      .from("mp_merchant_connections")
      .select("business_id")
      .eq("mp_user_id", mpUserId)
      .eq("status", "active")
      .maybeSingle();
    businessId = conn?.business_id ?? null;
  }

  if (!businessId) {
    const { data: fallbackSession } = await svc
      .from("payment_sessions")
      .select("business_id")
      .eq("channel", "checkout_pro")
      .eq("status", "created")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    businessId = fallbackSession?.business_id ?? null;
  }

  if (!businessId) return null;

  const token = await getAccessTokenForBusiness(businessId);
  const payment = await mpFetch<MpPaymentResponse>(
    token,
    `/v1/payments/${encodeURIComponent(paymentId)}`,
    { method: "GET" },
  );

  const orderId = orderIdFromExternalRef(payment.external_reference);
  if (!orderId) return businessId;

  const { data: session } = await svc
    .from("payment_sessions")
    .select("id, status, order_id")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const mapped = mapMpStatus(payment.status);
  if (session && mapped !== session.status) {
    await svc
      .from("payment_sessions")
      .update({
        status: mapped,
        payment_id: String(payment.id),
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);
  }

  if (mapped === "processed") {
    await markOrderPaid(orderId, payment.id, session?.id);
  } else if (mapped === "expired" || mapped === "canceled") {
    await svc.from("orders").update({ payment_status: "expired" }).eq("id", orderId);
  }
  return businessId;
}