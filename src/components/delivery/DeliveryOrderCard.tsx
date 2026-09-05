"use client";

import { useState, useTransition } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { flashToast } from "@/components/FlashToast";
import { advanceOrderStatus } from "@/lib/orders/actions";
import { claimDeliveryOrder } from "@/lib/delivery/actions";
import type { DeliveryOrderView } from "@/lib/delivery/types";
import {
  dispatchElapsedMinutes,
  formatDispatchMoney,
  formatDispatchTime,
} from "@/lib/delivery/display";
import { PinConfirmInput } from "@/components/business/PinConfirmInput";
import { cn } from "@/lib/utils";

function statusLabel(order: DeliveryOrderView): { label: string; cls: string; icon: string } {
  switch (order.status) {
    case "preparing":
      return { label: "En preparación", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: "skillet" };
    case "delivering":
      return { label: "En camino", cls: "bg-[#9a0002]/10 text-[#9a0002]", icon: "moped" };
    case "delivered":
      return { label: "Entregado", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: "check_circle" };
    default:
      return { label: "Rechazado", cls: "bg-red-500/15 text-red-600", icon: "cancel" };
  }
}

export function DeliveryOrderCard({
  order,
  businessId,
  onChanged,
}: {
  order: DeliveryOrderView;
  businessId: string;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [pinOpen, setPinOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const badge = statusLabel(order);
  const mapsUrl = order.deliveryAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.deliveryAddress)}`
    : null;
  const telHref = order.customerPhone
    ? `tel:${order.customerPhone.replace(/\D/g, "")}`
    : null;

  function runClaim() {
    setError(null);
    startTransition(async () => {
      const res = await claimDeliveryOrder({ businessId, orderId: order.id });
      if (!res.ok) setError(res.error);
      else {
        flashToast(`Tomaste el pedido #${order.orderNumber}`);
        onChanged();
      }
    });
  }

  function runDeliver(pin: string) {
    setError(null);
    startTransition(async () => {
      const res = await advanceOrderStatus({
        businessId,
        orderId: order.id,
        targetStatus: "delivered",
        deliveryPin: pin,
      });
      if (!res.ok) setError(res.error);
      else {
        setPinOpen(false);
        flashToast(`Pedido #${order.orderNumber} entregado`);
        onChanged();
      }
    });
  }

  const canActDeliver = order.status === "delivering" && order.assignedToMe;
  const isHistory = order.status === "delivered" || order.status === "rejected";

  return (
    <>
      <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-[#3d3732] dark:bg-[#24201d]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold tracking-tight text-stone-900 dark:text-stone-100">
              #{order.orderNumber}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                badge.cls,
              )}
            >
              <MaterialSymbol icon={badge.icon} size={13} />
              {badge.label}
            </span>
          </div>
          <span className="text-[11px] font-medium text-stone-500">
            {formatDispatchTime(order.createdAt)} · ⏱ {dispatchElapsedMinutes(order.createdAt)} min
          </span>
        </div>

        <p className="mt-2.5 text-sm font-semibold text-stone-900 dark:text-stone-100">
          {order.deliveryAddress ?? "Entrega"}
        </p>
        <p className="mt-1 text-[12px] text-stone-600 dark:text-stone-300">{order.itemsSummary}</p>

        {(order.notes || order.customerName) && (
          <p className="mt-2 text-[12px] text-stone-500 dark:text-stone-400">
            {order.customerName}
            {order.customerVerified ? " · ✓ verificado" : ""}
            {order.notes ? ` · “${order.notes}”` : ""}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 pt-3 dark:border-[#332d29]">
          <p className="text-[13px] font-bold text-stone-900 dark:text-stone-100">
            {formatDispatchMoney(order.totalCents)}
          </p>
          <div className="flex items-center gap-1.5">
            {telHref && (
              <a
                href={telHref}
                title="Llamar al cliente"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-[#9a0002]/10 hover:text-[#9a0002] dark:bg-[#332d29] dark:text-stone-300"
              >
                <MaterialSymbol icon="call" size={16} />
              </a>
            )}
            {order.whatsappUrl && (
              <a
                href={order.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-emerald-500/10 hover:text-emerald-600 dark:bg-[#332d29] dark:text-stone-300"
              >
                <MaterialSymbol icon="chat" size={16} />
              </a>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir ruta en Google Maps"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-sky-500/10 hover:text-sky-600 dark:bg-[#332d29] dark:text-stone-300"
              >
                <MaterialSymbol icon="map" size={16} />
              </a>
            )}
          </div>
        </div>

        <div className="mt-3">
          {order.canClaim ? (
            <button
              type="button"
              disabled={pending}
              onClick={runClaim}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#9a0002] px-3 py-2.5 text-[12px] font-bold text-white hover:bg-[#850002] disabled:opacity-50"
            >
              <MaterialSymbol icon="moped" size={17} />
              Tomar pedido
            </button>
          ) : canActDeliver ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setPinOpen(true)}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2.5 text-[12px] font-bold text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
            >
              <MaterialSymbol icon="check_circle" size={17} />
              Confirmar entrega
            </button>
          ) : order.status === "preparing" ? (
            <p className="rounded-xl bg-amber-500/10 px-3 py-2.5 text-center text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              Se está preparando — te van a avisar cuando salga.
            </p>
          ) : isHistory ? (
            <p className="text-center text-[11px] font-semibold text-stone-400">
              {order.status === "rejected" && order.rejectionReason
                ? `Rechazado: ${order.rejectionReason}`
                : "Entrega cerrada"}
            </p>
          ) : null}
        </div>

        {error ? <p className="mt-2 text-[11px] font-medium text-red-600">{error}</p> : null}
      </article>

      {pinOpen ? (
        <PinConfirmInput onClose={() => setPinOpen(false)} onConfirm={runDeliver} pending={pending} />
      ) : null}
    </>
  );
}