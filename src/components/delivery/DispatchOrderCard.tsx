"use client";

import { useState, useTransition } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { flashToast } from "@/components/FlashToast";
import { assignOrderToDriver, unassignOrder } from "@/lib/delivery/actions";
import type { ActiveDriver, DispatchOrderView } from "@/lib/delivery/types";
import {
  dispatchElapsedMinutes,
  formatDispatchMoney,
  formatDispatchTime,
} from "@/lib/delivery/display";
import { AssignDriverSelect } from "./AssignDriverSelect";
import { cn } from "@/lib/utils";

export function DispatchOrderCard({
  order,
  businessId,
  drivers,
  onChanged,
}: {
  order: DispatchOrderView;
  businessId: string;
  drivers: ActiveDriver[];
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [confirmUnassign, setConfirmUnassign] = useState(false);

  const base = `/negocio/${businessId}`;
  const preparing = order.status === "preparing";

  function runAssign(driverId: string) {
    setError(null);
    startTransition(async () => {
      const res = await assignOrderToDriver({ businessId, orderId: order.id, driverId });
      if (!res.ok) setError(res.error);
      else {
        flashToast(`Asignado a ${res.driverName}`);
        setSelecting(false);
        onChanged();
      }
    });
  }

  function runUnassign() {
    setError(null);
    startTransition(async () => {
      const res = await unassignOrder({ businessId, orderId: order.id });
      if (!res.ok) setError(res.error);
      else {
        flashToast("Pedido liberado");
        setConfirmUnassign(false);
        onChanged();
      }
    });
  }

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-[#3d3732] dark:bg-[#24201d]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold tracking-tight text-stone-900 dark:text-stone-100">
            #{order.orderNumber}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              preparing
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                : "bg-[#9a0002]/10 text-[#9a0002]",
            )}
          >
            {preparing ? "En cocina" : "En reparto"}
          </span>
        </div>
        <span className="text-[11px] font-medium text-stone-500">
          {formatDispatchTime(order.createdAt)} · ⏱ {dispatchElapsedMinutes(order.createdAt)} min
        </span>
      </div>

      <p className="mt-2.5 text-sm font-semibold text-stone-800 dark:text-stone-100">
        {order.customerName}
      </p>
      <p className="text-[12px] text-stone-600 dark:text-stone-400">
        {order.deliveryAddress ?? "-"}
      </p>
      <p className="mt-1 text-[12px] text-stone-500 dark:text-stone-500">{order.itemsSummary}</p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold text-stone-900 dark:text-stone-100">
          {formatDispatchMoney(order.totalCents)}
        </p>
        {preparing ? (
          <span className="text-[11px] font-medium text-stone-400">Se está preparando</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9a0002]">
            <MaterialSymbol icon="moped" size={15} /> En ruta
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-3 dark:border-[#332d29]">
        {order.driverName ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:bg-[#332d29] dark:text-stone-200">
              <MaterialSymbol icon="moped" size={14} />
              {order.driverName}
            </span>
            {selecting ? (
              <AssignDriverSelect
                drivers={drivers}
                label="Reasignar…"
                disabled={pending}
                onSelect={runAssign}
              />
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => setSelecting(true)}
                className="cursor-pointer rounded-lg px-2 py-1.5 text-[11px] font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50 dark:hover:bg-[#332d29] dark:hover:text-stone-100"
              >
                Reasignar
              </button>
            )}
            {confirmUnassign ? (
              <button
                type="button"
                disabled={pending}
                onClick={runUnassign}
                className="cursor-pointer rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                ¿Quitar?
              </button>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmUnassign(true)}
                className="cursor-pointer rounded-lg px-2 py-1.5 text-[11px] font-semibold text-stone-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-950/30"
              >
                Quitar
              </button>
            )}
          </>
        ) : (
          <AssignDriverSelect
            drivers={drivers}
            label="Asignar repartidor…"
            emptyHref={`${base}/configuracion/equipo`}
            emptyLabel="Invitá repartidores desde Equipo"
            disabled={pending}
            onSelect={runAssign}
          />
        )}
      </div>

      {error ? (
        <p className="mt-2 text-[11px] font-medium text-red-600">{error}</p>
      ) : null}
    </article>
  );
}