"use client";

import { useState } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { StatCard } from "@/components/business/StatCard";
import { SimpleBarChart } from "@/components/business/SimpleBarChart";
import { cn } from "@/lib/utils";
import {
  MOCK_BUSINESS,
  MOCK_BUSINESS_STATS,
  MOCK_RECENT_ORDERS,
  MOCK_WEEKLY_SALES,
  MOCK_DAYS,
  MOCK_PRODUCTS,
  MOCK_DRIVERS,
  MOCK_TUTORIAL_TASKS,
  RecentOrder,
  PanelProduct,
  TutorialTask,
} from "@/lib/mockData";

const PERIODS = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Esta semana" },
  { id: "month", label: "Este mes" },
];

const STATUS_CONFIG: Record<RecentOrder["status"], { icon: string; label: string; classes: string }> = {
  pending: { icon: "schedule", label: "Nuevo", classes: "bg-[#f2ece2] text-gray-600 dark:bg-[#231f1c] dark:text-gray-300" },
  accepted: { icon: "check_circle", label: "Aceptado", classes: "bg-[#f2ece2] text-gray-600 dark:bg-[#231f1c] dark:text-gray-300" },
  preparing: { icon: "skillet", label: "En Cocina", classes: "bg-[#9a0002]/10 text-[#9a0002]" },
  delivering: { icon: "two_wheeler", label: "En Camino", classes: "bg-[#9a0002]/10 text-[#9a0002]" },
  delivered: { icon: "task_alt", label: "Entregado", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  cancelled: { icon: "cancel", label: "Cancelado", classes: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
};

const TOUR_STEPS = [
  {
    id: "profile",
    title: "Logo y portada",
    body: "Subí el logo de tu local y una foto de portada atractiva. Es lo primero que ven los clientes en Cadenas destacadas.",
    hint: "Portada 1200×480 (≈2.5:1) · Logo 512×512 cuadrado",
    href: "/negocio/configuracion",
  },
  {
    id: "menu",
    title: "Cargá tu carta",
    body: "Agregá al menos 5 productos con foto, precio y categoría. Sin menú, el local no aparece en búsquedas.",
    hint: "Fotos de plato 800×600 · tocá + Nuevo producto en Carta",
    href: "/negocio/carta",
  },
  {
    id: "qr",
    title: "Menú QR",
    body: "Generá el QR para mesas y mostrador. Los clientes escanean y piden sin descargar nada.",
    hint: "Se genera solo cuando hay productos publicados",
    href: "/negocio/carta",
  },
  {
    id: "promos",
    title: "Primera promoción",
    body: "Creá un descuento de bienvenida. Las promos impulsan el primer pedido y mejoran el ranking.",
    hint: "Ej: 15% off en el primer pedido · válido 7 días",
    href: "/negocio/configuracion",
  },
  {
    id: "logistics",
    title: "Asociá un repartidor",
    body: "Invitá al menos un delivery o activá take away. Sin logística no se pueden completar pedidos.",
    hint: "Código de invitación desde Equipo → Asociar",
    href: "/negocio/equipo",
  },
];

const CARD =
  "bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.14)] rounded-[16px]";

function formatCurrency(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function TourModal({
  stepIndex,
  onClose,
  onPrev,
  onNext,
  onFinish,
}: {
  stepIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-label="Cerrar tour" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1c1917] rounded-[20px] shadow-2xl border border-black/[0.06] dark:border-[#3d3732] p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Paso {stepIndex + 1} de {TOUR_STEPS.length}
          </span>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#f2ece2] dark:hover:bg-[#231f1c] flex items-center justify-center text-gray-400 cursor-pointer">
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
            <div key={i} className={cn("h-1 flex-1 rounded-full", i <= stepIndex ? "bg-[#9a0002]" : "bg-[#ede4d9] dark:bg-[#3d3732]")} />
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
              href={step.href}
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

function MetricTile({
  title,
  period,
  value,
  delta,
  vs,
}: {
  title: string;
  period: string;
  value: string;
  delta: string;
  vs: string;
}) {
  return (
    <div className={cn(CARD, "p-5 flex flex-col gap-4")}>
      <div>
        <p className="text-[13px] font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{period}</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums">{value}</p>
        <p className="mt-1.5 text-xs font-semibold text-emerald-600">{delta}</p>
      </div>
      <p className="text-[11px] text-gray-400 mt-auto pt-2 border-t border-[#f0ebe4] dark:border-[#2a2623]">
        vs período ant. <span className="font-semibold text-gray-600 dark:text-gray-300">{vs}</span>
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState("month");
  const [isOpen, setIsOpen] = useState(MOCK_BUSINESS.isOpen);
  const [products, setProducts] = useState<PanelProduct[]>(MOCK_PRODUCTS.slice(0, 8));
  const [tasks, setTasks] = useState<TutorialTask[]>(MOCK_TUTORIAL_TASKS);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const s = MOCK_BUSINESS_STATS;
  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);
  const isTutorialComplete = progressPct === 100;
  const revenueDeltaPct = Math.round(((s.revenueMonth - s.revenueMonthLast) / s.revenueMonthLast) * 100);
  const ordersDeltaPct = Math.round(((s.ordersToday - s.ordersYesterday) / s.ordersYesterday) * 100);
  const pausedCount = products.filter((p) => !p.available).length;

  const heroRevenue =
    period === "today" ? s.revenueToday : period === "week" ? Math.round(s.revenueMonth / 4) : s.revenueMonth;
  const heroLabel = period === "today" ? "Ingresos de hoy" : period === "week" ? "Ingresos de la semana" : "Ingresos del mes";

  const startTour = () => {
    const firstIncomplete = TOUR_STEPS.findIndex((step) => !tasks.find((t) => t.id === step.id)?.completed);
    setTourStep(firstIncomplete >= 0 ? firstIncomplete : 0);
    setTourOpen(true);
  };

  const toggleProductStock = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));
  };

  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-200 max-w-[1280px] mx-auto">
      {tourOpen && (
        <TourModal
          stepIndex={tourStep}
          onClose={() => setTourOpen(false)}
          onPrev={() => setTourStep((i) => Math.max(0, i - 1))}
          onNext={() => setTourStep((i) => Math.min(TOUR_STEPS.length - 1, i + 1))}
          onFinish={() => {
            setTasks((prev) => prev.map((t) => ({ ...t, completed: true })));
            setTourOpen(false);
          }}
        />
      )}

      {/* Onboarding strip */}
      {!isTutorialComplete && (
        <div className={cn(CARD, "px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3")}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#9a0002]/10 text-[#9a0002] flex items-center justify-center flex-shrink-0">
              <MaterialSymbol icon="school" size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                Completá tu local · {progressPct}%
              </p>
              <p className="text-[11px] text-gray-400">
                {completedCount} de {tasks.length} pasos · el tour te guía qué subir
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setTasks((prev) => prev.map((t) => ({ ...t, completed: true })))}
              className="text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer px-2"
            >
              Simular 100%
            </button>
            <button
              type="button"
              onClick={startTour}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#9a0002] text-white text-xs font-bold cursor-pointer hover:bg-[#6b0001]"
            >
              <MaterialSymbol icon="play_arrow" size={16} fill />
              Iniciar tour
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-white p-5 md:p-7 shadow-[0_20px_50px_-24px_rgba(154,0,2,0.55)]">
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div
          className="pointer-events-none absolute top-3 right-3 w-28 h-28 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "7px 7px",
          }}
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-black/20 backdrop-blur-sm">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap",
                  period === p.id ? "bg-white text-[#6b0001] shadow-sm" : "text-white/65 hover:text-white"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-sm text-[12px] font-semibold cursor-pointer hover:bg-black/35 transition-colors"
          >
            <span className={cn("w-2 h-2 rounded-full", isOpen ? "bg-emerald-400 animate-pulse" : "bg-white/40")} />
            {isOpen ? "Abierto" : "Cerrado"}
          </button>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-[13px] font-medium text-white/65">{heroLabel}</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <h1 className="text-3xl md:text-4xl lg:text-[42px] font-bold tracking-tight tabular-nums leading-none">
                {formatCurrency(heroRevenue)}
              </h1>
              <span className="inline-flex items-center gap-0.5 mb-1 text-[13px] font-semibold text-[#f5d0a9]">
                <MaterialSymbol icon="trending_up" size={16} />
                +{revenueDeltaPct}%
              </span>
            </div>
            <p className="mt-2.5 text-[12px] text-white/50">
              {s.completedOrdersMonth} pedidos · ticket {formatCurrency(s.avgTicket)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/negocio/pedidos"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#faf6f1] text-[#6b0001] text-[13px] font-bold hover:bg-white transition-colors"
            >
              <MaterialSymbol icon="add" size={18} />
              Pedidos
            </Link>
            <Link
              href="/negocio/carta"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 border border-white/25 text-white text-[13px] font-semibold hover:bg-white/15 transition-colors"
            >
              Carta
            </Link>
            <Link
              href="/negocio/equipo"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 border border-white/25 text-white text-[13px] font-semibold hover:bg-white/15 transition-colors"
            >
              Equipo
            </Link>
          </div>
        </div>
      </section>

      {/* Chart + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className={cn(CARD, "lg:col-span-8 p-5 md:p-6")}>
          <div className="mb-1">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Ventas semanales</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Últimos 7 días</p>
          </div>
          <SimpleBarChart data={MOCK_WEEKLY_SALES} labels={MOCK_DAYS} />
        </section>

        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
          <StatCard
            large
            icon="task_alt"
            value={String(s.completedOrdersMonth)}
            label="Pedidos completados"
            delta={{ text: `+${ordersDeltaPct}% vs ayer`, direction: "up" }}
          />
          <StatCard
            large
            icon="receipt"
            value={formatCurrency(s.avgTicket)}
            label="Ticket promedio"
            delta={{ text: "+4% vs mes ant.", direction: "up" }}
          />
        </div>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricTile
          title="Pedidos activos"
          period="En tiempo real"
          value={String(s.activeOrders)}
          delta={`Resp. ~${s.avgResponseTimeMin} min`}
          vs={`${s.ordersToday} hoy`}
        />
        <MetricTile
          title="Tiempo de prep."
          period="Promedio mes"
          value={`${s.avgPrepTimeMin} min`}
          delta="−2.1% vs mes ant."
          vs={`${s.avgResponseTimeMin} min resp.`}
        />
        <MetricTile
          title="Valoración"
          period={`${MOCK_BUSINESS.reviewsCount} opiniones`}
          value={`${MOCK_BUSINESS.rating} ★`}
          delta="+0.2 vs mes ant."
          vs={`${pausedCount} platos pausados`}
        />
      </div>

      {/* Activity + local / stock / drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className={cn(CARD, "lg:col-span-8 p-5 md:p-6")}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Actividad reciente</h3>
            <Link href="/negocio/pedidos" className="text-[12px] font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
              Ver todos
            </Link>
          </div>

          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left min-w-[560px]">
              <thead>
                <tr className="text-[11px] font-medium text-gray-400">
                  <th className="pb-3 px-2 font-medium">Cliente</th>
                  <th className="pb-3 px-2 font-medium">Monto</th>
                  <th className="pb-3 px-2 font-medium">Estado</th>
                  <th className="pb-3 px-2 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT_ORDERS.map((order, idx) => {
                  const status = STATUS_CONFIG[order.status];
                  return (
                    <tr
                      key={order.id}
                      className={cn(
                        idx !== MOCK_RECENT_ORDERS.length - 1 && "border-b border-[#f0ebe4] dark:border-[#2a2623]"
                      )}
                    >
                      <td className="py-3.5 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f2ece2] dark:bg-[#231f1c] text-gray-700 dark:text-gray-300 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                            {order.customerName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {order.customerName}
                            </p>
                            <p className="text-[11px] text-gray-400">{order.time}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                          {formatCurrency(order.total)}
                        </p>
                        <p className="text-[11px] text-gray-400">#{order.orderNumber}</p>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap", status.classes)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-2">
                        <p className="text-[12px] text-gray-500">{order.itemsCount} items</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Stock — quiet strip under activity */}
          <div className="mt-6 pt-5 border-t border-[#f0ebe4] dark:border-[#2a2623]">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Stock rápido</p>
              <Link href="/negocio/carta" className="text-[11px] font-semibold text-gray-400 hover:text-gray-700">
                Ver carta
              </Link>
            </div>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-0.5">
              {products.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => toggleProductStock(prod.id)}
                  title={prod.available ? "Pausar" : "Activar"}
                  className={cn(
                    "flex items-center gap-2 min-w-[160px] px-2 py-1.5 rounded-full border cursor-pointer transition-colors",
                    prod.available
                      ? "bg-[#f8f4ee] border-transparent dark:bg-[#231f1c]"
                      : "bg-white border-dashed border-[#d6c8ba] opacity-60 dark:bg-[#1c1917] dark:border-[#3d3732]"
                  )}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-[#ede4d9] dark:bg-[#2a2623] flex-shrink-0">
                    {prod.image ? <img src={prod.image} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate flex-1 text-left">
                    {prod.name}
                  </span>
                  <MaterialSymbol
                    icon="favorite"
                    size={14}
                    fill={prod.available}
                    className={prod.available ? "text-[#9a0002]" : "text-gray-300"}
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4 flex flex-col gap-5">
          {/* My Cards style — dark cherry local */}
          <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#9a0002] to-[#4a0001] text-white p-5 shadow-[0_16px_40px_-20px_rgba(154,0,2,0.5)] min-h-[200px] flex flex-col">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.75) 1px, transparent 1px)",
                backgroundSize: "10px 10px",
                maskImage: "linear-gradient(135deg, black 20%, transparent 70%)",
                WebkitMaskImage: "linear-gradient(135deg, black 20%, transparent 70%)",
              }}
            />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                {MOCK_BUSINESS.logoImage ? (
                  <img src={MOCK_BUSINESS.logoImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">{MOCK_BUSINESS.initials.charAt(0)}</span>
                )}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/55">BolivarPide</span>
            </div>
            <div className="relative z-10 mt-auto pt-8 space-y-1">
              <p className="text-[11px] text-white/55">Tu local · Plan Free</p>
              <p className="text-lg font-bold tracking-tight truncate">{MOCK_BUSINESS.name}</p>
              <div className="flex items-center justify-between pt-2">
                <p className="text-[12px] text-white/70">
                  {MOCK_BUSINESS.rating} ★ · {MOCK_BUSINESS.reviewsCount}
                </p>
                <p className={cn("text-[12px] font-semibold", isOpen ? "text-[#f5d0a9]" : "text-white/45")}>
                  {isOpen ? "Abierto" : "Cerrado"}
                </p>
              </div>
            </div>
            <Link
              href="/negocio/configuracion"
              className="relative z-10 mt-4 block w-full text-center py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-[12px] font-semibold transition-colors"
            >
              Ver configuración
            </Link>
          </section>

          <section className={cn(CARD, "p-4")}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Deliveries</h3>
              <Link href="/negocio/equipo" className="text-[11px] font-semibold text-gray-400 hover:text-gray-700">
                Ver todos
              </Link>
            </div>
            <div className="space-y-2.5">
              {MOCK_DRIVERS.map((driver) => (
                <div key={driver.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#f2ece2] dark:bg-[#231f1c] text-gray-700 dark:text-gray-300 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                      {driver.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 truncate">{driver.name}</p>
                      <p className="text-[10px] text-gray-400">{driver.role}</p>
                    </div>
                  </div>
                  {driver.status === "available" ? (
                    <span className="text-[10px] font-semibold text-emerald-600">Libre</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-gray-400">#{driver.currentOrder}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
