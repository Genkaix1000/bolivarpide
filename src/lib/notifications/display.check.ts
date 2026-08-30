import assert from "node:assert/strict";
import {
  countUnreadByTab,
  dayGroupLabel,
  filterByTab,
  groupByDay,
  sortNotifications,
} from "./display";
import type { AppNotification } from "./types";

const now = new Date("2026-08-30T18:00:00-03:00").getTime();
const base = (over: Partial<AppNotification>): AppNotification => ({
  id: over.id ?? "1",
  category: over.category ?? "orders",
  priority: over.priority ?? 2,
  title: over.title ?? "Test",
  body: null,
  emoji: null,
  icon: null,
  actionUrl: null,
  entityType: null,
  entityId: null,
  businessId: over.businessId ?? null,
  payload: over.payload ?? {},
  readAt: over.readAt ?? null,
  createdAt: over.createdAt ?? "2026-08-30T17:00:00-03:00",
});

const sorted = sortNotifications([
  base({ id: "a", priority: 2, createdAt: "2026-08-30T16:00:00-03:00" }),
  base({ id: "b", priority: 0, createdAt: "2026-08-30T15:00:00-03:00" }),
  base({ id: "c", priority: 1, createdAt: "2026-08-30T17:30:00-03:00" }),
]);
assert.deepEqual(
  sorted.map((n) => n.id),
  ["b", "c", "a"],
);

assert.equal(dayGroupLabel("2026-08-30T17:00:00-03:00", now), "Hoy");
assert.equal(dayGroupLabel("2026-08-29T17:00:00-03:00", now), "Ayer");

const ordersOnly = filterByTab(
  [base({ category: "orders" }), base({ id: "2", category: "promos" })],
  "orders",
);
assert.equal(ordersOnly.length, 1);

const counts = countUnreadByTab(
  [
    base({ id: "1", category: "orders", readAt: null }),
    base({ id: "2", category: "payments", readAt: null }),
    base({ id: "3", category: "orders", readAt: "2026-08-30T12:00:00Z" }),
  ],
  ["all", "orders", "payments", "system", "promos"],
);
assert.equal(counts.all, 2);
assert.equal(counts.orders, 1);
assert.equal(counts.payments, 1);

const groups = groupByDay(
  [
    base({ id: "1", createdAt: "2026-08-30T17:00:00-03:00" }),
    base({ id: "2", createdAt: "2026-08-30T16:00:00-03:00" }),
    base({ id: "3", createdAt: "2026-08-29T12:00:00-03:00" }),
  ],
  now,
);
assert.equal(groups.length, 2);
assert.equal(groups[0]?.label, "Hoy");
assert.equal(groups[0]?.items.length, 2);

console.log("notifications/display.check.ts OK");
