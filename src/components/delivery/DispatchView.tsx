"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  ActiveDriver,
  DispatchOrderView,
  DispatchQueue,
} from "@/lib/delivery/types";
import { DispatchOrderCard } from "./DispatchOrderCard";

const LIVE_POLL_MS = 8_000;
const TICKER_MS = 30_000;

function Section({
  title,
  orders,
  businessId,
  drivers,
  onUpdated,
}: {
  title: string;
  orders: DispatchOrderView[];
  businessId: string;
  drivers: ActiveDriver[];
  onUpdated: () => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {title} ({orders.length})
      </h2>
      {orders.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-500">
          Sin pedidos acá ahora mismo.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {orders.map((o) => (
            <DispatchOrderCard
              key={o.id}
              order={o}
              businessId={businessId}
              drivers={drivers}
              onChanged={onUpdated}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function DispatchView({
  businessId,
  initial,
}: {
  businessId: string;
  initial: DispatchQueue;
}) {
  const [queue, setQueue] = useState(initial);
  const [, setTick] = useState(0);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/orders/dispatch?businessId=${encodeURIComponent(businessId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    setQueue((await res.json()) as DispatchQueue);
  }, [businessId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`reparto-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`,
        },
        () => void refresh(),
      )
      .subscribe();

    const poll = window.setInterval(() => void refresh(), LIVE_POLL_MS);
    const ticker = window.setInterval(() => setTick((x) => x + 1), TICKER_MS);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(poll);
      window.clearInterval(ticker);
      window.removeEventListener("focus", onFocus);
    };
  }, [businessId, refresh]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-xl font-bold">Reparto</h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Asigná repartidores a los envíos listos o en camino
        </p>
      </div>

      <Section
        title="En cocina"
        orders={queue.enCocina}
        businessId={businessId}
        drivers={queue.drivers}
        onUpdated={refresh}
      />

      <Section
        title="En reparto"
        orders={queue.enReparto}
        businessId={businessId}
        drivers={queue.drivers}
        onUpdated={refresh}
      />

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Repartidores ({queue.drivers.length})
        </h2>
        {queue.drivers.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-500">
            No hay repartidores activos.{" "}
            <a
              href={`/negocio/${businessId}/configuracion/equipo`}
              className="font-semibold text-[#9a0002] hover:underline"
            >
              Invitalos desde Equipo
            </a>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {queue.drivers.map((d) => (
              <div
                key={d.userId}
                className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm dark:border-[#3d3732] dark:bg-[#24201d]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9a0002]/10 text-xs font-bold text-[#9a0002]">
                  {d.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">
                    {d.displayName}
                  </p>
                  <p className="text-[11px] font-medium text-stone-500">
                    {d.activeDeliveriesCount} en ruta
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}