"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { TrendingItem } from "@/lib/mockData";
import { createClient } from "@/lib/supabase/client";
import type { PendingCustomerOrder } from "@/lib/orders/pending";
import type { ActiveCustomerOrder } from "@/lib/orders/active";
import { flashToastUndo } from "@/components/FlashToast";
import {
  type CartState,
  type SelectedOptions,
  addLine,
  addNeedsSwitch,
  clearCart,
  requiredOptionsMissing,
  setLineQty,
} from "@/lib/cart";

type Ui =
  | { kind: "idle" }
  | { kind: "product"; item: TrendingItem }
  | { kind: "switch"; item: TrendingItem; selected?: SelectedOptions; note?: string; qty: number }
  | { kind: "upsell"; item: TrendingItem }
  | { kind: "drawer" }
  | { kind: "checkout"; resumePending?: boolean };

interface CartContextValue {
  cart: CartState;
  ui: Ui;
  pendingOrder: PendingCustomerOrder | null;
  activeOrder: ActiveCustomerOrder | null;
  activeOrderBarVisible: boolean;
  openProduct: (item: TrendingItem) => void;
  /** + / quick-add: opens sheet if required options; else adds (or switch confirm) */
  quickAdd: (item: TrendingItem) => void;
  confirmAdd: (item: TrendingItem, qty: number, selected?: SelectedOptions, note?: string) => void;
  confirmSwitch: () => void;
  cancelSwitch: () => void;
  closeUi: () => void;
  openDrawer: () => void;
  openCheckout: () => void;
  openPendingCheckout: () => void;
  scheduleOrderCancel: (orderId: string) => void;
  refreshPendingOrder: () => Promise<void>;
  refreshActiveOrder: () => Promise<void>;
  dismissActiveOrderBar: () => void;
  setPendingOrder: (order: PendingCustomerOrder | null) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const ORDER_CANCEL_DELAY_MS = 4500;
const BAR_DISMISS_KEY = "bp_order_bar_dismissed";

function readDismissedOrderId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(BAR_DISMISS_KEY);
}

