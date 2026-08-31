/**
 * Run: npx tsx src/lib/notifications/customerList.check.ts
 */
import assert from "node:assert/strict";
import { formatOrderItemsSummary } from "../orders/active";
import {
  activeOrderToNotification,
  buildCustomerNotificationList,
  mergeActiveIntoNotification,
} from "./customerList";
import type { ActiveCustomerOrder } from "../orders/active";
import type { AppNotification } from "./types";

assert.equal(
  formatOrderItemsSummary([
    { name: "Burger", quantity: 2, note: '__opts__:[{"label":"Bacon","priceCents":80000}]' },
    { name: "Fries", quantity: 1 },
  ]),
  "2× Burger (+Bacon) · 1× Fries",
);

const order: ActiveCustomerOrder = {
  orderId: "o1",
  orderNumber: 12,
  businessSlug: "boz",
  businessName: "Burger Boz",
  status: "preparing",
  totalCents: 530000,
  createdAt: new Date().toISOString(),
  paymentMethod: "cash",
  itemsSummary: "2× Burger (+Bacon)",
};

const n = activeOrderToNotification(order);
assert.equal(n.payload.ctaLabel, "Ver seguimiento");
assert.ok(n.payload.summary?.includes("Burger"));

const cancelled = activeOrderToNotification({
  ...order,
  status: "rejected",
  rejectionReason: "Sin stock de bacon",
});
assert.equal(cancelled.payload.statusLabel, "Pedido cancelado");
assert.equal(cancelled.payload.ctaLabel, undefined);
assert.equal(cancelled.payload.rejectionReason, "Sin stock de bacon");

const existing: AppNotification = {
  id: "db-1",
  category: "orders",
  priority: 0,
  title: "Pedido recibido",
  body: null,
  emoji: null,
  icon: null,
  actionUrl: "/pedido/o1",
  entityType: "order",
  entityId: "o1",
  businessId: null,
  payload: { statusLabel: "Pedido recibido", summary: "Pedido #12" },
  readAt: null,
  createdAt: order.createdAt,
};

const list = buildCustomerNotificationList([existing], {
  ...order,
  status: "rejected",
  rejectionReason: "Cerrado temprano",
});
assert.equal(list[0].payload.statusLabel, "Pedido cancelado");
assert.equal(list[0].payload.ctaLabel, undefined);
assert.equal(list.length, 1);

const merged = mergeActiveIntoNotification(existing, order);
assert.equal(merged.payload.itemsSummary, "2× Burger (+Bacon)");

console.log("customerList.check: ok");
