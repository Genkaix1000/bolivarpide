"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useCart } from "@/components/CartProvider";
import { FEATURED_CHAINS, type TrendingItem } from "@/lib/mockData";
import {
  requiredOptionsMissing,
  type SelectedOptions,
  unitPrice,
} from "@/lib/cart";
import { ProductImageToggle } from "@/components/menu/ProductImageToggle";
import { MobileStoreCoverHeader } from "@/components/store/MobileStoreCoverHeader";
import { MENU_IMAGE_FRAME_CLASS } from "@/lib/images/menuImageSpec";
import { cn } from "@/lib/utils";

function money(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function resolveStoreContext(item: TrendingItem) {
  const chain = FEATURED_CHAINS.find((c) => c.id === item.chainId);
  return {
    slug: item.chainId,
    name: item.storeName || chain?.name || "Local",
    logoUrl: item.storeLogoUrl ?? chain?.logoImage,
    bannerUrl: item.storeBannerUrl ?? chain?.bannerImage,
    bannerBg: chain?.bannerBg ?? "from-[#9a0002] to-[#6b0001]",
    logoEmoji: chain?.logoEmoji ?? item.storeName?.slice(0, 1) ?? "?",
    rating: item.storeReviewsCount != null ? item.storeRating ?? 0 : chain?.rating ?? 0,
    reviewsCount: item.storeReviewsCount ?? chain?.reviewsCount ?? 0,
    isOpen: item.storeIsOpen ?? chain?.isOpen ?? true,
  };
}

type Props = {
  item: TrendingItem;
  onClose: () => void;
};

export function ProductSheet({ item, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { confirmAdd } = useCart();
  const [customNote, setCustomNote] = useState("");
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [selected, setSelected] = useState<SelectedOptions>({});

  const store = useMemo(() => resolveStoreContext(item), [item]);

  const onStoreMenuPage = useMemo(() => {
    const slug = pathname?.match(/^\/c\/([^/?#]+)/)?.[1];
    return slug != null && slug === store.slug;
  }, [pathname, store.slug]);

  const autoNote = useMemo(() => {
    const parts: string[] = [];
    if (removedIngredients.length > 0) {
      parts.push(removedIngredients.map((i) => `Sin ${i.toLowerCase()}`).join(", "));
    }
    if (customNote.trim()) parts.push(customNote.trim());
    return parts.join(". ");
  }, [removedIngredients, customNote]);

  const missing = useMemo(
    () => requiredOptionsMissing(item, selected),
    [item, selected],
  );

  const toggleIngredient = (ing: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing],
    );
  };

  function goToMenu() {
    onClose();
    router.push(`/c/${store.slug}`);
  }

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label={item.name}
      className="fixed inset-0 z-[70] mx-auto flex w-full max-w-lg flex-col bg-white dark:bg-[#1c1917] max-h-dvh overflow-x-hidden shadow-2xl"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar w-full max-w-full">
        {onStoreMenuPage ? (
          <div
            className="sticky top-0 z-20 flex items-center px-3 pb-2 bg-white dark:bg-[#1c1917]"
            style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/5 text-gray-700 dark:bg-white/10 dark:text-gray-200 hover:bg-black/10 transition-colors"
              aria-label="Cerrar"
            >
              <MaterialSymbol icon="close" size={22} />
            </button>
          </div>
        ) : (
          <MobileStoreCoverHeader
            name={store.name}
            logoUrl={store.logoUrl}
            logoEmoji={store.logoEmoji}
            bannerUrl={store.bannerUrl}
            bannerBg={store.bannerBg}
            rating={store.rating}
            reviewsCount={store.reviewsCount}
            isOpen={store.isOpen}
            onBack={onClose}
            backIcon="close"
          />
        )}

        {/* Hero del producto */}
        <div className={cn("relative mx-4 mb-4 overflow-hidden rounded-2xl max-w-[calc(100%-2rem)]", MENU_IMAGE_FRAME_CLASS, onStoreMenuPage && "mt-1")}>
          <ProductImageToggle
            variant="expanded"
            iconUrl={item.iconImage}
            photoUrl={item.photoImage}
            className="h-full w-full max-w-full"
            defaultMode="icon"
          />
        </div>

        <div className="space-y-4 px-5 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{item.name}</h2>
            <p className="mt-1 text-[16px] font-bold text-[#9a0002]">{money(item.price)}</p>
            {item.description && (
              <p className="mt-2 text-[13px] leading-snug text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            )}
          </div>

          {item.options?.map((opt) => (
            <div key={opt.id} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
                  {opt.name}
                </p>
                <span className="text-[11px] text-gray-400">
                  {opt.multi ? "Opcional · varios" : opt.required ? "Obligatorio" : "Opcional"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {opt.choices.map((c) => {
                  const rawSel = selected[opt.id];
                  const active = opt.multi
                    ? Array.isArray(rawSel) && rawSel.includes(c.id)
                    : rawSel === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSelected((s) => {
                          if (opt.multi) {
                            const raw = s[opt.id];
                            const prev = Array.isArray(raw) ? raw : [];
                            const has = prev.includes(c.id);
                            const next = has ? prev.filter((id) => id !== c.id) : [...prev, c.id];
                            const out = { ...s };
                            if (next.length) out[opt.id] = next;
                            else delete out[opt.id];
                            return out;
                          }
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
                          : "border-black/10 dark:border-[#3d3732] text-gray-700 dark:text-gray-300 hover:border-black/20",
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

          {item.ingredients && item.ingredients.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-[#e8e0d6] bg-[#faf6f1] p-3.5 dark:border-[#3d3732] dark:bg-[#231f1c]">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-gray-800 dark:text-gray-200">
                  Ingredientes incluidos
                </span>
                <span className="text-[10px] font-medium text-stone-400">Tocá para quitar</span>
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
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold cursor-pointer shadow-2xs",
                        isRemoved
                          ? "bg-red-100 text-red-700 line-through border border-red-300 dark:bg-red-950/50 dark:text-red-300"
                          : "bg-white text-gray-800 border border-stone-200 dark:bg-[#1c1917] dark:text-gray-200 dark:border-[#3d3732]",
                      )}
                    >
                      {isRemoved ? "✕ Sin " : "✓ "}
                      {ing}
                    </button>
                  );
                })}
              </div>
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
      </div>

      <div className="shrink-0 border-t border-black/[0.06] bg-white px-4 py-3 dark:border-[#2a2623] dark:bg-[#1c1917]">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onStoreMenuPage ? onClose : goToMenu}
            className="flex-1 rounded-full border border-black/10 py-3 text-[13px] font-semibold text-gray-800 cursor-pointer hover:border-[#9a0002]/30 dark:border-[#3d3732] dark:text-gray-200"
          >
            {onStoreMenuPage ? "Cerrar" : "Ver menú"}
          </button>
          <button
            type="button"
            disabled={missing}
            onClick={() => confirmAdd(item, 1, selected, autoNote.trim() || undefined)}
            className="flex-[1.2] rounded-full bg-[#9a0002] py-3 text-[13px] font-semibold text-white disabled:opacity-40 cursor-pointer active:scale-[0.99] shadow-md shadow-[#9a0002]/20 hover:bg-[#800002]"
          >
            Agregar · {money(unitPrice(item, selected))}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
