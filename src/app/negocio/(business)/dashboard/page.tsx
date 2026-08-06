"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  pending: { icon: "schedule", label: "Nuevo", classes: "bg-[#f2ece2] text-gray-700 dark:bg-[#231f1c] dark:text-gray-300" },
  accepted: { icon: "check_circle", label: "Aceptado", classes: "bg-[#f2ece2] text-gray-700 dark:bg-[#231f1c] dark:text-gray-300" },
  preparing: { icon: "skillet", label: "En Cocina", classes: "bg-[#9a0002]/10 text-[#9a0002]" },
  delivering: { icon: "two_wheeler", label: "En Camino", classes: "bg-[#9a0002]/10 text-[#9a0002]" },
  delivered: { icon: "task_alt", label: "Entregado", classes: "bg-[#f2ece2] text-gray-700 dark:bg-[#231f1c] dark:text-gray-300" },
  cancelled: { icon: "cancel", label: "Cancelado", classes: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
};

/** Hardcoded onboarding tour — wire to real routes/uploads later */
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
  "bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_10px_40px_-16px_rgba(61,43,31,0.18)] rounded-[24px]";

function formatCurrency(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function ProgressRing({ pct, children }: { pct: number; children: ReactNode }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="relative w-[124px] h-[124px] flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" className="stroke-[#ede4d9] dark:stroke-[#3d3732]" strokeWidth="4.5" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#9a0002"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="w-[64px] h-[64px] rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-white font-black text-lg ring-4 ring-white dark:ring-[#1c1917]">
        {children}
      </div>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-white dark:bg-[#231f1c] text-[10px] font-black text-gray-700 dark:text-gray-200 shadow-sm border border-black/[0.04]">
        {pct}%
      </span>
    </div>
  );
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
      <div className="relative w-full max-w-md bg-white dark:bg-[#1c1917] rounded-[24px] shadow-2xl border border-black/[0.06] dark:border-[#3d3732] p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Paso {stepIndex + 1} de {TOUR_STEPS.length}
          </span>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#f2ece2] dark:hover:bg-[#231f1c] flex items-center justify-center text-gray-400 cursor-pointer">
            <MaterialSymbol icon="close" size={18} />
          </button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#9a0002]/10 text-[#9a0002] flex items-center justify-center mb-4">
          <MaterialSymbol icon="lightbulb" size={24} />
        </div>
        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{step.title}</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.body}</p>
        <div className="mt-4 px-3 py-2.5 rounded-xl bg-[#f2ece2] dark:bg-[#231f1c] text-[12px] font-bold text-gray-700 dark:text-gray-300 flex items-start gap-2">
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
            className="px-3 py-2 rounded-full text-xs font-bold text-gray-500 disabled:opacity-30 hover:bg-[#f2ece2] dark:hover:bg-[#231f1c] cursor-pointer disabled:cursor-default"
          >
            Anterior
          </button>
          <div className="flex items-center gap-2">
            <Link
              href={step.href}
              onClick={onClose}
              className="px-3.5 py-2 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#3d3732] hover:bg-[#f2ece2] dark:hover:bg-[#231f1c]"
            >
              Ir a la sección
            </Link>
            {isLast ? (
              <button
                type="button"
                onClick={onFinish}
                className="px-4 py-2 rounded-full text-xs font-black bg-[#9a0002] text-white hover:bg-[#6b0001] cursor-pointer"
              >
                Listo
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-black bg-[#9a0002] text-white cursor-pointer hover:brightness-110"
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

export default function DashboardPage() {
  const [period, setPeriod] = useState("today");
  const [isOpen, setIsOpen] = useState(MOCK_BUSINESS.isOpen);
  const [products, setProducts] = useState<PanelProduct[]>(MOCK_PRODUCTS.slice(0, 8));
  const [tasks, setTasks] = useState<TutorialTask[]>(MOCK_TUTORIAL_TASKS);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const stockRef = useRef<HTMLDivElement>(null);
  const [stockScroll, setStockScroll] = useState({ isAtStart: true, isAtEnd: false });

  const s = MOCK_BUSINESS_STATS;
  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);
  const isTutorialComplete = progressPct === 100;
  const ratingPct = Math.round((MOCK_BUSINESS.rating / 5) * 100);
  const revenueDeltaPct = Math.round(((s.revenueMonth - s.revenueMonthLast) / s.revenueMonthLast) * 100);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  useEffect(() => {
    const el = stockRef.current;
    if (!el) return;
    const check = () => {
      setStockScroll({
        isAtStart: el.scrollLeft <= 10,
        isAtEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 15,
      });
    };
    check();
    el.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [products.length]);

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const toggleProductStock = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));
  };

  const startTour = () => {
    const firstIncomplete = TOUR_STEPS.findIndex((s) => !tasks.find((t) => t.id === s.id)?.completed);
    setTourStep(firstIncomplete >= 0 ? firstIncomplete : 0);
    setTourOpen(true);
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[28px] font-black text-gray-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Resumen general del rendimiento de tu negocio
          </p>
        </div>

        <div className={cn(CARD, "flex items-center gap-1 p-1 w-fit")}>
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap",
                period === p.id
                  ? "bg-[#9a0002] text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        <div className="lg:col-span-3 flex flex-col gap-5">

          {/* Lively onboarding banner (restored) */}
          {!isTutorialComplete ? (
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#9a0002] via-[#9a0002] to-[#6b0001] text-white p-5 md:p-6 shadow-[0_20px_50px_-20px_rgba(154,0,2,0.55)]">
              <div className="pointer-events-none absolute -right-8 -top-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute right-10 top-8 w-16 h-16 rotate-12 rounded-2xl border border-white/20 bg-white/10" />
              <div className="pointer-events-none absolute right-28 bottom-6 w-10 h-10 -rotate-12 rounded-xl border border-white/15 bg-white/5" />
              <svg className="pointer-events-none absolute right-6 bottom-8 w-24 h-24 text-white/15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z" />
              </svg>

              <div className="relative z-10 space-y-4 max-w-xl">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/15 text-[11px] font-bold tracking-wider uppercase">
                    <MaterialSymbol icon="school" size={14} />
                    Configuración del Local ({progressPct}%)
                  </div>
                  <span className="text-xs font-black text-white/90">
                    {completedCount} de {tasks.length} pasos
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">
                    ¡Completá tu negocio para vender más!
                  </h2>
                  <p className="text-xs text-red-100/90 font-medium">
                    Seguí el paso a paso. El tour te muestra qué subir y dónde hacerlo.
                  </p>
                </div>

                <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer border",
                        task.completed
                          ? "bg-white/15 border-white/20 text-white"
                          : "bg-black/20 border-white/10 text-white/70 hover:bg-black/30"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0",
                          task.completed ? "bg-emerald-400 text-gray-950" : "border border-white/40"
                        )}
                      >
                        {task.completed && <MaterialSymbol icon="check" size={14} className="font-bold" />}
                      </div>
                      <span className={cn("truncate", task.completed && "line-through opacity-80")}>{task.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-1 flex items-center justify-between flex-wrap gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setTasks((prev) => prev.map((t) => ({ ...t, completed: true })))}
                    className="text-[11px] text-white/70 font-medium hover:text-white cursor-pointer"
                  >
                    Simular 100% completado
                  </button>
                  <button
                    type="button"
                    onClick={startTour}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-950 hover:bg-black text-white text-xs font-black transition-all cursor-pointer shadow-lg"
                  >
                    <MaterialSymbol icon="play_arrow" size={18} fill />
                    Iniciar tour
                    <MaterialSymbol icon="arrow_forward" size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#9a0002] via-[#9a0002] to-[#6b0001] text-white p-5 md:p-6 shadow-[0_20px_50px_-20px_rgba(154,0,2,0.55)]">
              <div className="pointer-events-none absolute -right-8 -top-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute right-10 top-8 w-16 h-16 rotate-12 rounded-2xl border border-white/20 bg-white/10" />
              <svg className="pointer-events-none absolute right-8 bottom-8 w-28 h-28 text-white/15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z" />
              </svg>

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-bold tracking-wider uppercase text-emerald-200">
                    <MaterialSymbol icon="verified" size={14} />
                    Local 100% Verificado
                  </div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">
                    ¡Tu local está listo para recibir pedidos!
                  </h2>
                  <p className="text-xs text-red-100/90 max-w-md">
                    Tu carta, código QR y fotos lucen geniales. Promocioná descuentos o gestioná las comandas en tiempo real.
                  </p>
                </div>
                <Link
                  href="/negocio/pedidos"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gray-950 hover:bg-black text-white font-black text-sm transition-all shadow-lg cursor-pointer whitespace-nowrap"
                >
                  Ir a Pedidos
                  <MaterialSymbol icon="arrow_forward" size={18} />
                </Link>
              </div>
            </div>
          )}

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <StatCard
              icon="payments"
              value={formatCurrency(s.revenueMonth)}
              label="Generado en el mes"
              delta={{ text: `+${revenueDeltaPct}% vs mes ant.`, direction: "up" }}
            />
            <StatCard
              icon="task_alt"
              value={String(s.completedOrdersMonth)}
              label="Pedidos completados"
              delta={{ text: "Mes en curso", direction: "up" }}
            />
            <StatCard
              icon="receipt"
              value={formatCurrency(s.avgTicket)}
              label="Ticket promedio"
              delta={{ text: "+4% vs mes ant.", direction: "up" }}
            />
            <StatCard
              icon="timer"
              value={`${s.avgResponseTimeMin}m / ${s.avgPrepTimeMin}m`}
              label="T. Respuesta / Prep."
            />
          </div>

          {/* Stock */}
          <section className="min-w-0">
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <h3 className="font-black text-base text-gray-900 dark:text-white tracking-tight">
                  Control rápido de stock
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Pausá platos sin stock con 1 clic</p>
              </div>
              <Link
                href="/negocio/carta"
                className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Editar menú
              </Link>
            </div>

            <div className="relative w-full">
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-[5px] w-14 bg-gradient-to-r from-[#faf6f1] from-40% dark:from-[#1c1917] to-transparent pointer-events-none z-10 transition-opacity duration-300",
                  stockScroll.isAtStart ? "opacity-0" : "opacity-100"
                )}
              />
              <div
                className={cn(
                  "absolute right-0 top-0 bottom-[5px] w-14 bg-gradient-to-l from-[#faf6f1] from-40% dark:from-[#1c1917] to-transparent pointer-events-none z-10 transition-opacity duration-300",
                  stockScroll.isAtEnd ? "opacity-0" : "opacity-100"
                )}
              />

              <div ref={stockRef} className="flex gap-4 overflow-x-auto custom-scrollbar px-3 pt-2 pb-4">
                {products.map((prod) => (
                  <div key={prod.id} className={cn(CARD, "w-[200px] flex-shrink-0 overflow-hidden")}>
                    <div className="relative h-[118px] bg-[#f2ece2] dark:bg-[#231f1c]">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => toggleProductStock(prod.id)}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 dark:bg-[#1c1917]/95 shadow-sm flex items-center justify-center cursor-pointer text-gray-500"
                        title={prod.available ? "Pausar" : "Activar"}
                      >
                        <MaterialSymbol
                          icon="favorite"
                          size={16}
                          fill={prod.available}
                          className={prod.available ? "text-[#9a0002]" : "text-gray-400"}
                        />
                      </button>
                      <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 dark:bg-[#1c1917]/95 text-gray-600 dark:text-gray-300">
                        {prod.category}
                      </span>
                    </div>
                    <div className="p-3.5">
                      <p className="text-sm font-black text-gray-900 dark:text-white line-clamp-2 min-h-[2.5rem]">
                        {prod.name}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-[#f2ece2] dark:bg-[#231f1c] flex-shrink-0">
                          {MOCK_BUSINESS.logoImage ? (
                            <img src={MOCK_BUSINESS.logoImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-black flex items-center justify-center h-full text-gray-600">
                              {MOCK_BUSINESS.initials.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate">
                            {formatCurrency(prod.price)}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {prod.available ? "Disponible" : "Pausado"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right rail — cover + stats + deliveries */}
        <aside className="lg:col-span-2 flex min-h-0">
          <section className={cn(CARD, "w-full flex-1 flex flex-col overflow-hidden")}>
            {/* Cover like featured chains (h≈130) */}
            <div className="relative h-[120px] flex-shrink-0 bg-[#5d4037]">
              {MOCK_BUSINESS.bannerImage && (
                <img
                  src={MOCK_BUSINESS.bannerImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md",
                    isOpen ? "bg-white/90 text-gray-800" : "bg-black/50 text-white"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", isOpen ? "bg-emerald-500 animate-pulse" : "bg-gray-300")} />
                  {isOpen ? "Abierto" : "Cerrado"}
                </button>
              </div>
              {MOCK_BUSINESS.tagline && (
                <p className="absolute bottom-3 left-4 right-4 text-white text-xs font-bold drop-shadow-sm line-clamp-1">
                  {MOCK_BUSINESS.tagline}
                </p>
              )}
            </div>

            <div className="flex flex-col flex-1 p-5 pt-0">
              <div className="flex flex-col items-center text-center -mt-10 mb-4">
                <ProgressRing pct={isTutorialComplete ? ratingPct : progressPct}>
                  {MOCK_BUSINESS.logoImage ? (
                    <img src={MOCK_BUSINESS.logoImage} alt={MOCK_BUSINESS.name} className="w-full h-full object-cover" />
                  ) : (
                    MOCK_BUSINESS.initials
                  )}
                </ProgressRing>
                <p className="mt-4 font-black text-base text-gray-900 dark:text-white tracking-tight">
                  {greeting}, {MOCK_BUSINESS.name.split(" ").slice(-2).join(" ")} 🔥
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
                  {MOCK_BUSINESS.rating} ★ · {MOCK_BUSINESS.reviewsCount} opiniones · resp. ~{s.avgResponseTimeMin} min
                </p>
              </div>

              <div className="mb-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-300 dark:text-gray-500 mb-1">
                  Ventas semanales
                </p>
                <SimpleBarChart data={MOCK_WEEKLY_SALES} labels={MOCK_DAYS} />
              </div>

              <div className="mt-auto pt-5 border-t border-[#f0ebe4] dark:border-[#2a2623]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-sm text-gray-900 dark:text-white">Deliveries asociados</h3>
                  <Link
                    href="/negocio/equipo"
                    className="w-8 h-8 rounded-full bg-[#f2ece2] dark:bg-[#231f1c] text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors"
                    title="Asociar repartidor"
                  >
                    <MaterialSymbol icon="person_add" size={16} />
                  </Link>
                </div>

                <div className="space-y-3">
                  {MOCK_DRIVERS.map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#f2ece2] dark:bg-[#231f1c] text-gray-700 dark:text-gray-300 font-black text-sm flex items-center justify-center flex-shrink-0">
                          {driver.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{driver.name}</p>
                          <p className="text-[11px] text-gray-400">{driver.role}</p>
                        </div>
                      </div>

                      {driver.status === "available" ? (
                        <Link
                          href="/negocio/pedidos"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#3d3732] text-gray-600 dark:text-gray-300 text-[11px] font-bold hover:bg-[#f2ece2] dark:hover:bg-[#231f1c] transition-colors whitespace-nowrap"
                        >
                          <MaterialSymbol icon="add" size={14} />
                          Asignar
                        </Link>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full bg-[#f2ece2] dark:bg-[#231f1c] text-gray-600 dark:text-gray-300 text-[10px] font-black whitespace-nowrap">
                          #{driver.currentOrder}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <Link
                  href="/negocio/equipo"
                  className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-[#f2ece2] hover:bg-[#ede4d9] dark:bg-[#231f1c] dark:hover:bg-[#2a2623] text-gray-700 dark:text-gray-300 text-xs font-bold transition-colors"
                >
                  Ver todos
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Actividad — full width */}
      <section className={cn(CARD, "p-5 md:p-6")}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-base text-gray-900 dark:text-white tracking-tight">
            Actividad reciente
          </h3>
          <Link
            href="/negocio/pedidos"
            className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Ver todos
          </Link>
        </div>

        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-300 dark:text-gray-500">
                <th className="pb-3 px-2 font-bold">Cliente</th>
                <th className="pb-3 px-2 font-bold">Tipo</th>
                <th className="pb-3 px-2 font-bold">Detalle</th>
                <th className="pb-3 px-2 font-bold text-right">Acción</th>
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
                        <div className="w-9 h-9 rounded-full bg-[#f2ece2] dark:bg-[#231f1c] text-gray-700 dark:text-gray-300 font-black text-xs flex items-center justify-center flex-shrink-0">
                          {order.customerName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {order.customerName}
                          </p>
                          <p className="text-[11px] text-gray-400">#{order.orderNumber} · {order.time}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap", status.classes)}>
                        <MaterialSymbol icon={status.icon} size={12} fill />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-2">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {order.itemsCount} items
                      </p>
                      <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{formatCurrency(order.total)}</p>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <Link
                        href="/negocio/pedidos"
                        className="inline-flex w-9 h-9 rounded-full bg-[#f2ece2] dark:bg-[#231f1c] text-gray-500 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 items-center justify-center transition-colors"
                        aria-label={`Ver pedido ${order.orderNumber}`}
                      >
                        <MaterialSymbol icon="arrow_forward" size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
