"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { StatCard } from "@/components/business/StatCard";
import { cn } from "@/lib/utils";
import { MOCK_DETAILED_ORDERS, MOCK_DRIVERS, MOCK_SALES_CHART, DetailedOrder } from "@/lib/mockData";

type BoardStatus = "pending" | "preparing" | "delivering" | "delivered";
type OrderFilter = "all" | BoardStatus;

const CARD =
  "bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_10px_40px_-16px_rgba(61,43,31,0.18)] rounded-[24px]";

const SECTIONS: {
  id: BoardStatus;
  label: string;
  icon: string;
  hint: string;
  chip: string;
  bar: string;
}[] = [
  {
    id: "pending",
    label: "Nuevos",
    icon: "notifications_active",
    hint: "por aceptar",
    chip: "bg-[#9a0002]/10 text-[#9a0002]",
    bar: "bg-[#9a0002]",
  },
  {
    id: "preparing",
    label: "En Cocina",
    icon: "skillet",
    hint: "en preparación",
    chip: "bg-[#f2ece2] text-gray-700 dark:bg-[#231f1c] dark:text-gray-300",
    bar: "bg-amber-500",
  },
  {
    id: "delivering",
    label: "En Camino",
    icon: "two_wheeler",
    hint: "con el cadete",
    chip: "bg-[#f2ece2] text-gray-700 dark:bg-[#231f1c] dark:text-gray-300",
    bar: "bg-[#8a837a]",
  },
  {
    id: "delivered",
    label: "Entregados",
    icon: "check_circle",
    hint: "completados",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    bar: "bg-emerald-500/70",
  },
];

const FILTER_TABS: { id: OrderFilter; label: string; icon: string }[] = [
  { id: "all", label: "Todos", icon: "view_agenda" },
  ...SECTIONS.map(({ id, label, icon }) => ({ id, label, icon })),
];

