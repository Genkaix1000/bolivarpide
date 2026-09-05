"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export const DISPATCH_LIVE_POLL_MS = 8_000;
export const DISPATCH_TICK_MS = 30_000;

/**
 * Realtime + polling + focus para el panel de reparto.
 * Re-fetch completo ante cualquier cambio en `orders` del negocio
 * (asignaciones, takes, PIN y entregas comparten el canal).
 */
export function useDispatchLive(businessId: string, refresh: () => void) {
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
        () => refresh(),
      )
      .subscribe();

    const poll = window.setInterval(refresh, DISPATCH_LIVE_POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
  }, [businessId, refresh]);
}

/** Contador que avanza cada 30 s para re-renderizar los tiempos transcurridos. */
export function useDispatchTicker(intervalMs = DISPATCH_TICK_MS): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return tick;
}