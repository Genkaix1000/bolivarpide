import { DashboardView } from "@/components/business/DashboardView";
import { getBusinessDashboardData } from "@/lib/business/queries";
import type { DashboardPeriod } from "@/lib/business/dashboard";

function parsePeriod(raw: string | undefined): DashboardPeriod {
  if (raw === "today" || raw === "week" || raw === "month") return raw;
  return "month";
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { businessId } = await params;
  const { period: periodRaw } = await searchParams;
  const period = parsePeriod(periodRaw);

  const data = await getBusinessDashboardData(businessId, period);

  return (
    <DashboardView
      businessId={businessId}
      period={period}
      business={data.business}
      metrics={data.metrics}
      chart={data.chart}
      recentOrders={data.recentOrders}
      productsCount={data.productsCount}
      stockProducts={data.stockProducts}
      driversMetrics={data.driversMetrics}
      tasks={data.tasks}
    />
  );
}
