"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessAccess } from "@/lib/business/queries";
import { createServiceClient } from "@/lib/supabase/service";
import { refundMercadoPagoOrder } from "@/lib/mercadopago/refund";
import {
  canBackward,
  canForward,
  normalizeLifecycleStatus,
  timestampPatch,
  type OrderLifecycleStatus,
} from "@/lib/orders/lifecycle";
import {
  generateDeliveryPin,
  isPinLocked,
  nextPinLock,
  PIN_MAX_ATTEMPTS,
  verifyDeliveryPin,
} from "@/lib/orders/deliveryPin";

const REJECT_MIN = 10;

function memberRole(member: { role: string } | null, isAdmin: boolean): string {
  if (isAdmin) return "owner";
  return member?.role ?? "staff";
}

export async function advanceOrderStatus(input: {
  businessId: string;
  orderId: string;
  targetStatus: OrderLifecycleStatus | "rejected";
  rejectionReason?: string;
  deliveryPin?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, member, isAdmin } = await requireBusinessAccess(input.businessId);
  const role = memberRole(member, isAdmin);

  const { data: row, error } = await supabase
    .from("orders")
    .select(
      "id, business_id, status, payment_status, payment_method, delivery_pin, pin_attempts, pin_locked_until",
    )
    .eq("id", input.orderId)
    .eq("business_id", input.businessId)
    .single();

  if (error || !row) return { ok: false, error: "Pedido no encontrado" };

  const current = normalizeLifecycleStatus(row.status);
  if (!current) return { ok: false, error: "Estado actual inválido" };

  const target = input.targetStatus;
  const now = new Date().toISOString();

  if (target === "rejected") {
    if (role === "driver") return { ok: false, error: "Sin permiso para rechazar" };
    if (current === "delivered" || current === "rejected") {
      return { ok: false, error: "No se puede rechazar" };
    }
    const reason = input.rejectionReason?.trim() ?? "";
    if (reason.length < REJECT_MIN) {
      return { ok: false, error: `Motivo mínimo ${REJECT_MIN} caracteres` };
    }

    const svc = createServiceClient();
    await svc
      .from("orders")
      .update({
        status: "rejected",
        rejection_reason: reason,
        delivery_pin: null,
        rejected_at: now,
        updated_at: now,
      })
      .eq("id", input.orderId);

    if (row.payment_status === "paid" && row.payment_method !== "cash") {
      await refundMercadoPagoOrder(input.orderId);
    }

    revalidatePath(`/negocio/${input.businessId}/pedidos`);
    return { ok: true };
  }

  if (!canForward(current, target)) {
    return { ok: false, error: `Transición ${current} → ${target} no permitida` };
  }

  const patch: Record<string, unknown> = {
    status: target,
    updated_at: now,
    ...timestampPatch(current, target, now),
  };

  if (target === "preparing" && row.payment_method === "cash" && row.payment_status === "awaiting_payment") {
    patch.payment_status = "paid";
    patch.paid_at = now;
  }

  if (target === "delivering") {
    patch.delivery_pin = generateDeliveryPin();
    patch.pin_attempts = 0;
    patch.pin_locked_until = null;
  }

  if (target === "delivered") {
    if (isPinLocked(row.pin_locked_until)) {
      return { ok: false, error: "PIN bloqueado por intentos fallidos" };
    }
    const pin = input.deliveryPin?.trim() ?? "";
    if (!verifyDeliveryPin(pin, row.delivery_pin)) {
      const attempts = (row.pin_attempts ?? 0) + 1;
      const lock = nextPinLock(attempts);
      await supabase
        .from("orders")
        .update({
          pin_attempts: attempts,
          pin_locked_until: lock,
          updated_at: now,
        })
        .eq("id", input.orderId);
      return {
        ok: false,
        error:
          attempts >= PIN_MAX_ATTEMPTS
            ? "PIN bloqueado 15 min"
            : "PIN incorrecto",
      };
    }
    patch.pin_attempts = 0;
  }

  const { error: updErr } = await supabase.from("orders").update(patch).eq("id", input.orderId);
  if (updErr) return { ok: false, error: updErr.message };

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

  const { data: row, error } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", input.orderId)
    .eq("business_id", input.businessId)
    .single();

  if (error || !row) return { ok: false, error: "Pedido no encontrado" };

  const current = normalizeLifecycleStatus(row.status);
  if (!current) return { ok: false, error: "Estado inválido" };

  const prev = canBackward(current);
  if (!prev) return { ok: false, error: "No se puede revertir" };

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: prev,
    updated_at: now,
    ...timestampPatch(current, prev, now),
  };

  const { error: updErr } = await supabase.from("orders").update(patch).eq("id", input.orderId);
  if (updErr) return { ok: false, error: updErr.message };

  revalidatePath(`/negocio/${input.businessId}/pedidos`);
  return { ok: true, status: prev };
}
