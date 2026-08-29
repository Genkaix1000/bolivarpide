"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { TrendingItem } from "@/lib/mockData";
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
  | { kind: "checkout" };

interface CartContextValue {
  cart: CartState;
  ui: Ui;
  openProduct: (item: TrendingItem) => void;
  /** + / quick-add: opens sheet if required options; else adds (or switch confirm) */
  quickAdd: (item: TrendingItem) => void;
  confirmAdd: (item: TrendingItem, qty: number, selected?: SelectedOptions, note?: string) => void;
  confirmSwitch: () => void;
  cancelSwitch: () => void;
  closeUi: () => void;
  openDrawer: () => void;
  openCheckout: () => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>({ chainId: null, lines: [] });
  const [ui, setUi] = useState<Ui>({ kind: "idle" });
  const [pending, setPending] = useState<{
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
        setPending({ item, selected, note, qty });
        setUi({ kind: "switch", item, selected, note, qty });
        return;
      }
      setCart((c) => addLine(c, item, qty, selected, note));
      setUi({ kind: "upsell", item });
    },
    [cart]
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
    if (!pending) return;
    setCart(addLine(clearCart(), pending.item, pending.qty, pending.selected, pending.note));
    setUi({ kind: "upsell", item: pending.item });
    setPending(null);
  }, [pending]);

  const cancelSwitch = useCallback(() => {
    setPending(null);
    setUi({ kind: "idle" });
  }, []);

  const closeUi = useCallback(() => setUi({ kind: "idle" }), []);
  const openDrawer = useCallback(() => setUi({ kind: "drawer" }), []);
  const openCheckout = useCallback(() => setUi({ kind: "checkout" }), []);
  const setQty = useCallback((key: string, qty: number) => {
    setCart((c) => setLineQty(c, key, qty));
  }, []);
  const clear = useCallback(() => {
    setCart(clearCart());
    setUi({ kind: "idle" });
  }, []);

  const value = useMemo(
    () => ({
      cart,
      ui,
      openProduct,
      quickAdd,
      confirmAdd,
      confirmSwitch,
      cancelSwitch,
      closeUi,
      openDrawer,
      openCheckout,
      setQty,
      clear,
    }),
    [
      cart,
      ui,
      openProduct,
      quickAdd,
      confirmAdd,
      confirmSwitch,
      cancelSwitch,
      closeUi,
      openDrawer,
      openCheckout,
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
