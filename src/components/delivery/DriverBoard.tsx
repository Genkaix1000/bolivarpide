"use client";

import { useCallback, useState } from "react";
import { useDispatchLive, useDispatchTicker } from "@/hooks/useDispatchLive";
import type { DeliveryOrderView, DriverBoard as DriverBoardData } from "@/lib/delivery/types";
import { DeliveryOrderCard } from "./DeliveryOrderCard";
import { cn } from "@/lib/utils";

type TabId = "enCamino" | "disponibles" | "porSalir" | "historial";

const TABS: { id: TabId; label: string }[] = [
  { id: "enCamino", label: "En camino" },
  { id: "disponibles", label: "Disponibles" },
  { id: "porSalir", label: "Por salir" },
  { id: "historial", label: "Historial" },
];

const EMPTY_COPY: Record<TabId, string> = {
  enCamino: "No tenés envíos en camino ahora.",
  disponibles: "No hay pedidos disponibles para tomar.",
  porSalir: "No tenés pedidos preparándose.",
  historial: "Sin entregas recientes.",
};

export function DriverBoard({
  businessId,
  initial,
}: {
  businessId: string;
  initial: DriverBoardData;
}) {
  const [board, setBoard] = useState(initial);
  const [tab, setTab] = useState<TabId>("enCamino");

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/orders/delivery?businessId=${encodeURIComponent(businessId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    setBoard((await res.json()) as DriverBoardData);
  }, [businessId]);

  useDispatchLive(businessId, refresh);
  useDispatchTicker();

  const orders = board[tab];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">Reparto</h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Tu consola de entregas en tiempo real
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm dark:border-[#3d3732] dark:bg-[#24201d]">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "cursor-pointer rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors",
                active
                  ? "bg-[#9a0002] text-white"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-[#332d29] dark:hover:text-stone-100",
              )}
            >
              {t.label}
              <span className={cn("ml-1.5 text-[10px]", active ? "text-white/70" : "text-stone-400")}>
                {board[t.id].length}
              </span>
            </button>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-12 text-center text-sm text-stone-500 dark:border-stone-600">
          {EMPTY_COPY[tab]}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o: DeliveryOrderView) => (
            <DeliveryOrderCard key={o.id} order={o} businessId={businessId} onChanged={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}