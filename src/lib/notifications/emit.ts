import { trackingCopy } from "@/lib/orders/lifecycle";
import type { OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";
import { insertNotification } from "./repository";
import type { NotificationInput } from "./types";

function formatTotal(cents: number): string {
  return (cents / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function customerOrderPayload(input: {
  businessName: string;
  businessLogoUrl?: string;
  orderId: string;
  orderNumber: number;
  totalCents: number;
  statusLabel: string;
  itemsSummary?: string;
  rejectionReason?: string | null;
  ctaLabel?: string;
}): NotificationInput["payload"] {
  const money = formatTotal(input.totalCents);
  const summary = input.itemsSummary
    ? `${input.itemsSummary} · ${money}`
    : `Pedido #${input.orderNumber} · ${money}`;
  return {
    businessName: input.businessName,
    businessLogoUrl: input.businessLogoUrl,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    statusLabel: input.statusLabel,
    summary,
    itemsSummary: input.itemsSummary,
    rejectionReason: input.rejectionReason ?? undefined,
    ctaLabel: input.ctaLabel ?? "Ver seguimiento",
  };
}

async function businessMemberIds(businessId: string): Promise<string[]> {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const svc = createServiceClient();
  const { data } = await svc
    .from("business_members")
    .select("user_id")
    .eq("business_id", businessId)
    .eq("status", "active");
  return (data ?? []).map((m) => m.user_id);
}

async function notifyMembers(
  businessId: string,
  input: Omit<NotificationInput, "userId">,
): Promise<void> {
  const members = await businessMemberIds(businessId);
  await Promise.all(members.map((userId) => insertNotification({ ...input, userId })));
}

export async function notifyBusinessNewOrder(input: {
  businessId: string;
  orderId: string;
  orderNumber: number;
  customerName: string;
  totalCents: number;
  paymentMethod: string | null;
}): Promise<void> {
  const who = input.customerName.trim() || "Cliente";
  const total = (input.totalCents / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
  const payLabel =
    input.paymentMethod === "cash"
      ? "Efectivo"
      : input.paymentMethod?.startsWith("mercadopago")
        ? "Mercado Pago"
        : "Pago";

  await notifyMembers(input.businessId, {
    businessId: input.businessId,
    category: "orders",
    priority: 0,
    title: `Nuevo pedido #${input.orderNumber}`,
    body: `${who} · ${total} · ${payLabel}`,
    emoji: "🛒",
    actionUrl: `/negocio/${input.businessId}/pedidos`,
    entityType: "order",
    entityId: input.orderId,
    dedupeKey: `order_new:${input.orderId}`,
  });
}

export async function notifyBusinessPaymentConfirmed(input: {
  businessId: string;
  orderId: string;
  orderNumber: number;
  customerName: string;
  totalCents: number;
}): Promise<void> {
  const who = input.customerName.trim() || "Cliente";
  const total = (input.totalCents / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

  await notifyMembers(input.businessId, {
    businessId: input.businessId,
    category: "payments",
    priority: 0,
    title: `Pago confirmado · #${input.orderNumber}`,
    body: `${who} · ${total}`,
    emoji: "💳",
    actionUrl: `/negocio/${input.businessId}/pedidos`,
    entityType: "order",
    entityId: input.orderId,
    dedupeKey: `payment_paid:${input.orderId}`,
  });
}

export async function notifyBusinessOrderCancelled(input: {
  businessId: string;
  orderId: string;
  orderNumber: number;
  customerName: string;
}): Promise<void> {
  const who = input.customerName.trim() || "Cliente";
  await notifyMembers(input.businessId, {
    businessId: input.businessId,
    category: "orders",
    priority: 1,
    title: `Pedido cancelado · #${input.orderNumber}`,
    body: `${who} canceló antes del pago`,
    emoji: "✕",
    actionUrl: `/negocio/${input.businessId}/pedidos`,
    entityType: "order",
    entityId: input.orderId,
    dedupeKey: `order_cancelled:${input.orderId}`,
  });
}

export async function notifyBusinessOutOfStock(input: {
  businessId: string;
  productId: string;
  productName: string;
}): Promise<void> {
  await notifyMembers(input.businessId, {
    businessId: input.businessId,
    category: "system",
    priority: 2,
    title: `Sin stock: ${input.productName}`,
    body: "Actualizá la disponibilidad del producto",
    emoji: "📦",
    actionUrl: `/negocio/${input.businessId}/productos`,
    entityType: "product",
    entityId: input.productId,
    dedupeKey: `stock_out:${input.productId}`,
  });
}

export async function notifyCustomerOrderStatus(input: {
  userId: string;
  orderId: string;
  orderNumber: number;
  businessName: string;
  businessLogoUrl?: string;
  totalCents: number;
  status: OrderLifecycleStatus;
  fulfillmentType?: "delivery" | "pickup";
  itemsSummary?: string;
  rejectionReason?: string | null;
}): Promise<void> {
  const ft = input.fulfillmentType ?? "delivery";
  const { title, subtitle } = trackingCopy(input.status, undefined, ft);
  const cancelled = input.status === "rejected";
  const priority: 0 | 1 | 2 =
    input.status === "rejected" ? 0 : input.status === "delivered" ? 2 : 1;
  const body = cancelled && input.rejectionReason ? input.rejectionReason : subtitle;

  await insertNotification({
    userId: input.userId,
    category: "orders",
    priority,
    title,
    body,
    actionUrl: `/pedido/${input.orderId}`,
    entityType: "order",
    entityId: input.orderId,
    payload: customerOrderPayload({
      businessName: input.businessName,
      businessLogoUrl: input.businessLogoUrl,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      totalCents: input.totalCents,
      statusLabel: title,
      itemsSummary: input.itemsSummary,
      rejectionReason: input.rejectionReason,
      ctaLabel: cancelled ? undefined : "Ver seguimiento",
    }),
    dedupeKey: `order_status:${input.orderId}:${input.status}`,
  });
}

export async function notifyCustomerOrderReceived(input: {
  userId: string;
  orderId: string;
  orderNumber: number;
  businessName: string;
  businessLogoUrl?: string;
  totalCents: number;
  itemsSummary?: string;
}): Promise<void> {
  await insertNotification({
    userId: input.userId,
    category: "orders",
    priority: 0,
    title: "Pedido recibido",
    body: `${input.businessName} confirmó tu pedido`,
    actionUrl: `/pedido/${input.orderId}`,
    entityType: "order",
    entityId: input.orderId,
    payload: customerOrderPayload({
      businessName: input.businessName,
      businessLogoUrl: input.businessLogoUrl,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      totalCents: input.totalCents,
      statusLabel: "Pedido recibido",
      itemsSummary: input.itemsSummary,
    }),
    dedupeKey: `customer_received:${input.orderId}`,
  });
}

export async function notifyCustomerPaymentConfirmed(input: {
  userId: string;
  orderId: string;
  orderNumber: number;
  businessName: string;
  businessLogoUrl?: string;
  totalCents: number;
  itemsSummary?: string;
}): Promise<void> {
  await notifyCustomerOrderReceived(input);
}

async function loadOrderContext(orderId: string) {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const { formatOrderItemsSummary } = await import("@/lib/orders/active");
  const svc = createServiceClient();
  const { data } = await svc
    .from("orders")
    .select(
      "id, business_id, customer_user_id, customer_name, order_number, total_cents, payment_method, fulfillment_type, rejection_reason, businesses(name, logo_path), order_items(name, quantity, note)",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!data) return null;
  const business = (Array.isArray(data.businesses) ? data.businesses[0] : data.businesses) as
    | { name: string; logo_path: string | null }
    | null;
  const items = (data.order_items as { name: string; quantity: number; note?: string | null }[] | null) ?? [];
  return {
    orderId: data.id,
    businessId: data.business_id,
    customerUserId: data.customer_user_id as string | null,
    customerName: (data.customer_name as string | null) ?? "Cliente",
    orderNumber: (data.order_number as number | null) ?? 0,
    totalCents: data.total_cents as number,
    paymentMethod: data.payment_method as string | null,
    fulfillmentType: (data.fulfillment_type === "pickup" ? "pickup" : "delivery") as
      | "delivery"
      | "pickup",
    businessName: business?.name ?? "Local",
    businessLogoUrl: resolveBusinessAssetUrl(business?.logo_path ?? null),
    rejectionReason: (data.rejection_reason as string | null) ?? null,
    itemsSummary: formatOrderItemsSummary(items),
  };
}

export async function emitOrderPaidNotifications(orderId: string): Promise<void> {
  const ctx = await loadOrderContext(orderId);
  if (!ctx) return;

  await notifyBusinessPaymentConfirmed({
    businessId: ctx.businessId,
    orderId: ctx.orderId,
    orderNumber: ctx.orderNumber,
    customerName: ctx.customerName,
    totalCents: ctx.totalCents,
  });

  if (ctx.customerUserId) {
    await notifyCustomerPaymentConfirmed({
      userId: ctx.customerUserId,
      orderId: ctx.orderId,
      orderNumber: ctx.orderNumber,
      businessName: ctx.businessName,
      businessLogoUrl: ctx.businessLogoUrl,
      totalCents: ctx.totalCents,
      itemsSummary: ctx.itemsSummary,
    });
  }
}

export async function emitCashOrderNotifications(orderId: string): Promise<void> {
  const ctx = await loadOrderContext(orderId);
  if (!ctx) return;

  await notifyBusinessNewOrder({
    businessId: ctx.businessId,
    orderId: ctx.orderId,
    orderNumber: ctx.orderNumber,
    customerName: ctx.customerName,
    totalCents: ctx.totalCents,
    paymentMethod: ctx.paymentMethod,
  });

  if (ctx.customerUserId) {
    await notifyCustomerOrderReceived({
      userId: ctx.customerUserId,
      orderId: ctx.orderId,
      orderNumber: ctx.orderNumber,
      businessName: ctx.businessName,
      businessLogoUrl: ctx.businessLogoUrl,
      totalCents: ctx.totalCents,
      itemsSummary: ctx.itemsSummary,
    });
  }
}

export async function emitCustomerStatusNotification(
  orderId: string,
  status: OrderLifecycleStatus,
): Promise<void> {
  const ctx = await loadOrderContext(orderId);
  if (!ctx?.customerUserId) return;

  await notifyCustomerOrderStatus({
    userId: ctx.customerUserId,
    orderId: ctx.orderId,
    orderNumber: ctx.orderNumber,
    businessName: ctx.businessName,
    businessLogoUrl: ctx.businessLogoUrl,
    totalCents: ctx.totalCents,
    status,
    fulfillmentType: ctx.fulfillmentType,
    itemsSummary: ctx.itemsSummary,
    rejectionReason: ctx.rejectionReason,
  });
}

export async function emitOrderCancelledNotifications(orderId: string): Promise<void> {
  const ctx = await loadOrderContext(orderId);
  if (!ctx) return;

  await notifyBusinessOrderCancelled({
    businessId: ctx.businessId,
    orderId: ctx.orderId,
    orderNumber: ctx.orderNumber,
    customerName: ctx.customerName,
  });
}
