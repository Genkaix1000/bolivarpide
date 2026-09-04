"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { ProductImageToggle } from "@/components/menu/ProductImageToggle";
import { ProductImagePlaceholder } from "@/components/menu/ProductImagePlaceholder";
import { MENU_IMAGE_FRAME_CLASS, MENU_PREVIEW_MAX_CLASS } from "@/lib/images/menuImageSpec";
import { cn } from "@/lib/utils";
import { flashToastUndo } from "@/components/FlashToast";
import { ConfirmActionRail } from "@/components/shared/ConfirmActionRail";
import { ProductSlidePanel } from "@/components/business/menu/ProductSlidePanel";
import { MenuCategoriesPanel } from "@/components/business/menu/MenuCategoriesPanel";
import {
  deleteMenuProductAction,
  pauseMenuProductAction,
} from "@/lib/business/menuActions";
import {
  FREE_PLAN_MAX_PRODUCTS,
  freePlanLimitsLabel,
  isFreePlan,
} from "@/lib/business/planLimits";
import type { MenuCategoryView, MenuProductView } from "@/lib/business/menuTypes";

const DELETE_DELAY_MS = 5000;

type Props = {
  businessId: string;
  businessName?: string;
  plan: string;
  categories: MenuCategoryView[];
  products: MenuProductView[];
};

type ViewMode = "list" | "grid";

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

