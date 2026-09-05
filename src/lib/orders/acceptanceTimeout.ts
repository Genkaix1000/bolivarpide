import { createServiceClient } from "@/lib/supabase/service";
import { refundMercadoPagoOrder } from "@/lib/mercadopago/refund";

/** Ventana para que el comercio acepte un pedido pagado (ARQUITECTURA: 3 min). */
export const ACCEPTANCE_TIMEOUT_MS = 3 * 60 * 1000;

type StaleAcceptanceOrder = {
  id: string;
  business_id: string;
  payment_status: string;
  payment_method: string | null;
  paid_at: string | null;
};

async function rejectStaleOrder(order: StaleAcceptanceOrder): Promise<void> {
  const svc = createServiceClient();
  const now = new Date().toISOString();

  // Transición condicional: solo un caller gana el rechazo (pending + paid). Si
  // el comercio ya lo aceptó en paralelo, `updated` es null → no reembolsamos.
  const { data: updated } = await svc
    .from("orders")
    .update({
      status: "rejected",
      rejection_reason: "No se aceptó a tiempo",
      rejected_at: now,
      updated_at: now,
    })
    .eq("id", order.id)
    .eq("status", "pending")
    .eq("payment_status", "paid")
    .select("id")
    .maybeSingle();
  if (!updated) return;

  if (order.payment_method && order.payment_method !== "cash") {
    await refundMercadoPagoOrder(order.id);
  }

  const { emitCustomerStatusNotification } = await import("@/lib/notifications/emit");
  void emitCustomerStatusNotification(order.id, "rejected");
}

/** Auto-rechazo puntual de un pedido pagado a la espera de aceptación (3 min). */
export async function maybeAutoRejectStaleOrder(orderId: string, userId: string): Promise<void> {
  const svc = createServiceClient();
  const { data: order } = await svc
    .from("orders")
    .select("id, business_id, payment_status, payment_method, paid_at")
    .eq("id", orderId)
    .eq("customer_user_id", userId)
    .eq("status", "pending")
    .eq("payment_status", "paid")
    .maybeSingle();
  if (!order?.paid_at) return;
  if (Date.now() - new Date(order.paid_at).getTime() < ACCEPTANCE_TIMEOUT_MS) return;

  await rejectStaleOrder(order as StaleAcceptanceOrder);
}

/** Barrido para un negocio (lazy, en la lectura de la cola). Devuelve cuántos rechazó. */
export async function autoRejectStalePaidOrders(businessId: string): Promise<number> {
  const svc = createServiceClient();
  const cutoff = new Date(Date.now() - ACCEPTANCE_TIMEOUT_MS).toISOString();
  const { data } = await svc
    .from("orders")
    .select("id, business_id, payment_status, payment_method, paid_at")
    .eq("business_id", businessId)
    .eq("status", "pending")
    .eq("payment_status", "paid")
    .lt("paid_at", cutoff)
    .limit(50);

  const stale = data ?? [];
  for (const order of stale) {
    await rejectStaleOrder(order as StaleAcceptanceOrder);
  }
  return stale.length;
}