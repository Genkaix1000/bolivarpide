"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
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
  plan: string;
  categories: MenuCategoryView[];
  products: MenuProductView[];
};

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
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
        "group relative overflow-hidden rounded-2xl border transition-all duration-200",
        deleteConfirm
          ? "border-red-600 bg-red-600"
          : paused
            ? "border-stone-200 bg-stone-100/80 opacity-75 dark:border-[#3d3732] dark:bg-[#1a1816]"
            : "border-[#e8e0d6] bg-white dark:border-[#3d3732] dark:bg-[#1c1917]",
      )}
    >
      <button type="button" onClick={onEdit} className="block w-full text-left cursor-pointer">
        <div className="relative h-32 bg-[#f0ebe4] dark:bg-[#231f1c]">
          {product.photoUrl || product.iconUrl ? (
            <img
              src={product.photoUrl ?? product.iconUrl}
              alt=""
              className={cn("h-full w-full object-cover", paused && "grayscale")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-stone-400">
              {product.name.slice(0, 1)}
            </div>
          )}
          {product.iconUrl && product.photoUrl && (
            <img
              src={product.iconUrl}
              alt=""
              className="absolute bottom-2 left-2 h-10 w-10 rounded-lg border-2 border-white object-cover shadow"
            />
          )}
        </div>
        <div className="p-3">
          <p
            className={cn(
              "truncate text-[13px] font-bold",
              deleteConfirm ? "text-white" : "text-stone-900 dark:text-stone-100",
            )}
          >
            {product.name}
          </p>
          <p
            className={cn(
              "mt-0.5 text-[12px]",
              deleteConfirm ? "text-white/80" : "text-stone-500",
            )}
          >
            {product.categoryName ?? "Sin categoría"} · {money(product.price_cents)}
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
        <div
          className={cn(
            "rounded-full",
            deleteConfirm && "bg-white/10",
          )}
        >
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

export function CartaView({ businessId, plan, categories, products: initialProducts }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [panelOpen, setPanelOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [editing, setEditing] = useState<MenuProductView | null>(null);
  const pendingDeletes = useRef(new Map<string, number>());

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const atProductLimit = isFreePlan(plan) && products.length >= FREE_PLAN_MAX_PRODUCTS;

  const grouped = useMemo(() => {
    const catOrder = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const byCat = new Map<string, MenuProductView[]>();
    for (const c of catOrder) byCat.set(c.id, []);
    const uncategorized: MenuProductView[] = [];
    for (const p of products) {
      if (p.category_id && byCat.has(p.category_id)) {
        byCat.get(p.category_id)!.push(p);
      } else {
        uncategorized.push(p);
      }
    }
    return { catOrder, byCat, uncategorized };
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Tu menú</h1>
          <p className="mt-1 text-sm text-stone-500">
            Organizá tu carta para que tus clientes puedan pedir.
          </p>
          <p className="mt-1 text-[12px] font-semibold text-stone-400">
            {freePlanLimitsLabel(products.length, categories.length)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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

      {categories.length === 0 && products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center dark:border-[#3d3732] dark:bg-[#1c1917]">
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
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center dark:border-[#3d3732] dark:bg-[#1c1917]">
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
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center dark:border-[#3d3732] dark:bg-[#1c1917]">
          <MaterialSymbol icon="add_photo_alternate" size={40} className="mx-auto text-stone-300 dark:text-stone-600" />
          <p className="mt-4 text-[15px] font-bold text-stone-800 dark:text-stone-100">
            No hay artículos todavía
          </p>
          <p className="mt-2 text-[13px] text-stone-500">
            Sumá foto, precio y categoría para que aparezcan en tu menú público.
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
          {grouped.catOrder.map((cat) => {
            const items = grouped.byCat.get(cat.id) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={cat.id}>
                <h2 className="mb-3 text-[14px] font-bold text-stone-800 dark:text-stone-100">{cat.name}</h2>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onEdit={() => openEdit(p)}
                      onPause={() => void handlePause(p)}
                      onDeleteConfirmed={() => scheduleDelete(p)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
          {grouped.uncategorized.length > 0 && (
            <section>
              <h2 className="mb-3 text-[14px] font-bold text-stone-800 dark:text-stone-100">Otros</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {grouped.uncategorized.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onEdit={() => openEdit(p)}
                    onPause={() => void handlePause(p)}
                    onDeleteConfirmed={() => scheduleDelete(p)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

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
