"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { flashToastUndo } from "@/components/FlashToast";
import { cn } from "@/lib/utils";
import type { MenuCategoryView } from "@/lib/business/menuTypes";
import {
  createMenuCategoryAction,
  deleteMenuCategoryAction,
  reorderMenuCategoriesAction,
} from "@/lib/business/menuActions";
import { formatMenuError } from "@/lib/business/menuErrors";
import {
  FREE_PLAN_MAX_CATEGORIES,
  isFreePlan,
} from "@/lib/business/planLimits";

const CATEGORY_EXAMPLES = ["Hamburguesas", "Papas fritas", "Bebidas", "Postres", "Promos"];

type Props = {
  open: boolean;
  onClose: () => void;
  businessId: string;
  plan: string;
  categories: MenuCategoryView[];
  onChange: () => void;
};

export function MenuCategoriesPanel({
  open,
  onClose,
  businessId,
  plan,
  categories,
  onChange,
}: Props) {
  const [items, setItems] = useState(categories);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const atCategoryLimit = isFreePlan(plan) && items.length >= FREE_PLAN_MAX_CATEGORIES;

  useEffect(() => {
    if (open) {
      const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
      setItems(sorted);
      setError(null);
      setDeletingId(null);
    }
  }, [open, categories]);

  // Sync reordering to backend on drag finish
  const handleReorder = (newItems: MenuCategoryView[]) => {
    setItems(newItems);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await reorderMenuCategoriesAction(businessId, newItems.map((c) => c.id));
        onChange();
      } catch (e) {
        setError(formatMenuError(e));
      }
    }, 400);
  };

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed || atCategoryLimit || pending) return;
    setError(null);
    setPending(true);
    try {
      await createMenuCategoryAction(businessId, trimmed);
      setNewName("");
      onChange();
    } catch (e) {
      setError(formatMenuError(e));
    } finally {
      setPending(false);
    }
  }

  async function handleDeleteConfirmed(cat: MenuCategoryView) {
    const prevItems = [...items];
    const catName = cat.name;
    const catId = cat.id;

    // Optimistic UI update
    setItems((cur) => cur.filter((c) => c.id !== catId));
    setDeletingId(null);

    try {
      await deleteMenuCategoryAction(businessId, catId);
      onChange();

      // Offer Undo toast for 5 seconds
      flashToastUndo({
        message: `Categoría "${catName}" eliminada`,
        onUndo: async () => {
          try {
            await createMenuCategoryAction(businessId, catName);
            onChange();
          } catch {
            setItems(prevItems);
          }
        },
      });
    } catch (e) {
      setError(formatMenuError(e));
      setItems(prevItems);
    }
  }

  if (typeof document === "undefined") return null;

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] bg-black/55 backdrop-blur-[2px]"
            onClick={() => {
              setDeletingId(null);
              onClose();
            }}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-full sm:max-w-[420px] flex-col border-l border-[#e8e0d6] bg-[#faf6f1] shadow-2xl dark:border-[#3d3732] dark:bg-[#161412]"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#e8e0d6] px-5 py-4 dark:border-[#3d3732]">
              <div>
                <h2 className="text-[17px] font-bold text-stone-900 dark:text-stone-100">
                  Categorías
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">Orden de tu menú público</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeletingId(null);
                  onClose();
                }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-stone-200/60 dark:hover:bg-[#2a2623] transition-colors"
              >
                <MaterialSymbol icon="close" size={20} />
              </button>
            </div>

            {/* List & Reorder Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
                {items.length > 0 ? (
                  <Reorder.Group
                    axis="y"
                    values={items}
                    onReorder={handleReorder}
                    className="space-y-2"
                  >
                    {items.map((c, idx) => {
                      const isDeleting = deletingId === c.id;

                      return (
                        <Reorder.Item
                          key={c.id}
                          value={c}
                          whileDrag={{
                            scale: 1.01,
                            boxShadow: "0 8px 20px -4px rgba(0, 0, 0, 0.12)",
                            zIndex: 50,
                          }}
                          transition={{ duration: 0.12 }}
                          className={cn(
                            "group relative flex items-center justify-between gap-2.5 rounded-2xl border px-3 py-2.5 transition-all select-none",
                            isDeleting
                              ? "border-red-600 bg-red-600 text-white shadow-md"
                              : "border-stone-200 bg-white hover:border-[#9a0002]/35 dark:border-[#3d3732] dark:bg-[#1c1917] shadow-2xs"
                          )}
                        >
                          {isDeleting ? (
                            /* Confirm Delete View (paints entire card in solid red matching mobile sidebar) */
                            <div className="flex items-center justify-between w-full animate-fade-in">
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/20 text-[11px] font-bold text-white">
                                  {idx + 1}
                                </span>
                                <p className="truncate text-[13px] font-bold text-white">
                                  ¿Eliminar &quot;{c.name}&quot;?
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingId(null);
                                  }}
                                  aria-label="Cancelar"
                                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                                >
                                  <MaterialSymbol icon="close" size={17} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDeleteConfirmed(c);
                                  }}
                                  aria-label="Confirmar eliminar categoría"
                                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-red-600 hover:bg-red-50 transition-colors shadow-xs"
                                >
                                  <MaterialSymbol icon="check" size={17} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Standard Category Row with Drag Accent Dots, Hierarchy Number, and Trash */
                            <>
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {/* Accent Colored Drag Handle */}
                                <span
                                  className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-lg text-[#9a0002] dark:text-red-400 group-hover:scale-110 active:cursor-grabbing transition-transform"
                                  title="Arrastrar para reordenar"
                                >
                                  <MaterialSymbol icon="drag_indicator" size={19} />
                                </span>

                                {/* Numeric Hierarchy Badge (1, 2, 3...) */}
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#9a0002]/10 text-[#9a0002] dark:bg-[#9a0002]/20 dark:text-red-300 font-bold text-[11px]">
                                  {idx + 1}
                                </span>

                                <span className="truncate text-[13px] font-semibold text-stone-800 dark:text-stone-100">
                                  {c.name}
                                </span>
                              </div>

                              {/* Trash Button */}
                              <button
                                type="button"
                                aria-label={`Eliminar categoría ${c.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(c.id);
                                }}
                                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                              >
                                <MaterialSymbol icon="delete" size={17} />
                              </button>
                            </>
                          )}
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                ) : (
                  <p className="rounded-2xl border border-dashed border-stone-200 py-8 text-center text-[12px] text-stone-500 dark:border-[#3d3732] bg-white/50 dark:bg-[#1c1917]/50">
                    Todavía no hay categorías. Agregá la primera abajo.
                  </p>
                )}

                {error && (
                  <p className="rounded-xl bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-700 dark:text-red-300">
                    {error}
                  </p>
                )}

                {atCategoryLimit && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    Límite del plan: {FREE_PLAN_MAX_CATEGORIES} categorías.
                  </p>
                )}
              </div>

              {/* Bottom Input to Add Category */}
              <div className="shrink-0 border-t border-[#e8e0d6] px-5 py-4 space-y-2 dark:border-[#3d3732] bg-white/60 dark:bg-[#1c1917]/60 backdrop-blur-xs">
                <div className="flex gap-2">
                  <input
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Ej. Hamburguesas"
                    className="flex-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-[13px] font-medium placeholder:text-stone-400 dark:border-[#3d3732] dark:bg-[#1c1917] dark:text-stone-100 focus:outline-none focus:border-[#9a0002]/50"
                    disabled={atCategoryLimit || pending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleCreate();
                    }}
                  />
                  <button
                    type="button"
                    disabled={atCategoryLimit || !newName.trim() || pending}
                    onClick={() => void handleCreate()}
                    className="shrink-0 rounded-xl bg-[#9a0002] px-4 py-2.5 text-[12px] font-bold text-white disabled:opacity-50 hover:bg-[#800002] cursor-pointer transition-colors shadow-xs"
                  >
                    {pending ? "…" : "Agregar"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      disabled={atCategoryLimit || pending}
                      onClick={() => setNewName(ex)}
                      className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-600 hover:border-[#9a0002]/30 hover:text-[#9a0002] cursor-pointer disabled:opacity-50 dark:border-[#3d3732] dark:bg-[#1c1917] dark:text-stone-300 transition-colors shadow-2xs"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
