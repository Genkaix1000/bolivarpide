"use client";

import { useCallback, useEffect, useState } from "react";
import type { KitchenOrderTicket, OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import { KitchenTicketCard } from "./KitchenTicketCard";
import { createClient } from "@/lib/supabase/client";

const LIVE_POLL_MS = 8_000;

function TicketRow({ title, tickets, businessId, onUpdated }: {
  title: string;
  tickets: KitchenOrderTicket[];
  businessId: string;
  onUpdated: () => void;
}) {
  if (tickets.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500">
        {title} ({tickets.length})
      </h2>
      <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">
        {tickets.map((t) => (
          <div key={t.id} className="snap-start">
            <KitchenTicketCard ticket={t} businessId={businessId} onUpdated={onUpdated} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ComanderaBoard({
  businessId,
  initialTickets,
}: {
  businessId: string;
  initialTickets: KitchenOrderTicket[];
}) {
  const [tickets, setTickets] = useState(initialTickets);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/orders/kitchen?businessId=${encodeURIComponent(businessId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const j = (await res.json()) as { tickets: KitchenOrderTicket[] };
    setTickets(j.tickets ?? []);
  }, [businessId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comandera-${businessId}`)
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
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
  }, [businessId, refresh]);

  const byStatus = (s: OrderLifecycleStatus) => tickets.filter((t) => t.status === s);
  const pending = byStatus("pending");
  const preparing = byStatus("preparing");
  const delivering = byStatus("delivering");
  const done = tickets.filter((t) => t.status === "delivered" || t.status === "rejected");
  const active = pending.length + preparing.length + delivering.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Comandera</h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Tickets en tiempo real · deslizá horizontalmente en cada fila
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-12 text-center text-sm text-stone-500">
          Sin pedidos activos. Aparecen acá cuando se confirma el pago.
        </div>
      ) : (
        <div className="space-y-8">
          {active === 0 ? (
            <p className="text-sm text-stone-500">No hay pedidos en curso.</p>
          ) : null}
          <TicketRow title="Pendientes" tickets={pending} businessId={businessId} onUpdated={refresh} />
          <TicketRow title="En cocina" tickets={preparing} businessId={businessId} onUpdated={refresh} />
          <TicketRow title="En reparto" tickets={delivering} businessId={businessId} onUpdated={refresh} />
          {done.length > 0 ? (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500">
                Finalizados ({done.length})
              </h2>
              <div className="flex gap-5 overflow-x-auto pb-4">
                {done.slice(-10).map((t) => (
                  <KitchenTicketCard key={t.id} ticket={t} businessId={businessId} onUpdated={refresh} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
