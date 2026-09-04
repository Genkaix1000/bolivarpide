"use client";

import { useState, type ReactNode } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import {
  isLiveOrder,
  type Conversation,
  type ChatOrderStatus,
} from "@/lib/business/chatTypes";

interface ChatContextPaneProps {
  conversation: Conversation;
  onUpdateOrderStatus: (orderId: string, newStatus: ChatOrderStatus) => void;
  onNewComanda: () => void;
  onLinkOrder: () => void;
  onClose?: () => void;
  className?: string;
}

type Section = "order" | "client" | "history" | "media" | null;

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

const NEXT_STATUS: Partial<Record<ChatOrderStatus, ChatOrderStatus>> = {
  pending: "preparing",
  preparing: "delivering",
  delivering: "delivered",
};

const STATUS_LABEL: Record<ChatOrderStatus, string> = {
  pending: "Nuevo",
  preparing: "En Cocina",
  delivering: "En Camino",
  delivered: "Entregado",
  rejected: "Rechazado",
};

export function ChatContextPane({
  conversation,
  onUpdateOrderStatus,
  onNewComanda,
  onLinkOrder,
  onClose,
  className,
}: ChatContextPaneProps) {
  const activeOrder = conversation.activeOrder;
  const isOrderActive = isLiveOrder(activeOrder);
  const [open, setOpen] = useState<Section>(isOrderActive ? "order" : "client");

  function toggle(section: Section) {
    setOpen((cur) => (cur === section ? null : section));
  }

  function copy(text: string, label: string) {
    void navigator.clipboard?.writeText(text);
    // flashToast lives in FlashToast; keep inline to avoid coupling.
    import("@/components/FlashToast").then(({ flashToast }) => flashToast(`${label} copiado`));
  }

  const next = activeOrder ? NEXT_STATUS[activeOrder.status] : undefined;
  const cleanPhone = conversation.customer.phone.replace(/\D/g, "");

  return (
    <aside className={cn("flex h-full min-h-0 flex-col select-none", className)}>
      <div className="shrink-0 border-b border-[#eee7de] px-4 pb-4 pt-4 dark:border-[#24201d]">
        <div className="mb-3 flex items-start justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Detalles</p>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-black/5 hover:text-gray-700"
              aria-label="Cerrar"
            >
              <MaterialSymbol icon="close" size={18} />
            </button>
          ) : null}
        </div>

        <div className="flex flex-col items-center text-center">
          <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8e0d6] text-lg font-bold text-gray-700 dark:bg-[#2b2521] dark:text-gray-200">
            {conversation.customer.name.slice(0, 2).toUpperCase()}
          </span>
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
            {conversation.customer.name}
          </h3>
          <p className="text-[12px] text-gray-500">{conversation.customer.phone}</p>

          <div className="mt-3 flex gap-2">
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold text-gray-600 hover:bg-black/5 dark:text-gray-300"
            >
              <MaterialSymbol icon="chat" size={18} className="text-[#25d366]" />
              Chat
            </a>
            <button
              type="button"
              onClick={() => copy(conversation.customer.phone, "Teléfono")}
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold text-gray-600 hover:bg-black/5 dark:text-gray-300"
            >
              <MaterialSymbol icon="call" size={18} />
              Copiar
            </button>
            {conversation.customer.address ? (
              <button
                type="button"
                onClick={() => copy(conversation.customer.address!, "Dirección")}
                className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold text-gray-600 hover:bg-black/5 dark:text-gray-300"
              >
                <MaterialSymbol icon="location_on" size={18} className="text-[#9a0002]" />
                Dir.
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isOrderActive && activeOrder ? (
          <Accordion
            title={`Comanda #${activeOrder.orderNumber}`}
            icon="receipt_long"
            open={open === "order"}
            onToggle={() => toggle("order")}
          >
            <p className="mb-2 text-[12px] font-semibold text-gray-800 dark:text-gray-100">
              {activeOrder.statusLabel}
              <span className="font-normal text-gray-500"> · {activeOrder.createdAt}</span>
            </p>

            {next ? (
              <button
                type="button"
                onClick={() => onUpdateOrderStatus(activeOrder.id, next!)}
                className="mb-2 w-full rounded-xl bg-[#9a0002] py-2 text-[12px] font-bold text-white hover:bg-[#7e0002]"
              >
                Pasar a {STATUS_LABEL[next]}
              </button>
            ) : null}

            <ul className="space-y-2 text-[12px]">
              {activeOrder.items.map((item, idx) => (
                <li key={idx} className="flex justify-between gap-2">
                  <span className="min-w-0">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {item.quantity}× {item.name}
                    </span>
                    {item.options?.length ? (
                      <span className="block text-[10px] text-gray-500">
                        {item.options.join(" · ")}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatCents(item.priceCents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-dashed border-stone-200 pt-2 text-[13px] font-bold dark:border-stone-700">
              <span>Total</span>
              <span className="text-[#9a0002]">{formatCents(activeOrder.totalCents)}</span>
            </div>
          </Accordion>
        ) : (
          <Accordion
            title="Sin comanda activa"
            icon="receipt_long"
            open={open === "order"}
            onToggle={() => toggle("order")}
          >
            <p className="mb-2 text-[11px] text-gray-500">
              Este chat todavía no tiene un pedido en curso.
            </p>
            <button
              type="button"
              onClick={onNewComanda}
              className="mb-1.5 w-full rounded-xl bg-[#9a0002] py-2 text-[12px] font-bold text-white hover:bg-[#7e0002]"
            >
              + Nueva comanda
            </button>
            <button
              type="button"
              onClick={onLinkOrder}
              className="w-full rounded-xl border border-[#e0d7cb] py-2 text-[12px] font-bold text-gray-700 hover:bg-black/5 dark:border-stone-700 dark:text-gray-300"
            >
              Vincular pedido existente
            </button>
          </Accordion>
        )}

        <Accordion
          title="Cliente"
          icon="person"
          open={open === "client"}
          onToggle={() => toggle("client")}
        >
          <dl className="space-y-2 text-[12px]">
            <div>
              <dt className="text-[10px] font-semibold uppercase text-gray-400">Teléfono</dt>
              <dd className="text-gray-800 dark:text-gray-200">{conversation.customer.phone}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase text-gray-400">Pedidos</dt>
              <dd className="text-gray-800 dark:text-gray-200">
                {conversation.customer.totalOrdersCount}
              </dd>
            </div>
            {conversation.customer.address ? (
              <div>
                <dt className="text-[10px] font-semibold uppercase text-gray-400">Dirección</dt>
                <dd className="text-gray-800 dark:text-gray-200">
                  {conversation.customer.address}
                </dd>
              </div>
            ) : null}
          </dl>
        </Accordion>

        <Accordion
          title={`Historial (${conversation.pastOrders.length})`}
          icon="history"
          open={open === "history"}
          onToggle={() => toggle("history")}
        >
          {conversation.pastOrders.length === 0 ? (
            <p className="py-2 text-center text-[11px] text-gray-400">
              Sin pedidos anteriores
            </p>
          ) : (
            <ul className="space-y-2">
              {conversation.pastOrders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-xl bg-[#f7f2ea] p-2.5 text-[11px] dark:bg-[#161413]"
                >
                  <div className="flex justify-between font-bold">
                    <span className="text-[#9a0002]">#{order.orderNumber}</span>
                    <span className="font-medium text-gray-400">{order.date}</span>
                  </div>
                  <p className="mt-0.5 text-gray-600 dark:text-gray-300">
                    {order.itemsSummary}
                  </p>
                  <p className="mt-1 font-semibold">{formatCents(order.totalCents)}</p>
                </li>
              ))}
            </ul>
          )}
        </Accordion>

        {conversation.sharedMedia.length > 0 ? (
          <Accordion
            title={`Archivos (${conversation.sharedMedia.length})`}
            icon="photo_library"
            open={open === "media"}
            onToggle={() => toggle("media")}
          >
            <div className="grid grid-cols-3 gap-1.5">
              {conversation.sharedMedia.map((m) => (
                <div key={m.id} className="relative aspect-square overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.label} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </Accordion>
        ) : null}
      </div>
    </aside>
  );
}

function Accordion({
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[#eee7de] dark:border-[#24201d]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-[12px] font-bold text-gray-900 hover:bg-black/[0.02] dark:text-gray-100"
      >
        <span className="flex items-center gap-1.5">
          <MaterialSymbol icon={icon} size={16} className="text-gray-500" />
          {title}
        </span>
        <MaterialSymbol
          icon={open ? "expand_less" : "expand_more"}
          size={18}
          className="text-gray-400"
        />
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}