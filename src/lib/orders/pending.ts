import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessTokenForBusiness } from "@/lib/mercadopago/repository";
import { mpFetch } from "@/lib/mercadopago/mp-fetch";
import { expirePaymentSession } from "@/lib/mercadopago/expire";

export type PendingCustomerOrder = {
  orderId: string;
  businessSlug: string;
  businessName: string;
  amountCents: number;
  paymentMethod: "mercadopago_qr" | "mercadopago_fast" | "cash";
  channel: "qr_dynamic" | "checkout_pro" | "cash" | null;
  qrData: string | null;
  expiresAt: string | null;
};

export async function getPendingCustomerOrder(userId: string): Promise<PendingCustomerOrder | null> {
  const svc = createServiceClient();
  const { data: order, error } = await svc
    .from("orders")
    .select(
      `
      id,
      payment_method,
      total_cents,
      active_payment_session_id,
      businesses!inner(slug, name)
    `,
    )
    .eq("customer_user_id", userId)
    .eq("payment_status", "awaiting_payment")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!order) return null;

  const business = (Array.isArray(order.businesses) ? order.businesses[0] : order.businesses) as {
    slug: string;
    name: string;
  };
  const paymentMethod = order.payment_method as PendingCustomerOrder["paymentMethod"] | null;

  // Efectivo confirmado en checkout → pedido activo, no pago pendiente
  if (paymentMethod === "cash") return null;

  if (!order.active_payment_session_id) return null;

  const { data: session } = await svc
    .from("payment_sessions")
    .select("id, business_id, order_id, channel, mp_order_id, qr_data, expires_at, status")
    .eq("id", order.active_payment_session_id)
    .maybeSingle();

  if (!session) return null;
  if (session.status !== "created") return null;
  if (session.expires_at && new Date(session.expires_at) <= new Date()) {
    // Lazy expiry (WS4): la sesión venció → cancelar la order QR remota y marcar
    // la expiración localmente en vez de descartar en silencio.
    await expirePaymentSession(session);
    return null;
  }

  return {
    orderId: order.id,
    businessSlug: business.slug,
    businessName: business.name,
    amountCents: order.total_cents ?? 0,
    paymentMethod: paymentMethod ?? "mercadopago_qr",
    channel: session.channel as PendingCustomerOrder["channel"],
    qrData: session.qr_data,
    expiresAt: session.expires_at,
  };
}

export async function cancelPendingCustomerOrder(orderId: string, userId: string): Promise<void> {
  const svc = createServiceClient();
  const { data: order, error } = await svc
    .from("orders")
    .select("id, business_id, customer_user_id, payment_status, status, active_payment_session_id")
    .eq("id", orderId)
    .single();

  if (error || !order) throw new Error("Pedido no encontrado");
  if (order.customer_user_id !== userId) throw new Error("No autorizado");
  if (order.status !== "pending" || order.payment_status !== "awaiting_payment") {
    throw new Error("Este pedido ya no se puede cancelar");
  }

  if (order.active_payment_session_id) {
    const { data: session } = await svc
      .from("payment_sessions")
      .select("id, channel, mp_order_id, status")
      .eq("id", order.active_payment_session_id)
      .maybeSingle();

    if (session?.status === "created" && session.channel === "qr_dynamic" && session.mp_order_id) {
      try {
        const token = await getAccessTokenForBusiness(order.business_id);
        await mpFetch(token, `/v1/orders/${session.mp_order_id}/cancel`, {
          method: "POST",
          idempotencyKey: randomUUID(),
          body: JSON.stringify({}),
        });
      } catch {
        // ponytail: MP cancel best-effort; local cancel still proceeds
      }
    }

    await svc
      .from("payment_sessions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("id", order.active_payment_session_id);
  }

  const { error: updErr } = await svc
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: "failed",
      active_payment_session_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (updErr) throw updErr;

  const { emitOrderCancelledNotifications } = await import("@/lib/notifications/emit");
  void emitOrderCancelledNotifications(orderId);
}
