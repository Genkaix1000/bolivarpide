"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { playOrderChime, unlockOrderChime } from "@/lib/orders/orderChime";
import { shouldAlertBusiness, isKitchenEligible } from "@/lib/orders/lifecycle";

export type NewOrderAlert = {
  id: string;
  orderNumber: number;
  customerName: string;
  totalCents: number;
};

export function useOrderAlerts(businessId: string) {
  const [alerts, setAlerts] = useState<NewOrderAlert[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const alerted = useRef(new Set<string>());

  const refreshPendingCount = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("id, status, payment_status, payment_method")
      .eq("business_id", businessId)
      .eq("status", "pending");
    setPendingCount((data ?? []).filter((o) => isKitchenEligible(o)).length);
  }, [businessId]);

  const dismiss = useCallback((orderId?: string) => {
    if (orderId) {
      setAlerts((a) => a.filter((x) => x.id !== orderId));
      alerted.current.add(orderId);
    } else {
      setAlerts((prev) => {
        for (const a of prev) alerted.current.add(a.id);
        return [];
      });
    }
    void refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    unlockOrderChime();
    const supabase = createClient();

    void supabase
      .from("orders")
      .select("id, status, payment_status, payment_method, order_number, customer_name")
      .eq("business_id", businessId)
      .eq("status", "pending")
      .then(({ data }) => {
        for (const o of data ?? []) {
          if (shouldAlertBusiness(o)) alerted.current.add(o.id);
        }
        setPendingCount((data ?? []).filter((o) => isKitchenEligible(o)).length);
      });

    const maybeAlert = (row: {
      id: string;
      status: string;
      payment_status: string;
      payment_method: string | null;
      order_number: number | null;
      customer_name: string | null;
      total_cents: number;
    }) => {
      if (!shouldAlertBusiness(row)) return;
      if (alerted.current.has(row.id)) return;
      alerted.current.add(row.id);
      playOrderChime();
      setAlerts((prev) => {
        if (prev.some((a) => a.id === row.id)) return prev;
        return [
          ...prev,
          {
            id: row.id,
            orderNumber: row.order_number ?? 0,
            customerName: row.customer_name ?? "Cliente",
            totalCents: row.total_cents,
          },
        ];
      });
    };

    const channel = supabase
      .channel(`order-alerts-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as {
            id: string;
            status: string;
            payment_status: string;
            payment_method: string | null;
            order_number: number | null;
            customer_name: string | null;
            total_cents: number;
          };
          if (!row?.id) return;

          void refreshPendingCount();

          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            maybeAlert(row);
            if (row.status !== "pending") {
              setAlerts((prev) => prev.filter((a) => a.id !== row.id));
            }
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [businessId, refreshPendingCount]);

  return { alerts, pendingCount, dismiss };
}
