/**
 * Run: node --experimental-strip-types src/lib/business/dashboard.check.ts
 */
import assert from "node:assert/strict";
import {
  aggregateDriverMetrics,
  avgDeliveryMinutes,
  computeMetrics,
  computeSalesChart,
  type DashboardDriverRow,
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

// ---------------------------------------------------------------------------
// Métricas por repartidor
// ---------------------------------------------------------------------------

const driverRows: DashboardDriverRow[] = [
  { delivery_driver_id: "driver-1", status: "delivering", dispatched_at: null, delivered_at: null },
  { delivery_driver_id: "driver-1", status: "delivered", dispatched_at: "2026-09-05T12:00:00Z", delivered_at: "2026-09-05T12:18:00Z" },
  { delivery_driver_id: "driver-1", status: "delivered", dispatched_at: "2026-09-05T13:00:00Z", delivered_at: "2026-09-05T13:40:00Z" },
  { delivery_driver_id: "driver-2", status: "delivered", dispatched_at: "2026-09-05T14:00:00Z", delivered_at: "2026-09-05T14:10:00Z" },
  { delivery_driver_id: null, status: "delivering", dispatched_at: null, delivered_at: null },
  { delivery_driver_id: "driver-1", status: "pending", dispatched_at: null, delivered_at: null },
];

assert.equal(avgDeliveryMinutes(driverRows), 23, "promedio global (18+40+10)/3 = 23");
assert.equal(avgDeliveryMinutes([]), null);
assert.equal(avgDeliveryMinutes([{ delivery_driver_id: "x", status: "delivering", dispatched_at: null, delivered_at: null }]), null);

const agg = aggregateDriverMetrics(driverRows);
assert.equal(agg.length, 2, "ignora filas sin driver");
const d1 = agg.find((m) => m.driverId === "driver-1");
assert.ok(d1);
assert.equal(d1.enRuta, 1);
assert.equal(d1.entregados, 2);
assert.equal(d1.avgMinutes, 29);
const d2 = agg.find((m) => m.driverId === "driver-2");
assert.ok(d2);
assert.equal(d2.entregados, 1);
assert.equal(d2.avgMinutes, 10);
assert.ok(agg[0].driverId === "driver-1", "ordena por entregados desc");

console.log("dashboard.check.ts: ok");
