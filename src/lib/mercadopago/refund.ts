import { randomUUID } from "node:crypto";
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
    const refund = await mpFetch<{ id?: string }>(
      token,
      `/v1/payments/${encodeURIComponent(order.mp_payment_id)}/refunds`,
      {
        method: "POST",
        idempotencyKey: randomUUID(),
        body: JSON.stringify({}),
      },
    );

    await svc
      .from("orders")
      .update({
        payment_status: "refunded",
        refund_pending: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return { ok: true, refundId: refund.id };
  } catch (e) {
    await svc
      .from("orders")
      .update({ refund_pending: true, updated_at: new Date().toISOString() })
      .eq("id", orderId);
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