function writeDismissedOrderId(orderId: string) {
  sessionStorage.setItem(BAR_DISMISS_KEY, orderId);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>({ chainId: null, lines: [] });
  const [ui, setUi] = useState<Ui>({ kind: "idle" });
  const [pendingOrder, setPendingOrder] = useState<PendingCustomerOrder | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveCustomerOrder | null>(null);
  const [barDismissedId, setBarDismissedId] = useState<string | null>(null);
  const pendingCancelRef = useRef<number | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<{
    item: TrendingItem;
    selected?: SelectedOptions;
    note?: string;
    qty: number;
  } | null>(null);

  const commit = useCallback(
    (item: TrendingItem, qty: number, selected?: SelectedOptions, note?: string) => {
      if (requiredOptionsMissing(item, selected)) {
        setUi({ kind: "product", item });
        return;
      }
      if (addNeedsSwitch(cart, item.chainId)) {
        setPendingSwitch({ item, selected, note, qty });
        setUi({ kind: "switch", item, selected, note, qty });
        return;
      }
      setCart((c) => addLine(c, item, qty, selected, note));
      if (activeOrder) {
        writeDismissedOrderId(activeOrder.orderId);
        setBarDismissedId(activeOrder.orderId);
      }
      setUi({ kind: "upsell", item });
    },
    [cart, activeOrder]
  );

  const openProduct = useCallback((item: TrendingItem) => {
    setUi({ kind: "product", item });
  }, []);

  const quickAdd = useCallback(
    (item: TrendingItem) => {
      if (requiredOptionsMissing(item, undefined)) {
        setUi({ kind: "product", item });
        return;
      }
      commit(item, 1);
    },
    [commit]
  );

  const confirmAdd = useCallback(
    (item: TrendingItem, qty: number, selected?: SelectedOptions, note?: string) => {
      commit(item, qty, selected, note);
    },
    [commit]
  );

  const confirmSwitch = useCallback(() => {
    if (!pendingSwitch) return;
    setCart(addLine(clearCart(), pendingSwitch.item, pendingSwitch.qty, pendingSwitch.selected, pendingSwitch.note));
    if (activeOrder) {
      writeDismissedOrderId(activeOrder.orderId);
      setBarDismissedId(activeOrder.orderId);
    }
    setUi({ kind: "upsell", item: pendingSwitch.item });
    setPendingSwitch(null);
  }, [pendingSwitch, activeOrder]);

  const cancelSwitch = useCallback(() => {
    setPendingSwitch(null);
    setUi({ kind: "idle" });
  }, []);

  const refreshPendingOrder = useCallback(async () => {
    try {
      const res = await fetch("/api/orders/pending");
      if (!res.ok) return;
      const j = (await res.json()) as { pending: PendingCustomerOrder | null };
      setPendingOrder(j.pending);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshActiveOrder = useCallback(async () => {
    try {
      const res = await fetch("/api/orders/active");
      if (!res.ok) return;
      const j = (await res.json()) as { active: ActiveCustomerOrder | null };
      setActiveOrder(j.active);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    await Promise.all([refreshPendingOrder(), refreshActiveOrder()]);
  }, [refreshPendingOrder, refreshActiveOrder]);

  useEffect(() => {
    setBarDismissedId(readDismissedOrderId());
  }, []);

  useEffect(() => {
    void refreshOrders();
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshOrders();
    });

    let channel: ReturnType<typeof supabase.channel> | null = null;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`customer-orders-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `customer_user_id=eq.${user.id}`,
          },
          () => void refreshOrders(),
        )
        .subscribe();
    });

    return () => {
      subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [refreshOrders]);

  const closeUi = useCallback(() => setUi({ kind: "idle" }), []);
  const openDrawer = useCallback(() => setUi({ kind: "drawer" }), []);
  const openCheckout = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const params = new URLSearchParams(window.location.search);
      params.set("openCheckout", "1");
      const returnPath =
        window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.location.assign(`/login?next=${encodeURIComponent(returnPath)}`);
      return;
    }
    setUi({ kind: "checkout" });
  }, []);
  const openPendingCheckout = useCallback(() => {
    setUi({ kind: "checkout", resumePending: true });
  }, []);

  const scheduleOrderCancel = useCallback(
    (orderId: string) => {
      if (pendingCancelRef.current) clearTimeout(pendingCancelRef.current);

      setPendingOrder(null);
      if (ui.kind === "checkout") setUi({ kind: "idle" });

      pendingCancelRef.current = window.setTimeout(async () => {
        pendingCancelRef.current = null;
        try {
          await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
        } finally {
          await refreshPendingOrder();
        }
      }, ORDER_CANCEL_DELAY_MS);

      flashToastUndo({
        message: "Pedido cancelado",
        onUndo: () => {
          if (pendingCancelRef.current) {
            clearTimeout(pendingCancelRef.current);
            pendingCancelRef.current = null;
          }
          void refreshPendingOrder();
        },
      });
    },
    [ui.kind, refreshPendingOrder],
  );

  useEffect(() => {
    return () => {
      if (pendingCancelRef.current) clearTimeout(pendingCancelRef.current);
    };
  }, []);
  const setQty = useCallback((key: string, qty: number) => {
    setCart((c) => setLineQty(c, key, qty));
  }, []);
  const clear = useCallback(() => {
    setCart(clearCart());
    setUi({ kind: "idle" });
  }, []);

  const dismissActiveOrderBar = useCallback(() => {
    if (!activeOrder) return;
    writeDismissedOrderId(activeOrder.orderId);
    setBarDismissedId(activeOrder.orderId);
  }, [activeOrder]);

  const activeOrderBarVisible = Boolean(
    activeOrder &&
      activeOrder.orderId !== barDismissedId &&
      cart.lines.length === 0 &&
      !pendingOrder,
  );

  const value = useMemo(
    () => ({
      cart,
      ui,
      pendingOrder,
      activeOrder,
      activeOrderBarVisible,
      openProduct,
      quickAdd,
      confirmAdd,
      confirmSwitch,
      cancelSwitch,
      closeUi,
      openDrawer,
      openCheckout,
      openPendingCheckout,
      scheduleOrderCancel,
      refreshPendingOrder,
      refreshActiveOrder,
      dismissActiveOrderBar,
      setPendingOrder,
      setQty,
      clear,
    }),
    [
      cart,
      ui,
      pendingOrder,
      activeOrder,
      activeOrderBarVisible,
      openProduct,
      quickAdd,
      confirmAdd,
      confirmSwitch,
      cancelSwitch,
      closeUi,
      openDrawer,
      openCheckout,
      openPendingCheckout,
      scheduleOrderCancel,
      refreshPendingOrder,
      refreshActiveOrder,
      dismissActiveOrderBar,
      setQty,
      clear,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart outside CartProvider");
  return ctx;
}
