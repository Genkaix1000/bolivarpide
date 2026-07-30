"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { StatCard } from "@/components/business/StatCard";
import { cn } from "@/lib/utils";
import { MOCK_DETAILED_ORDERS, MOCK_DRIVERS, DetailedOrder } from "@/lib/mockData";

type OrderFilter = "all" | "pending" | "preparing" | "delivering" | "delivered";

const FILTER_TABS: { id: OrderFilter; label: string; icon: string; countBadge?: (orders: DetailedOrder[]) => number }[] = [
  { id: "all", label: "Todos", icon: "view_agenda" },
  { id: "pending", label: "Nuevos", icon: "notifications_active", countBadge: (orders) => orders.filter(o => o.status === "pending").length },
  { id: "preparing", label: "En Cocina", icon: "skillet", countBadge: (orders) => orders.filter(o => o.status === "preparing").length },
  { id: "delivering", label: "En Camino", icon: "two_wheeler", countBadge: (orders) => orders.filter(o => o.status === "delivering").length },
  { id: "delivered", label: "Entregados", icon: "check_circle" },
];

const PREP_TIMES = [15, 25, 35, 45];

function formatCurrency(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<DetailedOrder[]>(MOCK_DETAILED_ORDERS);
  const [activeTab, setActiveTab] = useState<OrderFilter>("all");
  const [search, setSearch] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
  const [prepTimePicker, setPrepTimePicker] = useState<Record<string, number>>({});

  const handleUpdateStatus = (orderId: string, newStatus: DetailedOrder["status"]) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const driver = selectedDriver[orderId] || ord.driverName;
          const estTime = prepTimePicker[orderId] || ord.estimatedTime;
          return { ...ord, status: newStatus, driverName: driver, estimatedTime: estTime };
        }
        return ord;
      })
    );
  };

  const filteredOrders = orders.filter((ord) => {
    if (activeTab !== "all" && ord.status !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ord.orderNumber.toString().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.deliveryAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto text-gray-800 dark:text-gray-200">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <MaterialSymbol icon="receipt_long" size={26} className="text-[#9a0002]" />
              Comandera & Pedidos
            </h1>
            {pendingCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-[#9a0002] text-white text-xs font-black animate-pulse flex items-center gap-1 shadow-sm">
                <MaterialSymbol icon="notifications_active" size={14} />
                {pendingCount} por aceptar
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Gestión en tiempo real de recepción, cocina y despacho de pedidos
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer",
              soundEnabled
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                : "bg-gray-100 dark:bg-[#231f1c] text-gray-400 border-gray-200 dark:border-[#3d3732]"
            )}
          >
            <MaterialSymbol icon={soundEnabled ? "volume_up" : "volume_off"} size={16} />
            <span>Alerta sonora: {soundEnabled ? "Activada" : "Muda"}</span>
          </button>

          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <MaterialSymbol icon="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por # o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] rounded-xl text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#9a0002]"
            />
          </div>
        </div>
      </div>

      {/* ── Top Row: 4 KPI Cards Contextual to Orders ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="shopping_cart"
          iconBg="bg-red-50 dark:bg-red-950/30"
          iconColor="text-[#9a0002]"
          value={String(orders.length)}
          label="Total Pedidos (Hoy)"
        />
        <StatCard
          icon="pending_actions"
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          iconColor="text-amber-500"
          value={String(orders.filter(o => o.status === "pending" || o.status === "preparing" || o.status === "delivering").length)}
          label="Pedidos Abiertos"
        />
        <StatCard
          icon="timer"
          iconBg="bg-[#9a0002]/10"
          iconColor="text-[#9a0002]"
          value="3.2 min"
          label="T. Respuesta Prom."
        />
        <StatCard
          icon="payments"
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          iconColor="text-emerald-500"
          value={formatCurrency(orders.reduce((acc, o) => acc + o.total, 0))}
          label="Facturado (Hoy)"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-gray-200 dark:border-[#3d3732] custom-scrollbar">
        {FILTER_TABS.map((tab) => {
          const count = tab.countBadge ? tab.countBadge(orders) : 0;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border-b-2 -mb-[2px]",
                isActive
                  ? "border-[#9a0002] text-[#9a0002] bg-[#9a0002]/5 dark:bg-[#9a0002]/10"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              <MaterialSymbol icon={tab.icon} size={16} fill={isActive} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black",
                    tab.id === "pending"
                      ? "bg-[#9a0002] text-white"
                      : "bg-gray-200 dark:bg-[#302c28] text-gray-700 dark:text-gray-300"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-[#faf6f1] dark:bg-[#1c1917] border border-dashed border-gray-300 dark:border-[#3d3732] rounded-[24px]">
          <MaterialSymbol icon="inbox" size={42} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="font-extrabold text-sm text-gray-600 dark:text-gray-400">No hay pedidos en esta sección</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Los nuevos pedidos ingresados aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((ord) => (
              <motion.div
                key={ord.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "flex flex-col justify-between bg-[#faf6f1] dark:bg-[#1c1917] border penpot-shadow rounded-[24px] p-5 transition-all relative overflow-hidden",
                  ord.status === "pending"
                    ? "border-[#9a0002] shadow-md ring-2 ring-[#9a0002]/20"
                    : "border-gray-200 dark:border-[#3d3732]"
                )}
              >
                {/* Header card */}
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-200 dark:border-[#3d3732]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-gray-900 dark:text-white">#{ord.orderNumber}</span>
                        <span className="text-[11px] text-gray-400 font-semibold">{ord.time}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{ord.customerName}</p>
                    </div>

                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border",
                        ord.status === "pending" && "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
                        ord.status === "preparing" && "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
                        ord.status === "delivering" && "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50",
                        ord.status === "delivered" && "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
                        ord.status === "cancelled" && "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50"
                      )}
                    >
                      {ord.status === "pending" && "NUEVO"}
                      {ord.status === "preparing" && "EN COCINA"}
                      {ord.status === "delivering" && "EN CAMINO"}
                      {ord.status === "delivered" && "ENTREGADO"}
                      {ord.status === "cancelled" && "CANCELADO"}
                    </span>
                  </div>

                  {/* Customer Info & Address */}
                  <div className="py-3 text-xs space-y-1.5">
                    <p className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <MaterialSymbol icon="location_on" size={15} className="text-[#9a0002] flex-shrink-0" />
                      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{ord.deliveryAddress}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <MaterialSymbol icon="payments" size={15} className="text-emerald-500 flex-shrink-0" />
                      <span>Pago: <strong className="text-gray-800 dark:text-gray-200">{ord.paymentMethod}</strong></span>
                    </p>
                  </div>

                  {/* Items list */}
                  <div className="bg-white/60 dark:bg-[#231f1c]/80 rounded-xl p-3 border border-gray-100 dark:border-[#3d3732] my-2 space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Detalle del Pedido ({ord.itemsCount} items)</p>
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-800 dark:text-gray-200">
                          <strong className="text-[#9a0002] font-black">{item.qty}x</strong> {item.name}
                        </span>
                        <span className="text-gray-500 font-bold">{formatCurrency(item.price * item.qty)}</span>
                      </div>
                    ))}
                    {ord.notes && (
                      <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-[#3d3732] text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1">
                        <MaterialSymbol icon="notes" size={14} className="flex-shrink-0 mt-0.5" />
                        <span>"{ord.notes}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer & Actions */}
                <div className="pt-3 border-t border-gray-200 dark:border-[#3d3732] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-semibold">Total del Pedido</span>
                    <span className="text-lg font-black text-[#9a0002]">{formatCurrency(ord.total)}</span>
                  </div>

                  {/* Pending actions */}
                  {ord.status === "pending" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1 text-[11px] text-gray-500 font-medium">
                        <span>Tiempo estimado cocina:</span>
                        <div className="flex gap-1">
                          {PREP_TIMES.map((mins) => (
                            <button
                              key={mins}
                              onClick={() => setPrepTimePicker((prev) => ({ ...prev, [ord.id]: mins }))}
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer",
                                (prepTimePicker[ord.id] || 25) === mins
                                  ? "bg-[#9a0002] text-white border-[#9a0002]"
                                  : "bg-white dark:bg-[#231f1c] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#3d3732]"
                              )}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleUpdateStatus(ord.id, "cancelled")}
                          className="px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold transition-all cursor-pointer"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(ord.id, "preparing")}
                          className="px-3 py-2 rounded-xl bg-[#9a0002] hover:bg-[#7a0002] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1"
                        >
                          <MaterialSymbol icon="check" size={15} />
                          Aceptar ({prepTimePicker[ord.id] || 25}m)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Preparing actions */}
                  {ord.status === "preparing" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-gray-400 font-medium text-[11px]">Asignar cadete:</span>
                        <select
                          value={selectedDriver[ord.id] || ""}
                          onChange={(e) => setSelectedDriver((prev) => ({ ...prev, [ord.id]: e.target.value }))}
                          className="px-2 py-1 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-lg text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
                        >
                          <option value="">Seleccionar repartidor...</option>
                          {MOCK_DRIVERS.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name} ({d.status === "available" ? "Disponible" : "Ocupado"})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleUpdateStatus(ord.id, "delivering")}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <MaterialSymbol icon="two_wheeler" size={16} />
                        Marcar Listo para Enviar
                      </button>
                    </div>
                  )}

                  {/* Delivering actions */}
                  {ord.status === "delivering" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-xl border border-purple-100 dark:border-purple-900/40">
                        <span className="flex items-center gap-1">
                          <MaterialSymbol icon="person_pin" size={15} />
                          {ord.driverName || "Repartidor asignado"}
                        </span>
                        <span className="text-[10px] uppercase font-black">En camino</span>
                      </div>

                      <button
                        onClick={() => handleUpdateStatus(ord.id, "delivered")}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <MaterialSymbol icon="task_alt" size={15} />
                        Confirmar Entrega
                      </button>
                    </div>
                  )}

                  {/* Delivered status */}
                  {ord.status === "delivered" && (
                    <div className="py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold text-center rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center gap-1">
                      <MaterialSymbol icon="check_circle" size={16} fill />
                      Pedido completado con éxito
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
