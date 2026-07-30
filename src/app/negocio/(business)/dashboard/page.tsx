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
  RecentOrder,
  PanelProduct,
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

function pctDelta(today: number, yesterday: number) {
  const pct = ((today - yesterday) / yesterday) * 100;
  return { text: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}% vs ayer`, direction: (pct >= 0 ? "up" : "down") as "up" | "down" };
}

export default function DashboardPage() {
  const [period, setPeriod] = useState("today");
  const [isOpen, setIsOpen] = useState(MOCK_BUSINESS.isOpen);
  const [products, setProducts] = useState<PanelProduct[]>(MOCK_PRODUCTS);
  const s = MOCK_BUSINESS_STATS;
  const ordersDelta = pctDelta(s.ordersToday, s.ordersYesterday);
  const revenueDelta = pctDelta(s.revenueToday, s.revenueYesterday);

  const toggleProductStock = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p))
    );
  };

  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-200 max-w-[1200px] mx-auto">
      {/* ── Page Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Resumen general del rendimiento de tu negocio
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
          TOP ROW — Reference layout: Hero (left 3/5) + Statistic card (right 2/5)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Hero Banner (left, 3 cols) ─────────────────────────────────────── */}
        <div className="lg:col-span-3 relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#9a0002] via-[#800002] to-[#500001] text-white p-6 md:p-8 shadow-xl">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold tracking-wider uppercase text-amber-200">
                <MaterialSymbol icon="auto_awesome" size={13} />
                Estado del Local en Vivo
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">{MOCK_BUSINESS.name}</h2>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border",
                    isOpen
                      ? "bg-emerald-500 text-white border-emerald-400"
                      : "bg-gray-800 text-gray-300 border-gray-700"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", isOpen ? "bg-white animate-ping" : "bg-gray-500")} />
                  {isOpen ? "ABIERTO" : "CERRADO"}
                </button>
              </div>

              <p className="text-sm text-red-100/90 font-medium max-w-md">
                ¡Llevás <strong>{s.ordersToday} pedidos completados</strong> hoy! 🔥 Tenés <strong>{s.activeOrders} pedidos activos</strong> en la cocina y despacho.
              </p>
            </div>

            <Link
              href="/negocio/pedidos"
              className="group self-start inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white hover:bg-gray-100 text-[#9a0002] font-black text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <MaterialSymbol icon="receipt_long" size={20} className="text-[#9a0002]" />
              <span>Ver Comandera en Vivo</span>
              <span className="w-6 h-6 rounded-full bg-[#9a0002]/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <MaterialSymbol icon="arrow_forward" size={14} className="text-[#9a0002]" />
              </span>
            </Link>
          </div>
        </div>

        {/* ── Right Column: Business Profile + Chart (2 cols, like reference "Statistic") ── */}
        <div className="lg:col-span-2 bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-100 dark:border-[#3d3732] penpot-shadow rounded-[24px] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100">{MOCK_BUSINESS.name}</h3>
            <button className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] hover:text-gray-600 transition-colors cursor-pointer">
              <MaterialSymbol icon="more_vert" size={16} />
            </button>
          </div>

          {/* Avatar + greeting (reference style) */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#9a0002] to-[#6b0001] flex items-center justify-center text-white font-black text-xl shadow-md ring-4 ring-[#9a0002]/15">
                {MOCK_BUSINESS.initials}
              </div>
              <span className="absolute -top-1 -right-2 px-2 py-0.5 rounded-full bg-[#9a0002] text-white text-[9px] font-black shadow-sm flex items-center gap-0.5">
                ⭐ {MOCK_BUSINESS.rating}
              </span>
            </div>
            <p className="font-extrabold text-sm text-gray-800 dark:text-gray-100">¡Buenas noches! 🔥</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              {MOCK_BUSINESS.reviewsCount} reseñas positivas · Prep. ~{MOCK_BUSINESS.prepTimeMinutes} min
            </p>
          </div>

          {/* Chart */}
          <div className="mt-auto">
            <SimpleBarChart data={MOCK_WEEKLY_SALES} labels={MOCK_DAYS} />
          </div>
        </div>
      </div>

      {/* ── Status Pills Row (reference: 3 icon pills below the hero) ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/negocio/pedidos"
          className="flex items-center justify-between p-4 rounded-[20px] bg-[#faf6f1] dark:bg-[#1c1917] border border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400 transition-all penpot-shadow group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <MaterialSymbol icon="notifications_active" size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">1 Pedido Nuevo</p>
              <p className="text-sm font-black text-amber-700 dark:text-amber-400">Requiere Atención</p>
            </div>
          </div>
          <MaterialSymbol icon="chevron_right" size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/negocio/pedidos"
          className="flex items-center justify-between p-4 rounded-[20px] bg-[#faf6f1] dark:bg-[#1c1917] border border-blue-200/80 dark:border-blue-900/40 hover:border-blue-400 transition-all penpot-shadow group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MaterialSymbol icon="skillet" size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">1 En Cocina</p>
              <p className="text-sm font-black text-blue-700 dark:text-blue-400">Demora ~20 min</p>
            </div>
          </div>
          <MaterialSymbol icon="chevron_right" size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/negocio/pedidos"
          className="flex items-center justify-between p-4 rounded-[20px] bg-[#faf6f1] dark:bg-[#1c1917] border border-purple-200/80 dark:border-purple-900/40 hover:border-purple-400 transition-all penpot-shadow group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <MaterialSymbol icon="two_wheeler" size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">1 En Reparto</p>
              <p className="text-sm font-black text-purple-700 dark:text-purple-400">Cadete: Franco B.</p>
            </div>
          </div>
          <MaterialSymbol icon="chevron_right" size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* ── Quick Stats Cards (reference: course progress pills) ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="shopping_cart"
          iconBg="bg-red-50 dark:bg-red-950/30"
          iconColor="text-[#9a0002]"
          value={String(s.ordersToday)}
          label="Pedidos hoy"
          delta={ordersDelta}
        />
        <StatCard
          icon="payments"
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          iconColor="text-emerald-500"
          value={formatCurrency(s.revenueToday)}
          label="Facturado hoy"
          delta={revenueDelta}
        />
        <StatCard
          icon="pending_actions"
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          iconColor="text-amber-500"
          value={String(s.activeOrders)}
          label="Pedidos activos"
        />
        <StatCard
          icon="receipt"
          iconBg="bg-blue-50 dark:bg-blue-950/30"
          iconColor="text-blue-500"
          value={formatCurrency(s.avgTicket)}
          label="Ticket promedio"
          delta={{ text: "+4% vs ayer", direction: "up" }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          BOTTOM ROW — Reference: "Continue Watching" + Table left, "Your mentor" right
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left column (3/5): Activity table + Stock control ───────────── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Actividad Reciente */}
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

          {/* Control Rápido de Stock */}
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

        {/* ── Right column (2/5): Drivers (reference: "Your mentor") ──────── */}
        <div className="lg:col-span-2">
          <div className="bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-100 dark:border-[#3d3732] penpot-shadow rounded-[24px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <MaterialSymbol icon="two_wheeler" size={18} className="text-[#9a0002]" />
                Cadetes & Repartidores Activos
              </h3>
              <Link href="/negocio/equipo" className="w-6 h-6 rounded-full bg-[#9a0002]/10 text-[#9a0002] flex items-center justify-center hover:scale-105 transition-transform">
                <MaterialSymbol icon="add" size={15} />
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

            {/* "See All" link — same as reference */}
            <Link
              href="/negocio/equipo"
              className="mt-4 w-full flex items-center justify-center gap-1 py-2.5 rounded-xl border border-[#9a0002]/20 text-[#9a0002] text-xs font-bold hover:bg-[#9a0002]/5 transition-colors cursor-pointer"
            >
              Ver Todo el Equipo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
