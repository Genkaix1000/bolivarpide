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

  const refreshPending = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("id, status, payment_status, payment_method, order_number, customer_name, total_cents")
      .eq("business_id", businessId)
      .eq("status", "pending");

    const orders = data ?? [];
    setPendingCount(orders.filter((o) => isKitchenEligible(o)).length);

    const alertOrders = orders.filter((o) => shouldAlertBusiness(o));
    setAlerts(
      alertOrders.map((o) => ({
        id: o.id,
        orderNumber: o.order_number ?? 0,
        customerName: o.customer_name ?? "Cliente",
        totalCents: o.total_cents ?? 0,
      }))
    );
  }, [businessId]);

  const dismiss = useCallback((orderId?: string) => {
    // Left for backwards compatibility if needed, but alerts are driven by order status
    if (orderId) {
      setAlerts((a) => a.filter((x) => x.id !== orderId));
    } else {
      setAlerts([]);
    }
  }, []);

  useEffect(() => {
    unlockOrderChime();
    const supabase = createClient();

    void supabase
      .from("orders")
      .select("id, status, payment_status, payment_method, order_number, customer_name, total_cents")
      .eq("business_id", businessId)
      .eq("status", "pending")
      .then(({ data }) => {
        const orders = data ?? [];
        for (const o of orders) {
          if (shouldAlertBusiness(o)) alerted.current.add(o.id);
        }
        setPendingCount(orders.filter((o) => isKitchenEligible(o)).length);
        const alertOrders = orders.filter((o) => shouldAlertBusiness(o));
        setAlerts(
          alertOrders.map((o) => ({
            id: o.id,
            orderNumber: o.order_number ?? 0,
            customerName: o.customer_name ?? "Cliente",
            totalCents: o.total_cents ?? 0,
          }))
        );
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
      if (!shouldAlertBusiness(row)) {
        setAlerts((prev) => prev.filter((a) => a.id !== row.id));
        return;
      }
      if (!alerted.current.has(row.id)) {
        alerted.current.add(row.id);
        playOrderChime();
      }
      setAlerts((prev) => {
        const exists = prev.find((a) => a.id === row.id);
        const nextItem: NewOrderAlert = {
          id: row.id,
          orderNumber: row.order_number ?? 0,
          customerName: row.customer_name ?? "Cliente",
          totalCents: row.total_cents,
        };
        if (exists) {
          return prev.map((a) => (a.id === row.id ? nextItem : a));
        }
        return [...prev, nextItem];
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

          void refreshPending();

          if (payload.eventType === "DELETE") {
            setAlerts((prev) => prev.filter((a) => a.id !== row.id));
          } else if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            if (row.status !== "pending") {
              setAlerts((prev) => prev.filter((a) => a.id !== row.id));
            } else {
              maybeAlert(row);
            }
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [businessId, refreshPending]);

  return { alerts, pendingCount, dismiss };
}
