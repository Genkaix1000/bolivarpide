"use client";

import { useCallback, useEffect, useState } from "react";
import type { KitchenOrderTicket, OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import { KitchenTicketCard } from "./KitchenTicketCard";
import { createClient } from "@/lib/supabase/client";
import { ShellPageHeader } from "@/components/shell/ShellPageHeader";
import { cn } from "@/lib/utils";

const LIVE_POLL_MS = 8_000;

function TicketRow({
  title,
  tickets,
  businessId,
  onUpdated,
  highlightedId,
}: {
  title: string;
  tickets: KitchenOrderTicket[];
  businessId: string;
  onUpdated: () => void;
  highlightedId?: string | null;
}) {
  if (tickets.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
        {title} ({tickets.length})
      </h2>
      <div className="flex gap-5 overflow-x-auto px-1 py-3 pb-5 snap-x snap-mandatory">
        {tickets.map((t) => {
          const isTargeted = highlightedId === t.id;
          return (
            <div
              key={t.id}
              id={`ticket-${t.id}`}
              className={cn(
                "snap-start shrink-0 py-0.5 transition-all duration-500 rounded-[26px]",
                isTargeted &&
                  "ring-4 ring-[#9a0002] ring-offset-4 ring-offset-[#faf6f1] dark:ring-offset-[#141210] scale-[1.02] shadow-2xl",
              )}
            >
              <KitchenTicketCard ticket={t} businessId={businessId} onUpdated={onUpdated} />
            </div>
          );
        })}
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
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

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

  // Highlight and scroll into view if orderId is in search query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");
    if (!orderId) return;

    const t = setTimeout(() => {
      const el = document.getElementById(`ticket-${orderId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        setHighlightedId(orderId);
        const clearTimer = setTimeout(() => setHighlightedId(null), 4000);
        return () => clearTimeout(clearTimer);
      }
    }, 150);

    return () => clearTimeout(t);
  }, [tickets]);

  const byStatus = (s: OrderLifecycleStatus) => tickets.filter((t) => t.status === s);
  const pending = byStatus("pending");
  const preparing = byStatus("preparing");
  const delivering = byStatus("delivering");
  const done = tickets.filter((t) => t.status === "delivered" || t.status === "rejected");
  const active = pending.length + preparing.length + delivering.length;

  return (
    <div className="space-y-6">
      <ShellPageHeader
        title="Pedidos"
        description="Tickets en tiempo real · deslizá horizontalmente en cada fila"
        badge={active > 0 ? `${active} activos` : undefined}
      />

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-12 text-center text-sm text-stone-500">
          Sin pedidos activos. Aparecen acá cuando se confirma el pago.
        </div>
      ) : (
        <div className="space-y-8">
          {active === 0 ? (
            <p className="mt-1 text-[13px] font-medium text-stone-500 dark:text-stone-400">
              No hay pedidos en curso.
            </p>
          ) : null}
          <TicketRow
            title="Pendientes"
            tickets={pending}
            businessId={businessId}
            onUpdated={refresh}
            highlightedId={highlightedId}
          />
          <TicketRow
            title="En cocina"
            tickets={preparing}
            businessId={businessId}
            onUpdated={refresh}
            highlightedId={highlightedId}
          />
          <TicketRow
            title="En reparto"
            tickets={delivering}
            businessId={businessId}
            onUpdated={refresh}
            highlightedId={highlightedId}
          />
          {done.length > 0 ? (
            <section>
              <h2 className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                Finalizados ({done.length})
              </h2>
              <div className="flex gap-5 overflow-x-auto px-1 py-3 pb-5">
                {done.slice(-10).map((t) => {
                  const isTargeted = highlightedId === t.id;
                  return (
                    <div
                      key={t.id}
                      id={`ticket-${t.id}`}
                      className={cn(
                        "shrink-0 py-0.5 transition-all duration-500 rounded-[26px]",
                        isTargeted &&
                          "ring-4 ring-[#9a0002] ring-offset-4 ring-offset-[#faf6f1] dark:ring-offset-[#141210] scale-[1.02] shadow-2xl",
                      )}
                    >
                      <KitchenTicketCard ticket={t} businessId={businessId} onUpdated={refresh} />
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
