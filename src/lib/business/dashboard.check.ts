/**
 * Run: node --experimental-strip-types src/lib/business/dashboard.check.ts
 */
import assert from "node:assert/strict";
import {
  computeMetrics,
  computeSalesChart,
  type DashboardOrderRow,
} from "./dashboard";

const base = new Date();
const todayMorning = new Date(base);
todayMorning.setHours(10, 0, 0, 0);

const orders: DashboardOrderRow[] = [
  {
    total_cents: 10000,
    status: "delivered",
    created_at: todayMorning.toISOString(),
    delivery_address: "Mitre 1",
  },
  {
    total_cents: 5000,
    status: "delivered",
    created_at: todayMorning.toISOString(),
    delivery_address: null,
  },
  {
    total_cents: 8000,
    status: "pending",
    created_at: todayMorning.toISOString(),
    delivery_address: null,
  },
];

const m = computeMetrics(orders, "today");
assert.equal(m.revenue, 15000);
assert.equal(m.orders, 2);
assert.equal(m.avgTicket, 7500);

const chart = computeSalesChart(orders, "today");
assert.equal(chart.delivery[0] + chart.takeaway[0], 15000);

console.log("dashboard.check.ts: ok");