function CategoryStickyNav({
  categories,
  products,
}: {
  categories: MenuCategoryView[];
  products: MenuProductView[];
}) {
  const visible = categories.filter((c) => products.some((p) => p.category_id === c.id));
  if (visible.length <= 1) return null;

  return (
    <div
      className="sticky top-0 z-20 -mx-5 mb-4 border-b border-[#e8e0d6]/80 bg-[#f3efe8]/95 px-5 py-2.5 backdrop-blur-md dark:border-[#3d3732] dark:bg-[#141210]/95"
    >
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {visible.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              const el = document.getElementById(`menu-cat-${c.id}`);
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="shrink-0 rounded-full border border-[#e8e0d6] bg-white px-3.5 py-1.5 text-[12px] font-bold text-gray-700 hover:border-[#9a0002]/40 hover:text-[#9a0002] dark:border-[#3d3732] dark:bg-[#1c1917] dark:text-gray-200 cursor-pointer"
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
  onPause,
  onDeleteConfirmed,
}: {
  product: MenuProductView;
  onEdit: () => void;
  onPause: () => void;
  onDeleteConfirmed: () => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const paused = !product.available;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors",
        deleteConfirm
          ? "bg-red-600 text-white"
          : "bg-white hover:bg-[#faf6f1] dark:bg-[#1c1917] dark:hover:bg-[#231f1c]",
        paused && !deleteConfirm && "opacity-70",
      )}
    >
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f0ebe4] dark:bg-[#231f1c]">
          {product.iconUrl ? (
            <ProductImageToggle
              iconUrl={product.iconUrl}
              photoUrl={product.photoUrl}
              className={cn("h-full w-full object-cover", paused && "grayscale")}
            />
          ) : (
            <ProductImagePlaceholder className={cn("h-full w-full", paused && "grayscale")} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "truncate text-[13px] font-semibold",
                deleteConfirm ? "text-white" : "text-stone-900 dark:text-stone-100",
              )}
            >
              {product.name}
            </p>
            {paused && !deleteConfirm ? (
              <span className="shrink-0 rounded-full bg-stone-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                Pausado
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              "mt-0.5 truncate text-[11px]",
              deleteConfirm ? "text-white/80" : "text-stone-500",
            )}
          >
            {product.categoryName || "Sin categoría"}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 text-[14px] font-bold tabular-nums",
            deleteConfirm ? "text-white" : "text-[#9a0002]",
          )}
        >
          {money(product.price_cents)}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          title={paused ? "Reanudar" : "Pausar"}
          onClick={onPause}
          className={cn(
            "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors",
            deleteConfirm
              ? "text-white/90 hover:bg-white/15"
              : "text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100",
          )}
        >
          <MaterialSymbol icon={paused ? "play_arrow" : "pause"} size={18} />
        </button>
        <ConfirmActionRail
          confirm={deleteConfirm}
          onAsk={() => setDeleteConfirm(true)}
          onCancel={() => setDeleteConfirm(false)}
          onConfirm={() => {
            setDeleteConfirm(false);
            onDeleteConfirmed();
          }}
          className={deleteConfirm ? "w-[72px]" : ""}
        />
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onEdit,
  onPause,
  onDeleteConfirmed,
}: {
  product: MenuProductView;
  onEdit: () => void;
  onPause: () => void;
  onDeleteConfirmed: () => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const paused = !product.available;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-300",
        deleteConfirm
          ? "border-red-600 bg-red-600"
          : "border-black/[0.04] bg-white shadow-[0_8px_24px_-16px_rgba(61,43,31,0.2)] dark:border-[#3d3732] dark:bg-[#1c1917]",
        paused && !deleteConfirm && "opacity-80",
      )}
    >
      <button type="button" onClick={onEdit} className="block w-full text-left cursor-pointer">
        <div className={MENU_IMAGE_FRAME_CLASS}>
          {product.iconUrl ? (
            <ProductImageToggle
              iconUrl={product.iconUrl}
              photoUrl={product.photoUrl}
              className={cn(
                "h-full w-full transition-transform duration-500 group-hover:scale-105",
                paused && "grayscale",
              )}
            />
          ) : (
            <ProductImagePlaceholder className={cn("h-full w-full", paused && "grayscale")} />
          )}
          {paused && !deleteConfirm && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              Pausado
            </span>
          )}
        </div>
        <div className="p-3">
          <p
            className={cn(
              "truncate text-[13px] font-semibold transition-colors",
              deleteConfirm
                ? "text-white"
                : "text-gray-900 group-hover:text-[#9a0002] dark:text-gray-100",
            )}
          >
            {product.name}
          </p>
          <p
            className={cn(
              "mt-1 text-[14px] font-bold",
              deleteConfirm ? "text-white/90" : "text-[#9a0002]",
            )}
          >
            {money(product.price_cents)}
          </p>
        </div>
      </button>

      <div className="absolute right-2 top-2 flex items-center gap-1">
        <button
          type="button"
          title={paused ? "Activar" : "Pausar"}
          onClick={onPause}
          className={cn(
            "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-colors",
            deleteConfirm
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-black/35 text-white hover:bg-black/50",
          )}
        >
          <MaterialSymbol icon={paused ? "play_arrow" : "pause"} size={18} />
        </button>
        <div className={cn("rounded-full", deleteConfirm && "bg-white/10")}>
          <ConfirmActionRail
            confirm={deleteConfirm}
            onAsk={() => setDeleteConfirm(true)}
            onCancel={() => setDeleteConfirm(false)}
            onConfirm={() => {
              setDeleteConfirm(false);
              onDeleteConfirmed();
            }}
            className={deleteConfirm ? "w-[72px]" : ""}
          />
        </div>
      </div>
    </div>
  );
}

