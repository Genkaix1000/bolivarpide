"use client";

import { useMemo, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type BuilderProduct = {
  id: string;
  name: string;
  price_cents: number;
  description?: string | null;
};

type BuilderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
};

interface ComandaBuilderProps {
  products: BuilderProduct[];
  businessName: string;
  onClose: () => void;
  onConfirm: (items: BuilderItem[]) => void;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

export function ComandaBuilder({ products, businessName, onClose, onConfirm }: ComandaBuilderProps) {
  const [cart, setCart] = useState<Map<string, BuilderItem>>(new Map());

  const available = useMemo(() => products.filter((p) => p.price_cents > 0), [products]);

  function add(product: BuilderProduct) {
    setCart((prev) => {
      const next = new Map(prev);
      const cur = next.get(product.id);
      next.set(product.id, {
        productId: product.id,
        name: product.name,
        quantity: (cur?.quantity ?? 0) + 1,
        unitPriceCents: product.price_cents,
      });
      return next;
    });
  }

  function bump(productId: string, delta: number) {
    setCart((prev) => {
      const next = new Map(prev);
      const cur = next.get(productId);
      if (!cur) return prev;
      const q = cur.quantity + delta;
      if (q <= 0) next.delete(productId);
      else next.set(productId, { ...cur, quantity: q });
      return next;
    });
  }

  const items = [...cart.values()];
  const total = items.reduce((acc, i) => acc + i.quantity * i.unitPriceCents, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#fdfcfb] shadow-2xl dark:bg-[#181513]">
        <header className="flex shrink-0 items-center justify-between border-b border-[#e8e0d6] px-4 py-3 dark:border-[#2a2623]">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Nueva comanda</p>
            <p className="text-[11px] text-gray-500">
              Carta de {businessName} · cargá los ítems que pidió el cliente
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-black/5"
            aria-label="Cerrar"
          >
            <MaterialSymbol icon="close" size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {available.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              No hay productos cargados en la carta todavía.
            </div>
          ) : (
            <div className="space-y-2">
              {available.map((p) => {
                const inCart = cart.get(p.id);
                const count = inCart?.quantity ?? 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-[#eee7de] px-3 py-2 dark:border-[#2a2623]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-gray-500">{formatCents(p.price_cents)}</p>
                    </div>
                    {count > 0 ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => bump(p.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f0ebe3] text-gray-700 hover:bg-[#e4dcd1] dark:bg-[#231f1c] dark:text-gray-300"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-[13px] font-bold">{count}</span>
                        <button
                          type="button"
                          onClick={() => bump(p.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9a0002] text-white hover:bg-[#7e0002]"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => add(p)}
                        className="rounded-full bg-[#9a0002] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#7e0002]"
                      >
                        Agregar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#e8e0d6] bg-white px-4 py-3 dark:border-[#2a2623] dark:bg-[#161413]">
          <div className="text-sm">
            <p className="font-bold text-gray-900 dark:text-gray-100">
              {formatCents(total)}
            </p>
            <p className="text-[11px] text-gray-500">
              {items.reduce((a, i) => a + i.quantity, 0)} ítems
            </p>
          </div>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => onConfirm(items)}
            className={cn(
              "rounded-full px-5 py-2.5 text-[13px] font-bold",
              items.length > 0
                ? "bg-[#9a0002] text-white hover:bg-[#7e0002]"
                : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-stone-800",
            )}
          >
            Crear comanda
          </button>
        </footer>
      </div>
    </div>
  );
}