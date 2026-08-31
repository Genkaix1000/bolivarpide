"use client";

import React, { useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import {
  type Conversation,
  type ChatOrderStatus,
} from "@/lib/business/mockChatData";
import { flashToast } from "@/components/FlashToast";

interface ChatContextPaneProps {
  conversation: Conversation;
  onUpdateOrderStatus: (orderId: string, newStatus: ChatOrderStatus) => void;
  onClose?: () => void;
  className?: string;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

const STATUS_STEPS: { id: ChatOrderStatus; label: string; icon: string }[] = [
  { id: "pending", label: "Nuevo", icon: "schedule" },
  { id: "preparing", label: "En Cocina", icon: "skillet" },
  { id: "ready", label: "Listo", icon: "check_circle" },
  { id: "delivering", label: "En Camino", icon: "delivery_dining" },
  { id: "delivered", label: "Entregado", icon: "done_all" },
];

export function ChatContextPane({
  conversation,
  onUpdateOrderStatus,
  onClose,
  className,
}: ChatContextPaneProps) {
  const [historyOpen, setHistoryOpen] = useState(true);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedField(field);
    flashToast(`${field} copiado al portapapeles`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const activeOrder = conversation.activeOrder;
  const isOrderActive = Boolean(activeOrder && activeOrder.status !== "delivered" && activeOrder.status !== "cancelled");

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-[#fdfcfb] dark:bg-[#161413] border-l border-[#e8e0d6] dark:border-[#2a2623] overflow-y-auto select-none",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 pb-3 border-b border-[#eee7de] dark:border-[#24201d] flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Detalles del Cliente
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          >
            <MaterialSymbol icon="close" size={18} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Customer Profile Card */}
        <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-[#f7f2ea] dark:bg-[#1f1b19] border border-black/5 dark:border-white/5">
          <div className="relative mb-2.5">
            {conversation.customer.avatarUrl ? (
              <img
                src={conversation.customer.avatarUrl}
                alt={conversation.customer.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-white dark:ring-[#161413] shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#e8e0d6] dark:bg-[#2b2521] text-gray-700 dark:text-gray-200 flex items-center justify-center font-bold text-lg">
                {conversation.customer.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1f1b19]" />
          </div>

          <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {conversation.customer.name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {conversation.customer.phone}
          </p>

          <div className="flex items-center gap-1 mt-2 flex-wrap justify-center">
            {conversation.customer.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#9a0002]/10 text-[#9a0002] dark:text-red-400"
              >
                {tag}
              </span>
            ))}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300">
              {conversation.customer.totalOrdersCount} pedidos
            </span>
          </div>

          {/* Customer Address & Quick Copy */}
          <div className="w-full mt-3 pt-3 border-t border-black/5 dark:border-white/5 text-left text-[11px] space-y-1.5">
            <div className="flex items-start justify-between gap-1 text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1 text-gray-400 shrink-0">
                <MaterialSymbol icon="location_on" size={14} className="text-[#9a0002]" />
                Dirección:
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(conversation.customer.address, "Dirección")}
                className="font-semibold text-right hover:text-[#9a0002] truncate transition-colors flex items-center gap-1 cursor-pointer"
                title="Copiar dirección"
              >
                <span className="truncate">{conversation.customer.address}</span>
                <MaterialSymbol
                  icon={copiedField === "Dirección" ? "check" : "content_copy"}
                  size={12}
                  className="shrink-0 text-gray-400"
                />
              </button>
            </div>

            {conversation.customer.notes && (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-[10.5px] leading-tight flex items-start gap-1.5">
                <MaterialSymbol icon="info" size={14} className="shrink-0 mt-0.5" />
                <span>{conversation.customer.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Active Comanda (Ticket) */}
        {isOrderActive && activeOrder ? (
          <div className="rounded-2xl bg-white dark:bg-[#1f1b19] border border-[#9a0002]/20 dark:border-[#9a0002]/40 p-4 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#9a0002]" />

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-[#9a0002] text-white font-black text-xs">
                  #{activeOrder.orderNumber}
                </span>
                <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                  Comanda en curso
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                {activeOrder.createdAt}
              </span>
            </div>

            {/* Stepper Status Selector */}
            <div className="mb-3.5 p-2 rounded-xl bg-[#f7f2ea] dark:bg-[#161413] border border-black/5 dark:border-white/5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Estado del pedido:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {STATUS_STEPS.filter((s) => s.id !== "pending").map((step) => {
                  const isCurrent = activeOrder.status === step.id;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => onUpdateOrderStatus(activeOrder.id, step.id)}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                        isCurrent
                          ? "bg-[#9a0002] text-white shadow-xs"
                          : "bg-white dark:bg-[#25201d] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2e2825]"
                      )}
                    >
                      <MaterialSymbol icon={step.icon} size={14} />
                      {step.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 mb-3 divide-y divide-gray-100 dark:divide-stone-800">
              {activeOrder.items.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 text-[12px]">
                  <div className="flex items-start justify-between gap-1 font-semibold text-gray-900 dark:text-gray-100">
                    <span>
                      {item.quantity}× {item.name}
                    </span>
                    <span>{formatCents(item.priceCents * item.quantity)}</span>
                  </div>
                  {item.options && (
                    <p className="text-[10.5px] text-gray-500 dark:text-gray-400">
                      {item.options.join(" · ")}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-[10.5px] text-[#9a0002] dark:text-red-400 italic">
                      Nota: {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Total & Payment Method */}
            <div className="pt-2.5 border-t border-dashed border-gray-200 dark:border-stone-700 flex items-center justify-between text-[13px] font-bold text-gray-900 dark:text-gray-100">
              <span>Total:</span>
              <span className="text-[#9a0002] dark:text-red-400 text-sm font-black">
                {formatCents(activeOrder.totalCents)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <MaterialSymbol icon="payments" size={14} />
                Pago: {activeOrder.paymentMethod.toUpperCase()}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md font-bold text-[10px]",
                  activeOrder.paymentStatus === "paid"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                )}
              >
                {activeOrder.paymentStatus === "paid" ? "Abonado" : "Pendiente"}
              </span>
            </div>

            {activeOrder.driverName && (
              <div className="mt-2.5 p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-900 dark:text-sky-300 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MaterialSymbol icon="delivery_dining" size={15} />
                  Cadete: <b>{activeOrder.driverName}</b>
                </span>
                {activeOrder.driverPhone && (
                  <a
                    href={`tel:${activeOrder.driverPhone}`}
                    className="text-sky-600 dark:text-sky-400 underline font-bold"
                  >
                    Llamar
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#f7f2ea]/70 dark:bg-[#1f1b19]/70 border border-black/5 dark:border-white/5 text-center text-gray-400">
            <MaterialSymbol icon="receipt" size={24} className="mx-auto mb-1 opacity-50" />
            <p className="text-[11.5px] font-semibold text-gray-600 dark:text-gray-300">
              Sin pedido activo
            </p>
            <p className="text-[10px] text-gray-400">
              Las consultas o dudas del cliente se responden por acá
            </p>
          </div>
        )}

        {/* Order History Accordion */}
        <div className="rounded-2xl bg-white dark:bg-[#1f1b19] border border-black/5 dark:border-white/5 overflow-hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs text-gray-900 dark:text-gray-100 hover:bg-black/2 dark:hover:bg-white/2 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <MaterialSymbol icon="history" size={16} className="text-gray-500" />
              Historial de Pedidos ({conversation.pastOrders.length})
            </span>
            <MaterialSymbol
              icon={historyOpen ? "expand_less" : "expand_more"}
              size={18}
              className="text-gray-400"
            />
          </button>

          {historyOpen && (
            <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-black/5 dark:border-white/5 pt-2.5">
              {conversation.pastOrders.length === 0 ? (
                <p className="text-[11px] text-gray-400 text-center py-2">
                  No registra pedidos anteriores
                </p>
              ) : (
                conversation.pastOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-2.5 rounded-xl bg-[#f7f2ea] dark:bg-[#161413] text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#9a0002] dark:text-red-400">
                        #{order.orderNumber}
                      </span>
                      <span className="text-gray-400 font-medium">{order.date}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-[10.5px]">
                      {order.itemsSummary}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5 font-semibold text-gray-900 dark:text-gray-100">
                      <span>Total:</span>
                      <span>{formatCents(order.totalCents)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Media & Attachments Accordion */}
        {conversation.sharedMedia.length > 0 && (
          <div className="rounded-2xl bg-white dark:bg-[#1f1b19] border border-black/5 dark:border-white/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setMediaOpen((o) => !o)}
              className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs text-gray-900 dark:text-gray-100 hover:bg-black/2 dark:hover:bg-white/2 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <MaterialSymbol icon="photo_library" size={16} className="text-gray-500" />
                Archivos y Fotos ({conversation.sharedMedia.length})
              </span>
              <MaterialSymbol
                icon={mediaOpen ? "expand_less" : "expand_more"}
                size={18}
                className="text-gray-400"
              />
            </button>

            {mediaOpen && (
              <div className="p-3 grid grid-cols-2 gap-2 border-t border-black/5 dark:border-white/5">
                {conversation.sharedMedia.map((m) => (
                  <div
                    key={m.id}
                    className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                  >
                    <img src={m.url} alt={m.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1.5 text-[9px] text-white font-medium">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