export function CartaView({
  businessId,
  businessName,
  plan,
  categories,
  products: initialProducts,
}: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [panelOpen, setPanelOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [editing, setEditing] = useState<MenuProductView | null>(null);
  const [mode, setMode] = useState<ViewMode>("grid");
  const pendingDeletes = useRef(new Map<string, number>());

  useEffect(() => {
    queueMicrotask(() => setProducts(initialProducts));
  }, [initialProducts]);

  const atProductLimit = isFreePlan(plan) && products.length >= FREE_PLAN_MAX_PRODUCTS;

  const grouped = useMemo(() => {
    const catOrder = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const sections: { id: string; name: string; items: MenuProductView[] }[] = [];
    for (const c of catOrder) {
      const items = products.filter((p) => p.category_id === c.id);
      if (items.length > 0) sections.push({ id: c.id, name: c.name, items });
    }
    const uncategorized = products.filter(
      (p) => !p.category_id || !categories.some((c) => c.id === p.category_id),
    );
    if (uncategorized.length > 0) sections.push({ id: "other", name: "Otros", items: uncategorized });
    return sections;
  }, [categories, products]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  function openCategories() {
    setPanelOpen(false);
    setCategoriesOpen(true);
  }

  function openNew() {
    setCategoriesOpen(false);
    setEditing(null);
    setPanelOpen(true);
  }

  function openEdit(p: MenuProductView) {
    setCategoriesOpen(false);
    setEditing(p);
    setPanelOpen(true);
  }

  async function handlePause(product: MenuProductView) {
    const next = !product.available;
    setProducts((prev) =>
      prev.map((x) => (x.id === product.id ? { ...x, available: next } : x)),
    );
    await pauseMenuProductAction(businessId, product.id, next);
    refresh();
  }

  function scheduleDelete(product: MenuProductView) {
    setProducts((prev) => prev.filter((p) => p.id !== product.id));

    const timeout = window.setTimeout(async () => {
      pendingDeletes.current.delete(product.id);
      await deleteMenuProductAction(businessId, product.id);
      refresh();
    }, DELETE_DELAY_MS);

    pendingDeletes.current.set(product.id, timeout);

    flashToastUndo({
      message: `${product.name} eliminado`,
      onUndo: () => {
        const t = pendingDeletes.current.get(product.id);
        if (t) clearTimeout(t);
        pendingDeletes.current.delete(product.id);
        setProducts((prev) => {
          if (prev.some((p) => p.id === product.id)) return prev;
          return [...prev, product];
        });
      },
    });
  }

  const menuPreview = (
    <>
      {categories.length === 0 && products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e8e0d6] bg-white/60 p-10 text-center dark:border-[#3d3732] dark:bg-[#1c1917]/60">
          <MaterialSymbol icon="restaurant_menu" size={40} className="mx-auto text-stone-300 dark:text-stone-600" />
          <p className="mt-4 text-[15px] font-bold text-stone-800 dark:text-stone-100">
            Todavía no hay artículos en tu carta
          </p>
          <p className="mt-2 text-[13px] text-stone-500 max-w-sm mx-auto leading-snug">
            Creá categorías (Entradas, Bebidas…) y sumá tu primer producto con foto y precio.
          </p>
          <button
            type="button"
            onClick={openCategories}
            className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#9a0002] px-6 py-3 text-[13px] font-bold text-white hover:bg-[#850002]"
          >
            <MaterialSymbol icon="add" size={18} />
            Empezar mi carta
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e8e0d6] bg-white/60 p-8 text-center dark:border-[#3d3732] dark:bg-[#1c1917]/60">
          <MaterialSymbol icon="category" size={32} className="mx-auto text-stone-400" />
          <p className="mt-3 text-sm font-semibold text-stone-700 dark:text-stone-200">
            Falta organizar categorías
          </p>
          <p className="mt-1 text-[12px] text-stone-500">
            Ej. Entradas, Principales, Bebidas — después agregás productos.
          </p>
          <button
            type="button"
            onClick={openCategories}
            className="mt-4 inline-flex cursor-pointer items-center gap-1 rounded-full bg-[#9a0002] px-5 py-2.5 text-[13px] font-bold text-white"
          >
            Crear categorías
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e8e0d6] bg-white/60 p-10 text-center dark:border-[#3d3732] dark:bg-[#1c1917]/60">
          <MaterialSymbol icon="add_photo_alternate" size={40} className="mx-auto text-stone-300 dark:text-stone-600" />
          <p className="mt-4 text-[15px] font-bold text-stone-800 dark:text-stone-100">
            No hay artículos todavía
          </p>
          <p className="mt-2 text-[13px] text-stone-500">
            Sumá ícono, precio y categoría para que aparezcan en tu menú público.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#9a0002] px-6 py-3 text-[13px] font-bold text-white hover:bg-[#850002]"
          >
            <MaterialSymbol icon="add" size={18} />
            Crear mi primer producto
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((section) => (
            <section
              key={section.id}
              id={section.id === "other" ? undefined : `menu-cat-${section.id}`}
            >
              <h3 className="mb-3 text-[14px] font-bold text-gray-900 dark:text-gray-100">
                {section.name}
              </h3>
              {mode === "list" ? (
                <div className="space-y-1.5">
                  {section.items.map((p) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      onEdit={() => openEdit(p)}
                      onPause={() => void handlePause(p)}
                      onDeleteConfirmed={() => scheduleDelete(p)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {section.items.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onEdit={() => openEdit(p)}
                      onPause={() => void handlePause(p)}
                      onDeleteConfirmed={() => scheduleDelete(p)}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Carta</h1>
          <p className="mt-1 text-sm text-stone-500">
            {products.length} producto{products.length === 1 ? "" : "s"} · {categories.length}{" "}
            categorí{categories.length === 1 ? "a" : "as"}
            {businessName ? ` · ${businessName}` : ""}
          </p>
          <p className="mt-1 text-[12px] font-semibold text-stone-400">
            {freePlanLimitsLabel(products.length, categories.length)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-[#e8e0d6]/70 p-0.5 dark:bg-[#2a2623]">
            <button
              type="button"
              title="Lista"
              aria-label="Formato lista"
              aria-pressed={mode === "list"}
              onClick={() => setMode("list")}
              className={cn(
                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors",
                mode === "list"
                  ? "bg-white text-stone-900 shadow-sm dark:bg-[#1c1917] dark:text-stone-100"
                  : "text-stone-500 hover:text-stone-800 dark:text-stone-400",
              )}
            >
              <MaterialSymbol icon="view_list" size={18} />
            </button>
            <button
              type="button"
              title="Carta"
              aria-label="Formato carta"
              aria-pressed={mode === "grid"}
              onClick={() => setMode("grid")}
              className={cn(
                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors",
                mode === "grid"
                  ? "bg-white text-stone-900 shadow-sm dark:bg-[#1c1917] dark:text-stone-100"
                  : "text-stone-500 hover:text-stone-800 dark:text-stone-400",
              )}
            >
              <MaterialSymbol icon="grid_view" size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={openCategories}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#e8e0d6] bg-white px-4 py-2 text-[12px] font-bold text-stone-700 hover:border-[#9a0002]/30 dark:border-[#3d3732] dark:bg-[#1c1917] dark:text-stone-200"
          >
            <MaterialSymbol icon="category" size={16} />
            Categorías
          </button>
          <button
            type="button"
            disabled={atProductLimit || categories.length === 0}
            onClick={openNew}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#9a0002] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#850002] disabled:opacity-50"
          >
            <MaterialSymbol icon="add" size={18} />
            Agregar producto
          </button>
        </div>
      </div>

      <div className={cn("overflow-hidden rounded-2xl border border-[#e8e0d6] bg-[#f3efe8] dark:border-[#3d3732] dark:bg-[#141210]", MENU_PREVIEW_MAX_CLASS)}>
        <div className="px-5 pt-5 pb-8">
          <h2 className="mb-1 text-[15px] font-bold text-gray-900 dark:text-gray-100">Menú</h2>
          {products.length > 0 && categories.length > 0 && (
            <CategoryStickyNav categories={categories} products={products} />
          )}
          {menuPreview}
        </div>
      </div>

      {atProductLimit && (
        <p className="text-[12px] text-amber-700 dark:text-amber-400">
          Llegaste al límite de {FREE_PLAN_MAX_PRODUCTS} productos del Plan Inicial.
        </p>
      )}

      <ProductSlidePanel
        key={editing?.id ?? "new"}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        businessId={businessId}
        categories={categories}
        editing={
          editing
            ? {
                id: editing.id,
                name: editing.name,
                description: editing.description,
                categoryId: editing.category_id ?? categories[0]?.id ?? "",
                price: editing.price_cents / 100,
                iconUrl: editing.iconUrl,
                photoUrl: editing.photoUrl,
                iconPath: editing.icon_path,
                photoPath: editing.image_path,
                ingredients: editing.ingredients,
                options: editing.options,
              }
            : null
        }
        onSaved={refresh}
      />

      <MenuCategoriesPanel
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        businessId={businessId}
        plan={plan}
        categories={categories}
        onChange={refresh}
      />
    </div>
  );
}
