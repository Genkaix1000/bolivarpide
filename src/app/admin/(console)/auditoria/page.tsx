import { Suspense } from "react";
import { requirePlatformSuperadmin } from "@/lib/admin/platform";
import { listAuditLogs } from "@/lib/admin/queries";
import { LogExplorer } from "@/components/admin/LogExplorer";

export default async function AdminAuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; period?: string; q?: string }>;
}) {
  await requirePlatformSuperadmin();
  const sp = await searchParams;
  const periodHours = Number(sp.period) || 24;
  const action = sp.action || "all";
  const q = sp.q || "";
  const { rows, total, buckets } = await listAuditLogs({
    action,
    periodHours,
    q,
  });

  return (
    <Suspense fallback={<p className="text-sm text-stone-400">Cargando logs…</p>}>
      <LogExplorer
        rows={rows}
        total={total}
        buckets={buckets}
        initialAction={action}
        initialPeriod={periodHours}
        initialQ={q}
      />
    </Suspense>
  );
}
