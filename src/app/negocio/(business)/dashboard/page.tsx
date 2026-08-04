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
  pending: { icon: "schedule", label: "Nuevo", classes: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40" },
  accepted: { icon: "check_circle", label: "Aceptado", classes: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40" },
  preparing: { icon: "skillet", label: "En Cocina", classes: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40" },
  delivering: { icon: "two_wheeler", label: "En Camino", classes: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/40" },
  delivered: { icon: "task_alt", label: "Entregado", classes: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40" },
  cancelled: { icon: "cancel", label: "Cancelado", classes: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40" },
};

function formatCurrency(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState("today");
  const [isOpen, setIsOpen] = useState(MOCK_BUSINESS.isOpen);
  const [products, setProducts] = useState<PanelProduct[]>(MOCK_PRODUCTS);
  const [tasks, setTasks] = useState<TutorialTask[]>(MOCK_TUTORIAL_TASKS);

  const s = MOCK_BUSINESS_STATS;

  // Calculo de progreso de onboarding
  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);
  const isTutorialComplete = progressPct === 100;

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const toggleProductStock = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p))
    );
  };

  const revenueDeltaPct = Math.round(((s.revenueMonth - s.revenueMonthLast) / s.revenueMonthLast) * 100);

  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-200 max-w-[1280px] mx-auto">
      {/* ── Page Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Resumen general del rendimiento e indicadores de tu negocio
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] rounded-full p-1 penpot-shadow w-fit">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap",
                period === p.id
                  ? "bg-[#9a0002] text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          MAIN GRID — Left (3/5): Tutorial/Promo + KPIs | Right (2/5): Stats + Deliveries
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── LEFT COLUMN (3 cols): Tutorial/Banner + KPI Cards + Activity ───── */}
        <div className="lg:col-span-3 space-y-6">

          {/* ── Tutorial / Onboarding Banner (or Promo when 100%) ────────────── */}
          {!isTutorialComplete ? (
            <div className="relative overflow-hidden rounded-[28px] bg-[#9a0002] text-white p-6 shadow-xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold tracking-wider uppercase text-white">
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
                    Seguí el tutorial paso a paso para dejar tu local 100% visible para los clientes.
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Task Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
                        task.completed ? "bg-emerald-400 text-gray-950" : "border border-white/40"
                      )}>
                        {task.completed && <MaterialSymbol icon="check" size={14} className="font-bold" />}
                      </div>
                      <span className={cn("truncate", task.completed && "line-through opacity-80")}>
                        {task.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-white/10">
                  <span className="text-[11px] text-white/80 font-medium">
                    💡 Tocá en cada paso para marcarlo como listo
                  </span>
                  <button
                    onClick={() => setTasks((prev) => prev.map((t) => ({ ...t, completed: true })))}
                    className="text-xs font-black text-amber-200 hover:underline cursor-pointer"
                  >
                    Simular 100% completado
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Replaced Banner when 100% complete: Promos & Active Orders CTA */
            <div className="relative overflow-hidden rounded-[28px] bg-[#9a0002] text-white p-6 shadow-xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-[11px] font-bold tracking-wider uppercase text-emerald-300">
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
                  className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white hover:bg-gray-100 text-[#9a0002] font-black text-sm transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
                >
                  <MaterialSymbol icon="receipt_long" size={20} className="text-[#9a0002]" />
                  <span>Ir a Pedidos Activos</span>
                  <MaterialSymbol icon="arrow_forward" size={16} className="text-[#9a0002] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* ── KPI Cards Grid (Aligned horizontally to cover the banner width) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="payments"
              iconBg="bg-emerald-50 dark:bg-emerald-950/30"
              iconColor="text-emerald-500"
              value={formatCurrency(s.revenueMonth)}
              label="Generado en el mes"
              delta={{ text: `+${revenueDeltaPct}% vs mes ant.`, direction: "up" }}
            />
            <StatCard
              icon="task_alt"
              iconBg="bg-blue-50 dark:bg-blue-950/30"
              iconColor="text-blue-500"
              value={String(s.completedOrdersMonth)}
              label="Pedidos completados"
              delta={{ text: "Mes en curso", direction: "up" }}
            />
            <StatCard
              icon="receipt"
              iconBg="bg-amber-50 dark:bg-amber-950/30"
              iconColor="text-amber-500"
              value={formatCurrency(s.avgTicket)}
              label="Ticket promedio"
              delta={{ text: "+4% vs mes ant.", direction: "up" }}
            />
            <StatCard
              icon="timer"
              iconBg="bg-purple-50 dark:bg-purple-950/30"
              iconColor="text-purple-500"
              value={`${s.avgResponseTimeMin}m / ${s.avgPrepTimeMin}m`}
              label="T. Respuesta / Prep."
              delta={{ text: "T. Resp / T. Prep", direction: "up" }}
            />
          </div>

          {/* ── Actividad Reciente ─────────────────────────────────────────────── */}
          <div className="bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-100 dark:border-[#3d3732] penpot-shadow rounded-[24px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <MaterialSymbol icon="history" size={18} className="text-[#9a0002]" />
                Actividad Reciente
              </h3>
              <Link href="/negocio/pedidos" className="text-xs font-bold text-[#9a0002] hover:underline">
                Ver todos
              </Link>
            </div>

            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left min-w-[480px]">
                <thead>
                  <tr className="text-[9px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200 dark:border-[#3d3732]">
                    <th className="pb-2 px-1">#Pedido</th>
                    <th className="pb-2 px-1">Cliente</th>
                    <th className="pb-2 px-1">Items</th>
                    <th className="pb-2 px-1">Total</th>
                    <th className="pb-2 px-1">Estado</th>
                    <th className="pb-2 px-1 text-right">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_RECENT_ORDERS.map((order, idx) => {
                    const status = STATUS_CONFIG[order.status];
                    return (
                      <tr
                        key={order.id}
                        className={cn(
                          idx !== MOCK_RECENT_ORDERS.length - 1 && "border-b border-[#ddd4c8]/60 dark:border-[#3d3732]/60"
                        )}
                      >
                        <td className="py-3 px-1 text-xs font-black text-gray-800 dark:text-gray-200">#{order.orderNumber}</td>
                        <td className="py-3 px-1 text-xs font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">{order.customerName}</td>
                        <td className="py-3 px-1 text-xs text-gray-500 dark:text-gray-400">{order.itemsCount} items</td>
                        <td className="py-3 px-1 text-xs font-black text-[#9a0002]">{formatCurrency(order.total)}</td>
                        <td className="py-3 px-1">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-black whitespace-nowrap", status.classes)}>
                            <MaterialSymbol icon={status.icon} size={11} fill />
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-1 text-xs text-gray-400 text-right whitespace-nowrap">{order.time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Control Rápido de Stock ────────────────────────────────────────── */}
          <div className="bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-100 dark:border-[#3d3732] penpot-shadow rounded-[24px] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <MaterialSymbol icon="inventory_2" size={18} className="text-[#9a0002]" />
                  Control Rápido de Stock
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Pausá platos sin stock con 1 clic</p>
              </div>
              <Link href="/negocio/carta" className="text-xs font-bold text-[#9a0002] hover:underline">
                Editar Menú
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/70 dark:bg-[#231f1c]/70 border border-gray-100 dark:border-[#3d3732]"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{prod.name}</p>
                    <p className="text-[10px] text-gray-400">{formatCurrency(prod.price)}</p>
                  </div>
                  <button
                    onClick={() => toggleProductStock(prod.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer whitespace-nowrap border",
                      prod.available
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50"
                    )}
                  >
                    {prod.available ? "Disponible" : "Pausado"}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN (2 cols): Business Stats + Drivers ────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Business Profile & Weekly Sales Chart ────────────────────────── */}
          <div className="bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-100 dark:border-[#3d3732] penpot-shadow rounded-[24px] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <MaterialSymbol icon="store" size={18} className="text-[#9a0002]" />
                Estadísticas del Local
              </h3>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer border",
                  isOpen
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", isOpen ? "bg-emerald-500 animate-ping" : "bg-gray-400")} />
                {isOpen ? "ABIERTO" : "CERRADO"}
              </button>
            </div>

            {/* Avatar, Icon & Ratings */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-full bg-[#9a0002] flex items-center justify-center text-white font-black text-xl shadow-md ring-4 ring-[#9a0002]/15">
                  {MOCK_BUSINESS.initials}
                </div>
                <span className="absolute -top-1 -right-2 px-2 py-0.5 rounded-full bg-[#9a0002] text-white text-[9px] font-black shadow-sm flex items-center gap-0.5">
                  ⭐ {MOCK_BUSINESS.rating}
                </span>
              </div>
              <p className="font-extrabold text-base text-gray-900 dark:text-gray-100">{MOCK_BUSINESS.name}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                {MOCK_BUSINESS.reviewsCount} opiniones · T. Respuesta ~{s.avgResponseTimeMin} min
              </p>
            </div>

            {/* Weekly Sales Chart */}
            <div className="pt-2">
              <p className="text-[11px] font-extrabold uppercase text-gray-400 tracking-wider mb-2">Ventas Semanales</p>
              <SimpleBarChart data={MOCK_WEEKLY_SALES} labels={MOCK_DAYS} />
            </div>
          </div>

          {/* ── Deliveries Asociados (Located directly below the business stats) ── */}
          <div className="bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-100 dark:border-[#3d3732] penpot-shadow rounded-[24px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <MaterialSymbol icon="two_wheeler" size={18} className="text-[#9a0002]" />
                Deliveries Asociados
              </h3>
              <Link
                href="/negocio/equipo"
                title="Asociar nuevo repartidor"
                className="w-7 h-7 rounded-full bg-[#9a0002]/10 text-[#9a0002] flex items-center justify-center hover:scale-105 transition-transform"
              >
                <MaterialSymbol icon="person_add" size={16} />
              </Link>
            </div>

            <div className="space-y-3">
              {MOCK_DRIVERS.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/70 dark:bg-[#231f1c]/70 border border-gray-100 dark:border-[#3d3732]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#9a0002]/10 text-[#9a0002] font-black text-xs flex items-center justify-center">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{driver.name}</p>
                      <p className="text-[10px] text-gray-400">{driver.role}</p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[9px] font-black uppercase border",
                      driver.status === "available"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40"
                        : "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40"
                    )}
                  >
                    {driver.status === "available" ? "Disponible" : `En reparto #${driver.currentOrder}`}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/negocio/equipo"
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#9a0002]/20 text-[#9a0002] text-xs font-bold hover:bg-[#9a0002]/5 transition-colors cursor-pointer"
            >
              <MaterialSymbol icon="group" size={16} />
              <span>Gestionar Equipo & Repartidores</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
