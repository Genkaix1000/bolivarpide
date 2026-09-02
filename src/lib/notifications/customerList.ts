import { statusShortLabel } from "@/lib/orders/active";
import type { ActiveCustomerOrder } from "@/lib/orders/active";
import { sortNotifications } from "./display";
import type { AppNotification } from "./types";

function formatTotal(cents: number): string {
  return (cents / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function orderSummary(order: ActiveCustomerOrder): string {
  const money = formatTotal(order.totalCents);
  if (order.itemsSummary) return `${order.itemsSummary} · ${money}`;
  return `Pedido #${order.orderNumber} · ${money}`;
}

export function activeOrderToNotification(order: ActiveCustomerOrder): AppNotification {
  const cancelled = order.status === "rejected";
  return {
    id: `active-${order.orderId}`,
    category: "orders",
    priority: 0,
    title: cancelled ? "Pedido cancelado" : "Pedido recibido",
    body: cancelled ? (order.rejectionReason ?? "El local canceló tu pedido.") : null,
    emoji: null,
    icon: null,
    actionUrl: `/pedido/${order.orderId}`,
    entityType: "order",
    entityId: order.orderId,
    businessId: null,
    payload: {
      businessName: order.businessName,
      businessLogoUrl: order.businessLogoUrl,
      orderNumber: order.orderNumber,
      orderId: order.orderId,
      statusLabel: statusShortLabel(order.status),
      summary: orderSummary(order),
      itemsSummary: order.itemsSummary || undefined,
      rejectionReason: order.rejectionReason ?? undefined,
      ctaLabel: cancelled ? undefined : "Ver seguimiento",
    },
    readAt: null,
    createdAt: order.createdAt,
  };
}

/** Fusiona estado en vivo del pedido activo sobre una notif del mismo pedido. */
export function mergeActiveIntoNotification(
  item: AppNotification,
  order: ActiveCustomerOrder,
): AppNotification {
  const cancelled = order.status === "rejected";
  return {
    ...item,
    title: cancelled ? "Pedido cancelado" : item.title,
    body: cancelled ? (order.rejectionReason ?? item.body) : item.body,
    payload: {
      ...item.payload,
      businessName: order.businessName,
      businessLogoUrl: order.businessLogoUrl ?? item.payload.businessLogoUrl,
      orderNumber: order.orderNumber,
      orderId: order.orderId,
      statusLabel: statusShortLabel(order.status),
      summary: orderSummary(order),
      itemsSummary: order.itemsSummary || item.payload.itemsSummary,
      rejectionReason: order.rejectionReason ?? item.payload.rejectionReason,
      ctaLabel: cancelled ? undefined : (item.payload.ctaLabel ?? "Ver seguimiento"),
    },
  };
}

/** Cliente: prioridad primero; pedido activo arriba (merge si ya hay notif del mismo id). */
export function buildCustomerNotificationList(
  items: AppNotification[],
  activeOrder?: ActiveCustomerOrder | null,
): AppNotification[] {
  const sorted = sortNotifications(items);
  if (!activeOrder) return sorted;

  // Si el usuario descartó permanentemente la notificación de este pedido
  if (typeof window !== "undefined") {
    try {
      const dismissed = localStorage.getItem(`bp_dismissed_order_${activeOrder.orderId}`);
      if (dismissed) return sorted;
    } catch {
      /* ignore */
    }
  }

  // Verificar si la notificación sintética ya fue leída
  let activeReadAt: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const readKey = localStorage.getItem(`bp_read_order_${activeOrder.orderId}`);
      if (readKey === activeOrder.status) {
        activeReadAt = new Date().toISOString();
      }
    } catch {
      /* ignore */
    }
  }

  const idx = sorted.findIndex((n) => n.entityId === activeOrder.orderId);
  if (idx >= 0) {
    const merged = mergeActiveIntoNotification(sorted[idx], activeOrder);
    if (activeReadAt && !merged.readAt) {
      merged.readAt = activeReadAt;
    }
    return [merged, ...sorted.filter((_, i) => i !== idx)];
  }
  const notif = activeOrderToNotification(activeOrder);
  if (activeReadAt) {
    notif.readAt = activeReadAt;
  }
  return [notif, ...sorted];
}
