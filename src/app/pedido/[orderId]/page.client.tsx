"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { OrderTrackingView } from "@/lib/orders/lifecycle";
import { OrderTrackingSheet } from "@/components/orders/OrderTrackingSheet";
import { OrderTrackingMap } from "@/components/orders/OrderTrackingMap";
import { MaterialSymbol } from "@/components/ui/material-symbol";

const LIVE_POLL_MS = 8_000;

export function OrderTrackingClient({
  orderId,
  initial,
}: {
  orderId: string;
  initial: OrderTrackingView;
}) {
  const [view, setView] = useState(initial);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}/tracking`, { cache: "no-store" });
    if (!res.ok) return;
    const j = (await res.json()) as OrderTrackingView;
    setView(j);
  }, [orderId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`track-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
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
  }, [orderId, refresh]);

  return (
    <div className="fixed inset-0 flex h-dvh flex-col overflow-hidden bg-[#ebe8e4]">
      <div className="relative min-h-0 flex-1">
        {view.map?.showMap ? (
          <OrderTrackingMap
            map={view.map}
            status={view.status}
            orderId={orderId}
            className="absolute inset-0"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#e8e0d6] to-[#f3efe8]" />
        )}

        <Link
          href="/"
          className="absolute left-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/55 active:scale-95"
          style={{ top: "max(12px, env(safe-area-inset-top))" }}
          aria-label="Volver"
        >
          <MaterialSymbol icon="arrow_back" size={20} />
        </Link>
      </div>

      <OrderTrackingSheet view={view} />
    </div>
  );
}
