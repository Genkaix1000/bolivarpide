"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessAccess } from "@/lib/business/queries";
import { createServiceClient } from "@/lib/supabase/service";
import { insertNotification } from "@/lib/notifications/repository";
import { driverDisplayName } from "@/lib/delivery/queries";
import { assignmentBlockReason, isDeliveryManager } from "@/lib/delivery/rules";

function memberRole(member: { role: string } | null, isAdmin: boolean): string {
  if (isAdmin) return "owner";
  return member?.role ?? "staff";
}

type OrderAssignmentRow = {
  id: string;
  business_id: string;
  order_number: number | null;
  status: string;
  fulfillment_type: string | null;
  delivery_driver_id: string | null;
};

type OrderLookupResult =
  | { ok: true; order: OrderAssignmentRow }
  | { ok: false; error: string };

type DriverLookupResult =
  | { ok: true; driverName: string }
  | { ok: false; error: string };

async function getAssignableOrder(
  svc: ReturnType<typeof createServiceClient>,
  businessId: string,
  orderId: string,
): Promise<OrderLookupResult> {
  const { data: order, error } = await svc
    .from("orders")
    .select(
      "id, business_id, order_number, status, fulfillment_type, delivery_driver_id",
    )
    .eq("id", orderId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!order) return { ok: false, error: "Pedido no encontrado" };

  const row = order as OrderAssignmentRow;
  const block = assignmentBlockReason({
    status: row.status,
    fulfillment_type: row.fulfillment_type,
  });
  if (block) return { ok: false, error: block };
  return { ok: true, order: row };
}

async function resolveActiveDriver(
  svc: ReturnType<typeof createServiceClient>,
  businessId: string,
  driverId: string,
): Promise<DriverLookupResult> {
  const { data: member } = await svc
    .from("business_members")
    .select("user_id")
    .eq("business_id", businessId)
    .eq("user_id", driverId)
    .eq("role", "driver")
    .eq("status", "active")
    .maybeSingle();
  if (!member) {
    return { ok: false, error: "El repartidor no es miembro activo con rol driver" };
  }

  const driverName = await resolveDriverDisplayName(svc, driverId);
  return { ok: true, driverName };
}

async function resolveDriverDisplayName(
  svc: ReturnType<typeof createServiceClient>,
  driverId: string,
): Promise<string> {
  const { data: profile } = await svc
    .from("user_profiles")
    .select("first_name, last_name, display_name")
    .eq("user_id", driverId)
    .maybeSingle();
  return driverDisplayName(profile ?? undefined, null);
}

async function notifyDriver(input: {
  userId: string;
  businessId: string;
  orderId: string;
  orderNumber: number;
  title: string;
  body: string;
  dedupeKey: string;
}): Promise<void> {
  await insertNotification({
    userId: input.userId,
    businessId: input.businessId,
    category: "orders",
    priority: 1,
    title: input.title,
    body: input.body,
    emoji: "🛵",
    actionUrl: `/negocio/${input.businessId}/reparto`,
    entityType: "order",
    entityId: input.orderId,
    payload: {
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      ctaLabel: "Ver reparto",
    },
    dedupeKey: input.dedupeKey,
  });
}

// ---------------------------------------------------------------------------
// Asignar / reasignar (owner/staff)
// ---------------------------------------------------------------------------

export async function assignOrderToDriver(input: {
  businessId: string;
  orderId: string;
  driverId: string;
}): Promise<{ ok: true; driverName: string } | { ok: false; error: string }> {
  const { member, isAdmin } = await requireBusinessAccess(input.businessId);
  const role = memberRole(member, isAdmin);
  if (!isDeliveryManager(role)) {
    return { ok: false, error: "Sin permiso para asignar repartidor" };
  }

  const svc = createServiceClient();

  const found = await getAssignableOrder(svc, input.businessId, input.orderId);
  if (!found.ok) return found;
  const order = found.order;

  const driver = await resolveActiveDriver(svc, input.businessId, input.driverId);
  if (!driver.ok) return driver;

  // Reasignación: avisarle al repartidor anterior que ya no lleva el pedido.
  if (order.delivery_driver_id && order.delivery_driver_id !== input.driverId) {
    await notifyDriver({
      userId: order.delivery_driver_id,
      businessId: input.businessId,
      orderId: order.id,
      orderNumber: order.order_number ?? 0,
      title: `Pedido #${order.order_number ?? 0} reasignado`,
      body: "Ya no tenés asignado este pedido.",
      dedupeKey: `delivery_unassign:${order.id}`,
    });
  }

  const { error: updateError } = await svc
    .from("orders")
    .update({
      delivery_driver_id: input.driverId,
      assigned_at: new Date().toISOString(),
    })
    .eq("id", input.orderId)
    .eq("business_id", input.businessId)
    .in("status", ["preparing", "delivering"]);
  if (updateError) return { ok: false, error: updateError.message };

  await notifyDriver({
    userId: input.driverId,
    businessId: input.businessId,
    orderId: order.id,
    orderNumber: order.order_number ?? 0,
    title: `Nuevo pedido #${order.order_number ?? 0} asignado`,
    body: "Te lo asignaron para reparto.",
    dedupeKey: `delivery_assign:${order.id}`,
  });

  revalidatePath(`/negocio/${input.businessId}/reparto`);
  return { ok: true, driverName: driver.driverName };
}

// ---------------------------------------------------------------------------
// Quitar asignación (owner/staff)
// ---------------------------------------------------------------------------

export async function unassignOrder(input: {
  businessId: string;
  orderId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { member, isAdmin } = await requireBusinessAccess(input.businessId);
  const role = memberRole(member, isAdmin);
  if (!isDeliveryManager(role)) {
    return { ok: false, error: "Sin permiso para quitar repartidor" };
  }

  const svc = createServiceClient();
  const found = await getAssignableOrder(svc, input.businessId, input.orderId);
  if (!found.ok) return found;
  const order = found.order;
  if (!order.delivery_driver_id) {
    return { ok: false, error: "El pedido no tiene repartidor asignado" };
  }

  const { error: updateError } = await svc
    .from("orders")
    .update({ delivery_driver_id: null, assigned_at: null })
    .eq("id", input.orderId)
    .eq("business_id", input.businessId)
    .in("status", ["preparing", "delivering"]);
  if (updateError) return { ok: false, error: updateError.message };

  await notifyDriver({
    userId: order.delivery_driver_id,
    businessId: input.businessId,
    orderId: order.id,
    orderNumber: order.order_number ?? 0,
    title: `Pedido #${order.order_number ?? 0} reasignado`,
    body: "Ya no tenés asignado este pedido.",
    dedupeKey: `delivery_unassign:${order.id}`,
  });

  revalidatePath(`/negocio/${input.businessId}/reparto`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Tomar un pedido disponible (driver, race-safe)
// ---------------------------------------------------------------------------

export async function claimDeliveryOrder(input: {
  businessId: string;
  orderId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user, member, isAdmin } = await requireBusinessAccess(input.businessId);
  const role = memberRole(member, isAdmin);
  if (role !== "driver") {
    return { ok: false, error: "Solo repartidores pueden tomar pedidos" };
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("orders")
    .update({
      delivery_driver_id: user.id,
      assigned_at: new Date().toISOString(),
    })
    .eq("id", input.orderId)
    .eq("business_id", input.businessId)
    .eq("status", "delivering")
    .neq("fulfillment_type", "pickup")
    .is("delivery_driver_id", null)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) {
    return { ok: false, error: "Este pedido ya tiene un repartidor asignado" };
  }

  revalidatePath(`/negocio/${input.businessId}/reparto`);
  return { ok: true };
}