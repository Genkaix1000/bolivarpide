/** Dashboard metrics + chart from order rows (ponytail: RPC when >~2k orders/month). */

export type DashboardPeriod = "today" | "week" | "month";

export type DashboardOrderRow = {
  total_cents: number;
  status: string;
  created_at: string;
  delivery_address: string | null;
};

export type DashboardMetrics = {
  revenue: number;
  orders: number;
  avgTicket: number;
  sparkRevenue: number[];
  sparkOrders: number[];
  sparkTicket: number[];
};

export type SalesChartData = {
  labels: string[];
  delivery: number[];
  takeaway: number[];
  orders: number[];
  ticket: number[];
};

const TODAY_LABELS = ["9h", "11h", "13h", "15h", "17h", "19h", "21h", "23h"];
const TODAY_BUCKETS = [9, 11, 13, 15, 17, 19, 21, 23];
const WEEK_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_LABELS = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];

export function periodStart(period: DashboardPeriod): Date {
  const now = new Date();
  if (period === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function deliveredSince(orders: DashboardOrderRow[], start: Date) {
  return orders.filter(
    (o) => o.status === "delivered" && new Date(o.created_at) >= start,
  );
}

function sparkBuckets(period: DashboardPeriod): number {
  return period === "today" ? 8 : 7;
}

function bucketIndex(period: DashboardPeriod, createdAt: string, _start: Date): number {
  const d = new Date(createdAt);
  if (period === "today") {
    const h = d.getHours();
    for (let i = TODAY_BUCKETS.length - 1; i >= 0; i--) {
      if (h >= TODAY_BUCKETS[i]) return i;
    }
    return 0;
  }
  if (period === "week") {
    const day = (d.getDay() + 6) % 7; // Mon=0
    return day;
  }
  const dayOfMonth = d.getDate();
  return Math.min(3, Math.floor((dayOfMonth - 1) / 7));
}

function buildSpark(
  delivered: DashboardOrderRow[],
  period: DashboardPeriod,
  start: Date,
  field: "revenue" | "orders" | "ticket",
): number[] {
  const n = sparkBuckets(period);
  const sums = Array.from({ length: n }, () => 0);
  const counts = Array.from({ length: n }, () => 0);

  for (const o of delivered) {
    const i = bucketIndex(period, o.created_at, start);
    if (field === "revenue") sums[i] += o.total_cents;
    else if (field === "orders") sums[i] += 1;
    else {
      sums[i] += o.total_cents;
      counts[i] += 1;
    }
  }

  if (field === "ticket") {
    return sums.map((s, i) => (counts[i] > 0 ? Math.round(s / counts[i]) : 0));
  }
  return sums;
}

export function computeMetrics(
  orders: DashboardOrderRow[],
  period: DashboardPeriod,
): DashboardMetrics {
  const start = periodStart(period);
  const delivered = deliveredSince(orders, start);
  const revenue = delivered.reduce((s, o) => s + o.total_cents, 0);
  const count = delivered.length;
  const avgTicket = count > 0 ? Math.round(revenue / count) : 0;

  return {
    revenue,
    orders: count,
    avgTicket,
    sparkRevenue: buildSpark(delivered, period, start, "revenue"),
    sparkOrders: buildSpark(delivered, period, start, "orders"),
    sparkTicket: buildSpark(delivered, period, start, "ticket"),
  };
}

export function computeSalesChart(
  orders: DashboardOrderRow[],
  period: DashboardPeriod,
): SalesChartData {
  const start = periodStart(period);
  const delivered = deliveredSince(orders, start);
  const labels =
    period === "today" ? TODAY_LABELS : period === "week" ? WEEK_LABELS : MONTH_LABELS;
  const n = labels.length;

  const delivery = Array.from({ length: n }, () => 0);
  const takeaway = Array.from({ length: n }, () => 0);
  const orderCounts = Array.from({ length: n }, () => 0);
  const revenueSums = Array.from({ length: n }, () => 0);

  for (const o of delivered) {
    const i = bucketIndex(period, o.created_at, start);
    const cents = o.total_cents;
    if (o.delivery_address) delivery[i] += cents;
    else takeaway[i] += cents;
    orderCounts[i] += 1;
    revenueSums[i] += cents;
  }

  const ticket = revenueSums.map((s, i) =>
    orderCounts[i] > 0 ? Math.round(s / orderCounts[i]) : 0,
  );

  return { labels, delivery, takeaway, orders: orderCounts, ticket };
}
