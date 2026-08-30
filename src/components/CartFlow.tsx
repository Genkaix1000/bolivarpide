"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useCart } from "@/components/CartProvider";
import {
  FEATURED_CHAINS,
  suggestionsForChain,
  type TrendingItem,
} from "@/lib/mockData";
import {
  cartItemCount,
  cartSubtotal,
  type SelectedOptions,
  unitPrice,
} from "@/lib/cart";
import { CheckoutSheet } from "@/components/checkout/CheckoutSheet";
import { cn } from "@/lib/utils";

function money(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.button
      type="button"
      aria-label="Cerrar"
      className="fixed inset-0 z-[60] bg-black/45 cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    />
  );
}

function ProductSheet({ item, onClose }: { item: TrendingItem; onClose: () => void }) {
  const { confirmAdd } = useCart();
  const [customNote, setCustomNote] = useState("");
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [selected, setSelected] = useState<SelectedOptions>({});
  const chain = FEATURED_CHAINS.find((c) => c.id === item.chainId);

  const autoNote = useMemo(() => {
    const parts: string[] = [];
    if (removedIngredients.length > 0) {
      parts.push(removedIngredients.map((i) => `Sin ${i.toLowerCase()}`).join(", "));
    }
    if (customNote.trim()) {
      parts.push(customNote.trim());
    }
    return parts.join(". ");
  }, [removedIngredients, customNote]);

  const toggleIngredient = (ing: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const missing = useMemo(() => {
    if (!item.options) return false;
    return item.options.some((o) => o.required && !selected[o.id]);
  }, [item.options, selected]);

  return (
    <>
      <Backdrop onClose={onClose} />
      <motion.div
        role="dialog"
        aria-modal
        aria-label={item.name}
        className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-lg rounded-t-3xl bg-white dark:bg-[#1c1917] shadow-2xl max-h-[92vh] flex flex-col"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
      >
        <div className="relative h-44 shrink-0 overflow-hidden rounded-t-3xl bg-[#f5f1eb] dark:bg-[#231f1c]">
          {item.image ? (
            <img src={item.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">{item.emoji}</div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white cursor-pointer hover:bg-black/60 transition-colors"
            aria-label="Cerrar"
          >
            <MaterialSymbol icon="close" size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-4 pt-4 space-y-4">
          <div>
            <p className="text-[12px] font-medium text-gray-400">{chain?.name ?? item.storeName}</p>
            <h2 className="mt-0.5 text-xl font-bold text-gray-900 dark:text-gray-100">{item.name}</h2>
            {item.description && (
              <p className="mt-1.5 text-[13px] leading-snug text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            )}
          </div>

          {/* Option Groups (Punto de cocción, tipo de pan, etc.) */}
          {item.options?.map((opt) => (
            <div key={opt.id} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{opt.name}</p>
                <span className="text-[11px] text-gray-400">{opt.required ? "Obligatorio" : "Opcional"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {opt.choices.map((c) => {
                  const active = selected[opt.id] === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSelected((s) => {
                          if (!opt.required && s[opt.id] === c.id) {
                            const next = { ...s };
                            delete next[opt.id];
                            return next;
                          }
                          return { ...s, [opt.id]: c.id };
                        })
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[12px] font-semibold cursor-pointer transition-all",
                        active
                          ? "border-[#9a0002] bg-[#9a0002]/10 text-[#9a0002] ring-1 ring-[#9a0002]"
                          : "border-black/10 dark:border-[#3d3732] text-gray-700 dark:text-gray-300 hover:border-black/20"
                      )}
                    >
                      {c.label}
                      {c.priceDelta ? ` (+${money(c.priceDelta)})` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Ingredients Modifier */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="space-y-2 rounded-2xl bg-[#faf6f1] p-3.5 dark:bg-[#231f1c] border border-[#e8e0d6] dark:border-[#3d3732]">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <MaterialSymbol icon="restaurant" size={15} className="text-orange-500" />
                  Ingredientes incluidos
                </span>
                <span className="text-[10px] font-medium text-stone-400">
                  Tocá para quitar
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {item.ingredients.map((ing) => {
                  const isRemoved = removedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => toggleIngredient(ing)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs",
                        isRemoved
                          ? "bg-red-100 text-red-700 line-through border border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/50 opacity-80"
                          : "bg-white text-gray-800 border border-stone-200 hover:border-[#9a0002]/40 dark:bg-[#1c1917] dark:text-gray-200 dark:border-[#3d3732]"
                      )}
                    >
                      {isRemoved ? "✕ Sin " : "✓ "}
                      {ing}
                    </button>
                  );
                })}
              </div>

              {removedIngredients.length > 0 && (
                <p className="text-[11px] font-semibold text-[#9a0002] dark:text-red-400 pt-0.5">
                  Nota añadida: &ldquo;{removedIngredients.map((i) => `Sin ${i.toLowerCase()}`).join(", ")}&rdquo;
                </p>
              )}
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
              Aclaraciones del pedido
            </span>
            <input
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ej: bien caliente, aderezo aparte..."
              className="w-full rounded-xl border border-black/10 dark:border-[#3d3732] bg-transparent px-3 py-2.5 text-[13px] outline-none focus:border-[#9a0002]/50 placeholder:text-stone-400"
            />
          </label>
        </div>

        <div className="border-t border-black/[0.06] dark:border-[#2a2623] px-5 py-4">
          <button
            type="button"
            disabled={missing}
            onClick={() => confirmAdd(item, 1, selected, autoNote.trim() || undefined)}
            className="w-full rounded-full bg-[#9a0002] py-3 text-[14px] font-semibold text-white disabled:opacity-40 cursor-pointer active:scale-[0.99] transition-all shadow-md shadow-[#9a0002]/20 hover:bg-[#800002]"
          >
            Agregar al pedido · {money(unitPrice(item, selected))}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function UpsellSheet({ item, onClose }: { item: TrendingItem; onClose: () => void }) {
  const { cart, openProduct, quickAdd, openDrawer } = useCart();
  const chain = FEATURED_CHAINS.find((c) => c.id === item.chainId);
  const suggestions = suggestionsForChain(item.chainId, item.id, 4);
  const sub = cartSubtotal(cart.lines);
  const fee = chain?.deliveryFee ?? 0;

  const goToPay = () => {
    onClose();
    openDrawer();
  };

  return (
    <>
      <Backdrop onClose={onClose} />
      <motion.div
        role="dialog"
        aria-modal
        aria-label="¿Querés algo más?"
        className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-lg rounded-t-3xl bg-white dark:bg-[#1c1917] shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
      >
        <div className="px-5 pt-5 pb-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[#9a0002]">Agregado al carrito</p>
              <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                ¿Querés algo más de {chain?.name ?? item.storeName}?
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 cursor-pointer"
              aria-label="Cerrar"
            >
              <MaterialSymbol icon="close" size={16} />
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openProduct(s)}
                  className="w-[132px] shrink-0 rounded-2xl border border-black/[0.06] dark:border-[#3d3732] overflow-hidden text-left cursor-pointer hover:border-[#9a0002]/30 transition"
                >
                  <div className="h-20 bg-[#f5f1eb] dark:bg-[#231f1c]">
                    {s.image ? (
                      <img src={s.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">{s.emoji}</div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-[12px] font-semibold text-gray-900 dark:text-gray-100">
                      {s.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#9a0002]">{money(s.price)}</span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          quickAdd(s);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            quickAdd(s);
                          }
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9a0002] text-[12px] font-bold text-white"
                      >
                        +
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {chain && (
              <Link
                href={`/c/${chain.id}`}
                onClick={onClose}
                className="flex-1 rounded-full border border-black/10 py-3 text-center text-[13px] font-semibold text-gray-800 dark:border-[#3d3732] dark:text-gray-200"
              >
                Ver menú
              </Link>
            )}
            <button
              type="button"
              onClick={goToPay}
              className="flex-1 rounded-full bg-[#9a0002] py-3 text-[13px] font-semibold text-white cursor-pointer active:scale-[0.99] transition"
            >
              Ir a pagar · {money(sub + fee)}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function SwitchDialog({
  item,
  onConfirm,
  onCancel,
}: {
  item: TrendingItem;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { cart } = useCart();
  const current = FEATURED_CHAINS.find((c) => c.id === cart.chainId);
  const next = FEATURED_CHAINS.find((c) => c.id === item.chainId);

  return (
    <>
      <Backdrop onClose={onCancel} />
      <motion.div
        role="alertdialog"
        aria-modal
        className="fixed left-1/2 top-1/2 z-[70] w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-[#1c1917] p-5 shadow-2xl"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
      >
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">¿Cambiar de local?</h2>
        <p className="mt-2 text-[13px] leading-snug text-gray-500 dark:text-gray-400">
          Tu carrito es de <span className="font-semibold text-gray-800 dark:text-gray-200">{current?.name}</span>.
          Si seguís con <span className="font-semibold text-gray-800 dark:text-gray-200">{next?.name}</span>, se
          vacía el carrito actual.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-black/10 dark:border-[#3d3732] py-2.5 text-[13px] font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-[#9a0002] py-2.5 text-[13px] font-semibold text-white cursor-pointer"
          >
            Vaciar y continuar
          </button>
        </div>
      </motion.div>
    </>
  );
}

function CartDrawer({ onClose }: { onClose: () => void }) {
  const { cart, setQty, clear, openCheckout } = useCart();
  const chain = FEATURED_CHAINS.find((c) => c.id === cart.chainId);
  const sub = cartSubtotal(cart.lines);
  const fee = chain?.deliveryFee ?? 0;

  return (
    <>
      <Backdrop onClose={onClose} />
      <motion.div
        role="dialog"
        aria-modal
        aria-label="Carrito"
        className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-lg rounded-t-3xl bg-white dark:bg-[#1c1917] shadow-2xl max-h-[88vh] flex flex-col"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {chain && (
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#f5f1eb] dark:bg-[#231f1c]">
                {chain.logoImage ? (
                  <img src={chain.logoImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm">{chain.logoEmoji}</div>
                )}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Tu carrito</h2>
              {chain && <p className="truncate text-[12px] text-gray-400">{chain.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cart.lines.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="text-[12px] font-medium text-gray-400 hover:text-[#9a0002] cursor-pointer"
              >
                Vaciar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 cursor-pointer"
              aria-label="Cerrar"
            >
              <MaterialSymbol icon="close" size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-3">
          {cart.lines.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-gray-400">El carrito está vacío</p>
          ) : (
            cart.lines.map((l) => (
              <div key={l.key} className="flex gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f5f1eb] dark:bg-[#231f1c]">
                  {l.image ? (
                    <img src={l.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl">{l.emoji}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">{l.name}</p>
                  {l.optionLabels && (
                    <p className="truncate text-[11px] text-gray-400">{l.optionLabels.join(" · ")}</p>
                  )}
                  {l.note && <p className="truncate text-[11px] text-gray-400">Nota: {l.note}</p>}
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#9a0002]">{money(l.unitPrice * l.qty)}</span>
                    <div className="flex items-center gap-1.5 rounded-full border border-black/10 dark:border-[#3d3732] px-1.5">
                      <button
                        type="button"
                        className="h-7 w-7 cursor-pointer"
                        onClick={() => setQty(l.key, l.qty - 1)}
                        aria-label="Menos"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-[12px] font-semibold">{l.qty}</span>
                      <button
                        type="button"
                        className="h-7 w-7 cursor-pointer"
                        onClick={() => setQty(l.key, l.qty + 1)}
                        aria-label="Más"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.lines.length > 0 && chain && (
          <div className="border-t border-black/[0.06] dark:border-[#2a2623] px-5 py-4 space-y-2">
            <div className="flex justify-between text-[13px] text-gray-500">
              <span>Subtotal</span>
              <span>{money(sub)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-gray-500">
              <span>Envío</span>
              <span>{money(fee)}</span>
            </div>
            <div className="flex justify-between text-[14px] font-bold text-gray-900 dark:text-gray-100">
              <span>Total</span>
              <span>{money(sub + fee)}</span>
            </div>
            <button
              type="button"
              className="mt-1 w-full rounded-full bg-[#9a0002] py-3 text-[14px] font-semibold text-white cursor-pointer"
              onClick={() => {
                onClose();
                openCheckout();
              }}
            >
              Ir a pagar
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

function FloatingCartBar() {
  const { cart, openDrawer, ui } = useCart();
  const count = cartItemCount(cart.lines);
  const sub = cartSubtotal(cart.lines);
  const chain = FEATURED_CHAINS.find((c) => c.id === cart.chainId);
  if (count === 0 || ui.kind === "drawer" || ui.kind === "product" || ui.kind === "upsell") return null;

  return (
    <motion.button
      type="button"
      onClick={openDrawer}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-5 left-1/2 z-50 flex w-[min(92vw,420px)] -translate-x-1/2 items-center justify-between rounded-full bg-[#1a1210] px-5 py-3.5 text-white shadow-xl cursor-pointer"
    >
      <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold">
        {chain && (
          <span className="relative h-7 w-7 shrink-0">
            {chain.logoImage ? (
              <img
                src={chain.logoImage}
                alt=""
                className="h-7 w-7 rounded-full object-cover ring-1 ring-white/25"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm">
                {chain.logoEmoji}
              </span>
            )}
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9a0002] px-1 text-[10px] font-bold">
              {count}
            </span>
          </span>
        )}
        {!chain && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#9a0002] px-1.5 text-[12px]">
            {count}
          </span>
        )}
        Ver carrito
        {chain && <span className="truncate font-normal text-white/50">· {chain.name}</span>}
      </span>
      <span className="text-[13px] font-bold">{money(sub)}</span>
    </motion.button>
  );
}

/** Mount once under CartProvider — sheets + floating bar */
export function CartFlow() {
  const pathname = usePathname();
  const { cart, ui, closeUi, confirmSwitch, cancelSwitch } = useCart();
  const chain = FEATURED_CHAINS.find((c) => c.id === cart.chainId);

  if (pathname?.startsWith("/negocio")) return null;

  return (
    <>
      <AnimatePresence>
        {ui.kind === "product" && (
          <ProductSheet key="product" item={ui.item} onClose={closeUi} />
        )}
        {ui.kind === "upsell" && <UpsellSheet key="upsell" item={ui.item} onClose={closeUi} />}
        {ui.kind === "switch" && (
          <SwitchDialog key="switch" item={ui.item} onConfirm={confirmSwitch} onCancel={cancelSwitch} />
        )}
        {ui.kind === "drawer" && <CartDrawer key="drawer" onClose={closeUi} />}
        {ui.kind === "checkout" && chain && (
          <CheckoutSheet key="checkout" chain={chain} onClose={closeUi} />
        )}
      </AnimatePresence>
      <FloatingCartBar />
    </>
  );
}
