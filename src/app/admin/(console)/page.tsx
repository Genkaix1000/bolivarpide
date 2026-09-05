import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin/platform";
import { getNetworkKpis, getTopBusinesses } from "@/lib/admin/queries";
import { ShellPageHeader, shellType } from "@/components/shell/ShellPageHeader";
import { cn } from "@/lib/utils";

function pesos(cents: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function AdminDashboardPage() {
  const { platformRole } = await requirePlatformAdmin();
  const finance = platformRole === "superadmin";
  const [kpis, top] = await Promise.all([
    getNetworkKpis(finance),
    getTopBusinesses(finance),
  ]);

  const cards: { label: string; value: string; sub?: string }[] = [
    {
      label: "Locales",
      value: String(kpis.businessesTotal),
      sub: `${kpis.businessesOpen} abiertos · ${kpis.businessesPublished} publicados · ${kpis.businessesDraft} borrador`,
    },
    {
      label: "Usuarios",
      value: String(kpis.usersTotal),
    },
    {
      label: "Pedidos entregados",
      value: String(kpis.ordersDelivered),
      sub: `Hoy ${kpis.ordersToday} · 7d ${kpis.orders7d}`,
    },
    {
      label: "Tasa de éxito",
      value: kpis.successRate != null ? `${kpis.successRate}%` : "—",
    },
  ];

  if (finance) {
    cards.push(
      {
        label: "GMV",
        value: pesos(kpis.gmvCents ?? 0),
        sub:
          kpis.gmvMonthCents != null
            ? `Mes ${pesos(kpis.gmvMonthCents)} · ant. ${pesos(kpis.gmvPrevMonthCents ?? 0)}`
            : undefined,
      },
      {
        label: "Ticket promedio",
        value: pesos(kpis.ticketAvgCents ?? 0),
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <ShellPageHeader
        title="Red BolivarPide"
        description="Salud operativa de la plataforma"
        as="h2"
        actions={
          <Link
            href="/admin/comercios"
            className="rounded-full bg-[#9a0002] px-4 py-2 text-[13px] font-semibold text-white"
          >
            Ver comercios
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[#e8e0d6] bg-white p-4 dark:border-[#3d3732] dark:bg-[#1c1917]"
          >
            <p className={shellType.section}>{c.label}</p>
            <p className={cn("mt-1", shellType.kpi)}>{c.value}</p>
            {c.sub && <p className="mt-1 text-[11px] font-medium text-stone-400">{c.sub}</p>}
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-[#e8e0d6] bg-white p-4 dark:border-[#3d3732] dark:bg-[#1c1917]">
        <h3 className="mb-3 text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Top 5 del mes {finance ? "(facturación)" : "(pedidos)"}
        </h3>
        {top.length === 0 ? (
          <p className="text-sm text-stone-400">Sin pedidos entregados este mes.</p>
        ) : (
          <ul className="divide-y divide-[#e8e0d6] dark:divide-[#3d3732]">
            {top.map((b, i) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#9a0002]/10 text-xs font-black text-[#9a0002]">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.name}</p>
                    <p className="text-[11px] text-stone-400">/{b.slug}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold">{b.orders} pedidos</p>
                  {b.gmvCents != null && (
                    <p className="text-[11px] text-stone-400">{pesos(b.gmvCents)}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
