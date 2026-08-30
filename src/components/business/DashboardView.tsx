"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { StatCard } from "@/components/business/StatCard";
import { SalesAreaChart, SalesChartLegend } from "@/components/business/SalesAreaChart";
import { MpPaymentsNotice } from "@/components/business/MpPaymentsNotice";
import { StoreSidePanel } from "@/components/StoreShowcase";
import { profileFromDbBusiness } from "@/lib/business/storeProfile";
import { toggleBusinessOpen, toggleProductAvailability, publishBusinessAction } from "@/lib/business/actions";
import { useUserProfile } from "@/components/UserProfileProvider";
import { flashToast } from "@/components/FlashToast";
import type {
  BusinessRow,
  DashboardRecentOrder,
  DashboardStockProduct,
  TutorialTask,
} from "@/lib/business/queries";
import type { DashboardMetrics, DashboardPeriod, SalesChartData } from "@/lib/business/dashboard";
import { cn } from "@/lib/utils";

const PERIODS: { id: DashboardPeriod; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; classes: string }
> = {
  pending: {
    label: "Nuevo",
    classes: "bg-gray-100 text-gray-600 dark:bg-[#231f1c] dark:text-gray-300",
  },
  accepted: {
    label: "Aceptado",
    classes: "bg-gray-100 text-gray-600 dark:bg-[#231f1c] dark:text-gray-300",
  },
  preparing: { label: "En Cocina", classes: "bg-[#9a0002]/10 text-[#9a0002]" },
  delivering: { label: "En Camino", classes: "bg-[#9a0002]/10 text-[#9a0002]" },
  ready: { label: "Listo", classes: "bg-[#9a0002]/10 text-[#9a0002]" },
  delivered: {
    label: "Entregado",
    classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  rejected: {
    label: "Rechazado",
    classes: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  },
  cancelled: {
    label: "Cancelado",
    classes: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  },
};

const TOUR_STEPS = [
  {
    id: "profile",
    title: "Logo y portada",
    body: "Subí el logo de tu local y una foto de portada atractiva. Es lo primero que ven los clientes en Cadenas destacadas.",
    hint: "Portada 1200×480 (≈2.5:1) · Logo 512×512 cuadrado",
    path: "configuracion",
  },
  {
    id: "menu",
    title: "Cargá tu carta",
    body: "Agregá al menos 5 productos con foto, precio y categoría. Sin menú, el local no aparece en búsquedas.",
    hint: "Fotos de plato 800×600 · tocá + Nuevo producto en Carta",
    path: "carta",
  },
  {
    id: "qr",
    title: "Menú QR",
    body: "Generá el QR para mesas y mostrador. Los clientes escanean y piden sin descargar nada.",
    hint: "Se genera solo cuando hay productos publicados",
    path: "carta",
  },
  {
    id: "promos",
    title: "Primera promoción",
    body: "Creá un descuento de bienvenida. Las promos impulsan el primer pedido y mejoran el ranking.",
    hint: "Ej: 15% off en el primer pedido · válido 7 días",
    path: "configuracion",
  },
  {
    id: "logistics",
    title: "Asociá un repartidor",
    body: "Invitá al menos un delivery o activá take away. Sin logística no se pueden completar pedidos.",
    hint: "Código de invitación desde Equipo → Asociar",
    path: "equipo",
  },
];

const CARD =
  "bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.14)] rounded-[16px]";

function formatCurrency(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("es-AR")}`;
}

function orderShortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function TourModal({
  businessId,
  stepIndex,
  onClose,
  onPrev,
  onNext,
  onFinish,
}: {
  businessId: string;
  stepIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const href = `/negocio/${businessId}/${step.path}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Cerrar tour"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1c1917] rounded-[20px] shadow-2xl border border-black/[0.06] dark:border-[#3d3732] p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Paso {stepIndex + 1} de {TOUR_STEPS.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#f2ece2] dark:hover:bg-[#231f1c] flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <MaterialSymbol icon="close" size={18} />
          </button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#9a0002]/10 text-[#9a0002] flex items-center justify-center mb-4">
          <MaterialSymbol icon="lightbulb" size={24} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{step.title}</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.body}</p>
        <div className="mt-4 px-3 py-2.5 rounded-xl bg-[#f2ece2] dark:bg-[#231f1c] text-[12px] font-medium text-gray-700 dark:text-gray-300 flex items-start gap-2">
          <MaterialSymbol icon="info" size={16} className="text-[#9a0002] flex-shrink-0 mt-0.5" />
          <span>{step.hint}</span>
        </div>

        <div className="mt-3 flex gap-1">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                i <= stepIndex ? "bg-[#9a0002]" : "bg-[#ede4d9] dark:bg-[#3d3732]",
              )}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={stepIndex === 0}
            className="px-3 py-2 rounded-full text-xs font-medium text-gray-500 disabled:opacity-30 hover:bg-[#f2ece2] dark:hover:bg-[#231f1c] cursor-pointer disabled:cursor-default"
          >
            Anterior
          </button>
          <div className="flex items-center gap-2">
            <Link
              href={href}
              onClick={onClose}
              className="px-3.5 py-2 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#3d3732] hover:bg-[#f2ece2] dark:hover:bg-[#231f1c]"
            >
              Ir a la sección
            </Link>
            {isLast ? (
              <button
                type="button"
                onClick={onFinish}
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#9a0002] text-white hover:bg-[#6b0001] cursor-pointer"
              >
                Listo
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold bg-[#9a0002] text-white cursor-pointer hover:brightness-110"
              >
                Siguiente
                <MaterialSymbol icon="arrow_forward" size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  businessId: string;
  period: DashboardPeriod;
  business: BusinessRow;
  metrics: DashboardMetrics;
  chart: SalesChartData;
  recentOrders: DashboardRecentOrder[];
  productsCount: number;
  stockProducts: DashboardStockProduct[];
  tasks: TutorialTask[];
};

export function DashboardView({
  businessId,
  period,
  business,
  metrics,
  chart,
  recentOrders,
  productsCount,
  stockProducts,
  tasks,
}: Props) {
  const router = useRouter();
  const { profile: userProfile } = useUserProfile();
  const [pending, startTransition] = useTransition();
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);
  const isTutorialComplete = progressPct === 100;

  const revenueLabel =
    period === "today" ? "Ingresos de hoy" : period === "week" ? "Ingresos semanales" : "Ingresos del mes";
  const ordersLabel =
    period === "today" ? "Pedidos entregados hoy" : "Pedidos entregados";

  const chartSeries = [
    { label: "Delivery", values: [...chart.delivery] },
    { label: "Take away", values: [...chart.takeaway] },
  ];

  const chartSubtitle =
    period === "today" ? "Hoy por hora" : period === "week" ? "Últimos 7 días" : "Por semana del mes";

  const profile = profileFromDbBusiness(business, productsCount);

  const startTour = () => {
    const firstIncomplete = TOUR_STEPS.findIndex(
      (step) => !tasks.find((t) => t.id === step.id)?.completed,
    );
    setTourStep(firstIncomplete >= 0 ? firstIncomplete : 0);
    setTourOpen(true);
  };

  const handleOpenToggle = () => {
    const next = !business.is_open;
    const fd = new FormData();
    fd.set("businessId", businessId);
    fd.set("isOpen", String(next));
    startTransition(async () => {
      await toggleBusinessOpen(fd);
      router.refresh();
    });
  };

  const handleStockToggle = (productId: string) => {
    const fd = new FormData();
    fd.set("businessId", businessId);
    fd.set("productId", productId);
    startTransition(async () => {
      await toggleProductAvailability(fd);
      router.refresh();
    });
  };

  const handlePublish = () => {
    startTransition(async () => {
      try {
        const result = await publishBusinessAction(businessId);
        flashToast("¡Tu negocio ya está publicado en BolivarPide!");
        router.refresh();
        if (result.slug) {
          window.open(`/c/${result.slug}?from=negocio`, "_blank");
        }
      } catch (err) {
        flashToast(err instanceof Error ? err.message : "No se pudo publicar.");
      }
    });
  };

  return (
    <div className="space-y-5 max-w-[1280px] mx-auto text-gray-800 dark:text-gray-200">
      {tourOpen && (
        <TourModal
          businessId={businessId}
          stepIndex={tourStep}
          onClose={() => setTourOpen(false)}
          onPrev={() => setTourStep((i) => Math.max(0, i - 1))}
          onNext={() => setTourStep((i) => Math.min(TOUR_STEPS.length - 1, i + 1))}
          onFinish={() => setTourOpen(false)}
        />
      )}

      {!isTutorialComplete && (
        <div className={cn(CARD, "px-4 py-2.5 flex items-center justify-between gap-3")}>
          <div className="flex items-center gap-2.5 min-w-0">
            <MaterialSymbol icon="school" size={18} className="text-[#9a0002] shrink-0" />
            <p className="text-[13px] text-gray-600 dark:text-gray-300 truncate">
              Completá tu local · <span className="font-semibold text-gray-900 dark:text-white">{progressPct}%</span>
              <span className="hidden sm:inline text-gray-400">
                {" "}
                · {completedCount}/{tasks.length} pasos
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={startTour}
            className="shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#9a0002] text-white text-[11px] font-bold cursor-pointer hover:bg-[#6b0001]"
          >
            <MaterialSymbol icon="play_arrow" size={14} fill />
            Tour
          </button>
        </div>
      )}

      <MpPaymentsNotice businessId={businessId} />

      {business.published ? (
        <div
          className={cn(
            CARD,
            "px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-emerald-500/20 bg-emerald-500/5",
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <MaterialSymbol icon="verified" size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" fill />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Negocio publicado</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                Visible en el inicio y búsquedas de BolivarPide
              </p>
            </div>
          </div>
          <Link
            href={`/c/${business.slug}?from=negocio`}
            target="_blank"
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-emerald-500/30 bg-white dark:bg-[#1c1917] text-[12px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <MaterialSymbol icon="storefront" size={16} />
            Ver tienda
          </Link>
        </div>
      ) : (
        <div className={cn(CARD, "px-4 py-3 flex flex-wrap items-center justify-between gap-3")}>
          <div className="flex items-center gap-2.5 min-w-0">
            <MaterialSymbol icon="public" size={20} className="text-[#9a0002] shrink-0" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Publicar negocio</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {userProfile.identityVerified
                  ? "Tu cuenta está verificada. Podés publicar para que aparezca en el inicio."
                  : "Verificá tu identidad en Mi perfil para publicar."}
              </p>
            </div>
          </div>
          {userProfile.identityVerified ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={pending}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#9a0002] text-white text-[12px] font-bold hover:brightness-110 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              <MaterialSymbol icon="rocket_launch" size={16} />
              Publicar ahora
            </button>
          ) : (
            <Link
              href="/?tab=profile&verify=dni"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#9a0002]/30 bg-[#9a0002]/8 text-[12px] font-bold text-[#9a0002] dark:text-red-300 hover:bg-[#9a0002]/15"
            >
              <MaterialSymbol icon="badge" size={16} />
              Verificar identidad
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          large
          icon="payments"
          value={formatCurrency(metrics.revenue)}
          label={revenueLabel}
          sparkline={[...metrics.sparkRevenue]}
          sparkColor="#9a0002"
        />
        <StatCard
          large
          icon="receipt_long"
          value={String(metrics.orders)}
          label={ordersLabel}
          sparkline={[...metrics.sparkOrders]}
          sparkColor="#059669"
        />
        <StatCard
          large
          icon="receipt"
          value={formatCurrency(metrics.avgTicket)}
          label="Ticket promedio"
          sparkline={[...metrics.sparkTicket]}
          sparkColor="#d97706"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
        <section className={cn(CARD, "p-5 md:p-6 overflow-hidden min-w-0 xl:row-start-1")}>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#f3efe8] dark:bg-[#231f1c] flex items-center justify-center">
                  <MaterialSymbol icon="payments" size={18} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Ventas</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">{chartSubtitle}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[#f3efe8] dark:bg-[#231f1c]">
                {PERIODS.map((p) => (
                  <Link
                    key={p.id}
                    href={`/negocio/${businessId}/dashboard?period=${p.id}`}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-[12px] font-medium transition-all whitespace-nowrap",
                      period === p.id
                        ? "bg-white dark:bg-[#1c1917] text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200",
                    )}
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
            <SalesChartLegend series={chartSeries} />
          </div>

          <SalesAreaChart
            labels={[...chart.labels]}
            series={chartSeries}
            formatValue={formatCurrency}
          />
        </section>

        <section className={cn(CARD, "overflow-hidden min-w-0 xl:col-start-1 xl:row-start-2")}>
          <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f3efe8] dark:bg-[#231f1c] flex items-center justify-center">
                <MaterialSymbol icon="receipt_long" size={18} className="text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Pedidos recientes</h3>
            </div>
            <Link
              href={`/negocio/${businessId}/pedidos`}
              className="text-[12px] font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Ver todos
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="px-5 md:px-6 pb-6 text-sm text-gray-500">Sin pedidos todavía.</p>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_80px_110px_100px_36px] gap-4 px-5 md:px-6 pb-3 text-[11px] font-medium text-gray-400 border-b border-[#f0ebe4] dark:border-[#2a2623]">
                <span>Cliente</span>
                <span>Detalle</span>
                <span>Hora</span>
                <span>Estado</span>
                <span className="text-right">Monto</span>
                <span />
              </div>

              <div className="divide-y divide-[#f0ebe4] dark:divide-[#2a2623]">
                {recentOrders.map((order) => {
                  const status = STATUS_CONFIG[order.status] ?? {
                    label: order.status,
                    classes: "bg-gray-100 text-gray-600",
                  };
                  return (
                    <div
                      key={order.id}
                      className="group grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_80px_110px_100px_36px] gap-x-4 gap-y-2 md:gap-4 md:items-center px-5 md:px-6 py-3.5 hover:bg-[#faf8f5] dark:hover:bg-[#231f1c]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 col-span-1 md:col-span-1">
                        <div className="w-9 h-9 rounded-full bg-[#f2ece2] dark:bg-[#231f1c] text-gray-700 dark:text-gray-300 font-semibold text-xs flex items-center justify-center shrink-0">
                          {order.customerName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {order.customerName}
                          </p>
                          <p className="text-[11px] text-gray-400">#{orderShortId(order.id)}</p>
                        </div>
                      </div>

                      <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md bg-[#f3efe8] dark:bg-[#231f1c] text-[11px] font-medium text-gray-500 dark:text-gray-400 w-fit">
                        {order.itemsCount} {order.itemsCount === 1 ? "item" : "items"} ·{" "}
                        {order.isDelivery ? "Delivery" : "Take away"}
                      </span>

                      <span className="hidden md:block text-[12px] text-gray-500 tabular-nums">
                        {order.time}
                      </span>

                      <span
                        className={cn(
                          "hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap w-fit",
                          status.classes,
                        )}
                      >
                        {status.label}
                      </span>

                      <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 tabular-nums text-right self-center">
                        {formatCurrency(order.total)}
                      </p>

                      <button
                        type="button"
                        className="hidden md:flex w-9 h-9 rounded-lg items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-[#f3efe8] dark:hover:bg-[#231f1c] opacity-0 group-hover:opacity-100 transition-all cursor-pointer justify-self-end"
                        aria-label="Más opciones"
                      >
                        <MaterialSymbol icon="more_vert" size={18} />
                      </button>

                      <div className="col-span-2 flex items-center gap-2 md:hidden">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold",
                            status.classes,
                          )}
                        >
                          {status.label}
                        </span>
                        <span className="text-[11px] text-gray-400">{order.time}</span>
                        <span className="text-[11px] text-gray-400">· {order.itemsCount} items</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <StoreSidePanel
          profile={profile}
          mode="owner"
          isOpen={business.is_open}
          onOpenToggle={handleOpenToggle}
          variant="card"
          compact
          fillHeight
          stockItems={stockProducts}
          onStockToggle={handleStockToggle}
          className={cn(
            "w-full xl:col-start-2 xl:row-start-1 xl:row-span-2 xl:h-full min-h-0",
            pending && "opacity-80 pointer-events-none",
          )}
        />
      </div>
    </div>
  );
}