const PREP_TIMES = [15, 25, 35, 45];
const STATUS_CHIP: Record<string, string> = Object.fromEntries(SECTIONS.map((s) => [s.id, s.chip]));
const STATUS_BAR: Record<string, string> = Object.fromEntries(SECTIONS.map((s) => [s.id, s.bar]));
const STATUS_LABEL: Record<string, string> = {
  pending: "Nuevo",
  preparing: "En cocina",
  delivering: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

function formatCurrency(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function OrderCard({
  ord,
  prepMins,
  onPrepMins,
  driver,
  onDriver,
  onStatus,
}: {
  ord: DetailedOrder;
  prepMins: number;
  onPrepMins: (mins: number) => void;
  driver: string;
  onDriver: (name: string) => void;
  onStatus: (status: DetailedOrder["status"]) => void;
}) {
  const isPending = ord.status === "pending";
  const isDone = ord.status === "delivered";

  return (
    <article
      className={cn(
        CARD,
        "relative flex flex-col overflow-hidden h-full",
        isPending && "ring-1 ring-[#9a0002]/20",
        isDone && "opacity-80"
      )}
    >
      <span className={cn("absolute left-0 top-0 bottom-0 w-[3px]", STATUS_BAR[ord.status] ?? "bg-gray-300")} />

      <div className="flex flex-col flex-1 p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">#{ord.orderNumber}</h3>
              <span className="text-[11px] font-semibold text-gray-400">{ord.time}</span>
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{ord.customerName}</p>
          </div>
          <span className={cn("shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", STATUS_CHIP[ord.status] ?? "bg-gray-100 text-gray-500")}>
            {STATUS_LABEL[ord.status]}
          </span>
        </div>

        <div className="mt-3 space-y-1.5 text-xs">
          <p className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <MaterialSymbol icon="location_on" size={15} className="text-[#9a0002] flex-shrink-0" />
            <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{ord.deliveryAddress}</span>
          </p>
          <p className="flex items-center gap-1.5 text-gray-500">
            <MaterialSymbol icon="payments" size={15} className="text-gray-400 flex-shrink-0" />
            <span>
              {ord.paymentMethod}
              {ord.estimatedTime ? ` · ${ord.estimatedTime} min` : ""}
            </span>
          </p>
        </div>

        <div className="mt-3 rounded-2xl bg-[#faf6f1] dark:bg-[#231f1c] border border-[#f0ebe4] dark:border-[#2a2623] p-3 space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
            Comanda · {ord.itemsCount} {ord.itemsCount === 1 ? "item" : "items"}
          </p>
          {ord.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-xs font-semibold">
              <span className="text-gray-800 dark:text-gray-200 min-w-0 truncate">
                <span className="text-[#9a0002] font-black tabular-nums">{item.qty}×</span> {item.name}
              </span>
              <span className="text-gray-400 font-bold tabular-nums shrink-0">{formatCurrency(item.price * item.qty)}</span>
            </div>
          ))}
          {ord.notes && (
            <p className="mt-1.5 pt-2 border-t border-dashed border-[#ede4d9] dark:border-[#3d3732] text-[11px] text-amber-800 dark:text-amber-400 flex items-start gap-1">
              <MaterialSymbol icon="sticky_note_2" size={14} className="flex-shrink-0 mt-px" />
              <span>{ord.notes}</span>
            </p>
          )}
        </div>
      </div>

      <div className="px-5 pl-6 pb-5 pt-0 space-y-3">
        <div className="flex items-center justify-between border-t border-[#f0ebe4] dark:border-[#2a2623] pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total</span>
          <span className="text-lg font-black text-[#9a0002] tabular-nums">{formatCurrency(ord.total)}</span>
        </div>

        {isPending && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-gray-400">Tiempo de cocina</span>
              <div className="flex gap-1">
                {PREP_TIMES.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onPrepMins(mins)}
                    className={cn(
                      "h-7 min-w-8 px-2 rounded-full text-[10px] font-black border transition-colors cursor-pointer",
                      prepMins === mins
                        ? "bg-[#9a0002] text-white border-[#9a0002]"
                        : "bg-white dark:bg-[#231f1c] text-gray-500 border-gray-200 dark:border-[#3d3732] hover:border-gray-300"
                    )}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onStatus("cancelled")}
                className="h-10 rounded-full border border-gray-200 dark:border-[#3d3732] text-gray-500 hover:bg-[#f2ece2] dark:hover:bg-[#231f1c] text-xs font-bold cursor-pointer"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => onStatus("preparing")}
                className="h-10 rounded-full bg-[#9a0002] hover:bg-[#6b0001] text-white text-xs font-black cursor-pointer flex items-center justify-center gap-1"
              >
                <MaterialSymbol icon="check" size={15} />
                Aceptar · {prepMins}m
              </button>
            </div>
          </div>
        )}

        {ord.status === "preparing" && (
          <div className="space-y-2.5">
            <label className="flex items-center justify-between gap-2 text-[11px] font-medium text-gray-400">
              Cadete
              <select
                value={driver}
                onChange={(e) => onDriver(e.target.value)}
                className="h-8 px-2.5 bg-[#faf6f1] dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-full text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#9a0002]"
              >
                <option value="">Elegir repartidor…</option>
                {MOCK_DRIVERS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} · {d.status === "available" ? "Libre" : "Ocupado"}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => onStatus("delivering")}
              className="w-full h-10 rounded-full bg-gray-950 hover:bg-black text-white text-xs font-black cursor-pointer flex items-center justify-center gap-1.5"
            >
              <MaterialSymbol icon="two_wheeler" size={16} />
              Listo para enviar
            </button>
          </div>
        )}

        {ord.status === "delivering" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between h-9 px-3 rounded-full bg-[#f2ece2] dark:bg-[#231f1c] text-xs font-bold text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-1.5 min-w-0 truncate">
                <MaterialSymbol icon="person_pin" size={15} />
                {ord.driverName || "Sin asignar"}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 shrink-0">En ruta</span>
            </div>
            <button
              type="button"
              onClick={() => onStatus("delivered")}
              className="w-full h-10 rounded-full bg-gray-950 hover:bg-black text-white text-xs font-black cursor-pointer flex items-center justify-center gap-1.5"
            >
              <MaterialSymbol icon="task_alt" size={15} />
              Confirmar entrega
            </button>
          </div>
        )}

        {isDone && (
          <div className="h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
            <MaterialSymbol icon="check_circle" size={16} fill />
            Completado
          </div>
        )}
      </div>
    </article>
  );
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
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: newStatus,
          driverName: selectedDriver[orderId] || ord.driverName,
          estimatedTime: prepTimePicker[orderId] || ord.estimatedTime,
        };
      })
    );
  };

  const filteredOrders = orders.filter((ord) => {
    if (ord.status === "cancelled") return false;
    if (activeTab !== "all" && ord.status !== activeTab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ord.orderNumber.toString().includes(q) ||
      ord.customerName.toLowerCase().includes(q) ||
      ord.deliveryAddress.toLowerCase().includes(q)
    );
  });

  const countBy = (status: BoardStatus) => orders.filter((o) => o.status === status).length;
  const pendingCount = countBy("pending");
  const openCount = orders.filter((o) => o.status === "pending" || o.status === "preparing" || o.status === "delivering").length;

  const renderCard = (ord: DetailedOrder) => (
    <motion.div
      key={ord.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
    >
      <OrderCard
        ord={ord}
        prepMins={prepTimePicker[ord.id] || 25}
        onPrepMins={(mins) => setPrepTimePicker((prev) => ({ ...prev, [ord.id]: mins }))}
        driver={selectedDriver[ord.id] || ""}
        onDriver={(name) => setSelectedDriver((prev) => ({ ...prev, [ord.id]: name }))}
        onStatus={(status) => handleUpdateStatus(ord.id, status)}
      />
    </motion.div>
  );

  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-200 max-w-[1280px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-[28px] font-black text-gray-900 dark:text-white tracking-tight">
              Comandera
            </h1>
            {pendingCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-[#9a0002] text-white text-[11px] font-black flex items-center gap-1">
                <MaterialSymbol icon="notifications_active" size={14} />
                {pendingCount} {pendingCount === 1 ? "nuevo" : "nuevos"}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">Recepción, cocina y despacho en un solo tablero</p>
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={cn(
            CARD,
            "h-10 px-3.5 flex items-center gap-2 text-xs font-bold cursor-pointer",
            soundEnabled ? "text-gray-700 dark:text-gray-200" : "text-gray-400"
          )}
        >
          <MaterialSymbol icon={soundEnabled ? "volume_up" : "volume_off"} size={16} className={soundEnabled ? "text-[#9a0002]" : ""} />
          Alerta {soundEnabled ? "on" : "off"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          large
          icon="receipt_long"
          value={String(orders.filter((o) => o.status !== "cancelled").length)}
          label="Pedidos de hoy"
          sparkline={[...MOCK_SALES_CHART.week.orders]}
          sparkColor="#059669"
        />
        <StatCard
          large
          icon="pending_actions"
          value={String(openCount)}
          label="Abiertos ahora"
          sparkline={[3, 5, 4, 6, 8, 5, 7]}
          sparkColor="#9a0002"
        />
        <StatCard
          large
          icon="timer"
          value="3.2 min"
          label="T. respuesta prom."
          sparkline={[4.2, 3.8, 3.5, 3.2, 3.0, 3.2, 3.1]}
          sparkColor="#6366f1"
        />
        <StatCard
          large
          icon="payments"
          value={formatCurrency(orders.reduce((acc, o) => acc + o.total, 0))}
          label="Facturado hoy"
          sparkline={[...MOCK_SALES_CHART.week.delivery]}
          sparkColor="#d97706"
        />
      </div>

      <div className={cn(CARD, "p-2 sm:p-2.5 flex flex-col sm:flex-row sm:items-center gap-2")}>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {FILTER_TABS.map((tab) => {
            const count = tab.id === "all" ? 0 : countBy(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "h-9 px-3.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all",
                  isActive
                    ? "bg-[#9a0002] text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                <MaterialSymbol icon={tab.icon} size={15} fill={isActive} />
                {tab.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "min-w-4 h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center",
                      isActive ? "bg-white/20 text-white" : tab.id === "pending" ? "bg-[#9a0002] text-white" : "bg-[#f2ece2] dark:bg-[#231f1c] text-gray-600 dark:text-gray-300"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative sm:ml-auto sm:w-64">
          <MaterialSymbol icon="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar # o cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-[#faf6f1] dark:bg-[#231f1c] border border-transparent focus:border-[#9a0002]/40 rounded-full text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className={cn(CARD, "py-16 text-center")}>
          <MaterialSymbol icon="inbox" size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="font-black text-sm text-gray-700 dark:text-gray-300">No hay pedidos acá</p>
          <p className="text-xs text-gray-400 mt-1">Los nuevos aparecen solos en cuanto entran.</p>
        </div>
      ) : activeTab === "all" ? (
        <div className="space-y-10">
          {SECTIONS.map((section) => {
            const list = filteredOrders.filter((o) => o.status === section.id);
            if (!list.length) return null;
            return (
              <section key={section.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", section.chip)}>
                    <MaterialSymbol icon={section.icon} size={18} fill />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-black text-sm text-gray-900 dark:text-white tracking-tight">{section.label}</h2>
                    <p className="text-[11px] text-gray-400">
                      {list.length} {section.hint}
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-[#ede4d9] dark:bg-[#3d3732]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">{list.map(renderCard)}</AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">{filteredOrders.map(renderCard)}</AnimatePresence>
        </div>
      )}
    </div>
  );
}
