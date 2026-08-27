"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { setOrderStatus } from "@/lib/business/actions";

type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  customer_name: string | null;
  created_at: string;
  order_items?: { name: string; quantity: number }[];
};

function beep() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.start();
    o.stop(ctx.currentTime + 0.15);
  } catch {
    /* ignore */
  }
}

export function OrdersBoard({
  businessId,
  initialOrders,
}: {
  businessId: string;
  initialOrders: OrderRow[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const seen = useRef(new Set(initialOrders.map((o) => o.id)));

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`orders-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`,
        },
        async () => {
          const { data } = await supabase
            .from("orders")
            .select("id, status, total_cents, customer_name, created_at, order_items(name, quantity)")
            .eq("business_id", businessId)
            .order("created_at", { ascending: false })
            .limit(100);
          const next = (data ?? []) as OrderRow[];
          for (const o of next) {
            if (!seen.current.has(o.id) && o.status === "pending") beep();
            seen.current.add(o.id);
          }
          setOrders(next);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [businessId]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Pedidos</h1>
        <p className="text-sm text-stone-600">Realtime + alerta sonora en nuevos `pending`.</p>
      </div>
      <ul className="space-y-2">
        {orders.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500">
            Sin pedidos. Creá uno de prueba desde SQL o admin seed.
          </li>
        ) : (
          orders.map((o) => (
            <li
              key={o.id}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {o.customer_name ?? "Cliente"} · $
                    {(o.total_cents / 100).toLocaleString("es-AR")}
                  </p>
                  <p className="text-xs text-stone-500">
                    {o.status} · {new Date(o.created_at).toLocaleString("es-AR")}
                  </p>
                  <p className="text-xs text-stone-600">
                    {(o.order_items ?? [])
                      .map((i) => `${i.quantity}× ${i.name}`)
                      .join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {["accepted", "preparing", "ready", "delivered", "cancelled"].map((s) => (
                    <form key={s} action={setOrderStatus}>
                      <input type="hidden" name="businessId" value={businessId} />
                      <input type="hidden" name="orderId" value={o.id} />
                      <input type="hidden" name="status" value={s} />
                      <button
                        type="submit"
                        className="rounded-full border border-stone-300 px-2 py-1 text-[11px] cursor-pointer"
                      >
                        {s}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
