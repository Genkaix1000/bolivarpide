"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireBusinessAccess } from "@/lib/business/queries";
import { refundMercadoPagoOrder } from "@/lib/mercadopago/refund";
import {
  canBackward,
  normalizeLifecycleStatus,
  type OrderLifecycleStatus,
} from "@/lib/orders/lifecycle";

const REJECT_MIN = 10;

function memberRole(member: { role: string } | null, isAdmin: boolean): string {
  if (isAdmin) return "owner";
  return member?.role ?? "staff";
}

type TransitionResult =
  | { ok: true; status: string; requires_refund?: boolean }
  | { ok: false; error: string };

export async function advanceOrderStatus(input: {
  businessId: string;
  orderId: string;
  targetStatus: OrderLifecycleStatus;
  rejectionReason?: string;
  deliveryPin?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, member, isAdmin } = await requireBusinessAccess(input.businessId);
  const role = memberRole(member, isAdmin);

  // `cancelled` es del cliente (cancelación pre-pago) o del sistema.
  if (input.targetStatus === "cancelled") {
    return { ok: false, error: "Operación no disponible desde el panel" };
  }
  if (input.targetStatus === "rejected" && role === "driver") {
    return { ok: false, error: "Sin permiso para rechazar" };
  }
  if (
    input.targetStatus === "rejected" &&
    (input.rejectionReason?.trim()?.length ?? 0) < REJECT_MIN
  ) {
    return { ok: false, error: `Motivo mínimo ${REJECT_MIN} caracteres` };
  }

  // La transición se valida y aplica de forma atómica en DB (RPC SECURITY
  // DEFINER): valida rol, transición válida, PIN en entrega y timestamps.
  const { data, error } = await supabase.rpc("transition_order_status", {
    p_order_id: input.orderId,
    p_business_id: input.businessId,
    p_new_status: input.targetStatus,
    p_rejection_reason: input.rejectionReason?.trim() ?? null,
    p_delivery_pin: input.deliveryPin?.trim() ?? null,
  });
  if (error) return { ok: false, error: error.message };

  const result = data as TransitionResult;
  if (!result?.ok) return { ok: false, error: result?.error ?? "No se pudo actualizar el pedido" };

  if (result.requires_refund) {
    await refundMercadoPagoOrder(input.orderId);
  }

  // `after()` corre estos side effects tras responder, pero DENTRO del ciclo de
  // vida del request: con `void` la promesa quedaba flotando y el runtime podía
  // congelar la función antes de que el aviso saliera (y un throw se volvía un
  // unhandled rejection).
  after(async () => {
    const { emitCustomerStatusNotification } = await import("@/lib/notifications/emit");
    try {
      await emitCustomerStatusNotification(input.orderId, input.targetStatus);
    } catch (err) {
      console.error("advanceOrderStatus: notificación in-app falló", err);
    }
  });

  // Red de seguridad de privacidad: al entregar se eliminan las posiciones GPS
  // compartidas del reparto (data sensible del recorrido). Idempotente.
  after(async () => {
    if (input.targetStatus !== "delivered") return;
    const { stopSharingLocationAction } = await import("@/lib/delivery/locationActions");
    try {
      await stopSharingLocationAction({
        businessId: input.businessId,
        orderId: input.orderId,
      });
    } catch (err) {
      console.error("advanceOrderStatus: limpieza de ubicaciones falló", err);
    }
  });

  after(async () => {
    const { notifyOrderStatusByWhatsApp } = await import("@/lib/whatsapp/templates");
    try {
      await notifyOrderStatusByWhatsApp(input.orderId, input.targetStatus);
    } catch (err) {
      console.error("advanceOrderStatus: aviso de WhatsApp falló", err);
    }
  });

  revalidatePath(`/negocio/${input.businessId}/pedidos`);
  return { ok: true };
}

export async function revertOrderStatus(input: {
  businessId: string;
  orderId: string;
}): Promise<{ ok: true; status: OrderLifecycleStatus } | { ok: false; error: string }> {
  const { supabase, member, isAdmin } = await requireBusinessAccess(input.businessId);
  const role = memberRole(member, isAdmin);
  if (role === "driver") return { ok: false, error: "Sin permiso" };

  const { data: row, error: rowErr } = await supabase
    .from("orders")
    .select("status")
    .eq("id", input.orderId)
    .eq("business_id", input.businessId)
    .maybeSingle();
  if (rowErr || !row) return { ok: false, error: "Pedido no encontrado" };

  const current = normalizeLifecycleStatus(row.status);
  if (!current) return { ok: false, error: "Estado inválido" };

  const target = canBackward(current);
  if (!target) return { ok: false, error: "No se puede revertir" };

  const { data, error } = await supabase.rpc("transition_order_status", {
    p_order_id: input.orderId,
    p_business_id: input.businessId,
    p_new_status: target,
    p_rejection_reason: null,
    p_delivery_pin: null,
  });
  if (error) return { ok: false, error: error.message };

  const result = data as TransitionResult;
  if (!result?.ok) return { ok: false, error: result?.error ?? "No se pudo revertir" };

  revalidatePath(`/negocio/${input.businessId}/pedidos`);
  return { ok: true, status: target };
}