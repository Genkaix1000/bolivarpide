import { createServiceClient } from "@/lib/supabase/service";
import { getAccessTokenForBusiness } from "@/lib/mercadopago/repository";
import { mpFetch } from "@/lib/mercadopago/mp-fetch";

export async function refundMercadoPagoOrder(orderId: string): Promise<{
  ok: boolean;
  refundId?: string;
  error?: string;
}> {
  const svc = createServiceClient();
  const { data: order, error } = await svc
    .from("orders")
    .select("id, business_id, payment_method, payment_status, mp_payment_id, refund_pending")
    .eq("id", orderId)
    .single();

  if (error || !order) return { ok: false, error: "Pedido no encontrado" };
  if (order.payment_status === "refunded") return { ok: true, refundId: "already" };
  if (order.payment_method === "cash") return { ok: true };
  if (!order.mp_payment_id) return { ok: false, error: "Sin payment_id de MP" };

  try {
    const token = await getAccessTokenForBusiness(order.business_id);
    // Reserva atómica: solo un caller puede pasar de paid → refunded. Si otro
    // request concurrente ya la ganó (o el pedido dejó de estar paid), no
    // llamamos a MP → no hay doble refund.
    const { data: reserved, error: reserveErr } = await svc
      .from("orders")
      .update({
        payment_status: "refunded",
        refund_pending: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("payment_status", "paid")
      .select("id")
      .maybeSingle();
    if (reserveErr) return { ok: false, error: reserveErr.message };
    if (!reserved) return { ok: true, refundId: "already" };

    const refund = await mpFetch<{ id?: string }>(
      token,
      `/v1/payments/${encodeURIComponent(order.mp_payment_id)}/refunds`,
      {
        method: "POST",
        // Key ESTABLE por pago: un reintento de la misma operación reusa la key
        // en MP (respuesta idéntica), en vez de generar un refund nuevo.
        idempotencyKey: `refund-${order.mp_payment_id}`,
        body: JSON.stringify({}),
      },
    );

    if (refund.id) {
      await svc.from("orders").update({ refund_mp_id: refund.id }).eq("id", orderId);
    }
    return { ok: true, refundId: refund.id };
  } catch (e) {
    // Revertir la reserva: el reembolso no se concretó en MP.
    await svc
      .from("orders")
      .update({
        payment_status: "paid",
        refund_pending: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("payment_status", "refunded");
    return { ok: false, error: e instanceof Error ? e.message : "Refund falló" };
  }
}

/** Mockable entry for tests */
export type RefundDeps = {
  fetchRefund: (paymentId: string) => Promise<{ id?: string }>;
  markRefunded: (orderId: string) => Promise<void>;
  markPending: (orderId: string) => Promise<void>;
};

export async function refundWithDeps(
  order: {
    id: string;
    payment_method: string | null;
    payment_status: string;
    mp_payment_id: string | null;
  },
  deps: RefundDeps,
): Promise<{ ok: boolean; refundId?: string; error?: string }> {
  if (order.payment_status === "refunded") return { ok: true, refundId: "already" };
  if (order.payment_method === "cash") return { ok: true };
  if (!order.mp_payment_id) return { ok: false, error: "Sin payment_id" };
  try {
    const refund = await deps.fetchRefund(order.mp_payment_id);
    await deps.markRefunded(order.id);
    return { ok: true, refundId: refund.id };
  } catch (e) {
    await deps.markPending(order.id);
    return { ok: false, error: e instanceof Error ? e.message : "fail" };
  }
}
