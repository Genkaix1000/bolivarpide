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

export function activeOrderToNotification(order: ActiveCustomerOrder): AppNotification {
  return {
    id: `active-${order.orderId}`,
    category: "orders",
    priority: 0,
    title: "Pedido recibido",
    body: null,
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
      summary: `Pedido #${order.orderNumber} · ${formatTotal(order.totalCents)}`,
      ctaLabel: "Ver seguimiento",
    },
    readAt: null,
    createdAt: order.createdAt,
  };
}

/** Cliente: prioridad primero, sin tabs; pedido activo arriba si no hay notif del mismo pedido. */
export function buildCustomerNotificationList(
  items: AppNotification[],
  activeOrder?: ActiveCustomerOrder | null,
): AppNotification[] {
  const sorted = sortNotifications(items);
  if (!activeOrder) return sorted;
  if (sorted.some((n) => n.entityId === activeOrder.orderId)) return sorted;
  return sortNotifications([activeOrderToNotification(activeOrder), ...sorted]);
}
