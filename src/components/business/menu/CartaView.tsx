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

type ViewMode = "manage" | "preview";

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

function CategoryChips({
  categories,
  products,
  sticky,
}: {
  categories: MenuCategoryView[];
  products: MenuProductView[];
  sticky?: boolean;
}) {
  const visible = categories.filter((c) => products.some((p) => p.category_id === c.id));
  if (visible.length <= 1) return null;

  return (
    <div
      className={cn(
        "z-20 border-b border-[#e8e0d6]/80 bg-[#f3efe8]/95 py-2.5 backdrop-blur-md dark:border-[#3d3732] dark:bg-[#1c1917]/95",
        sticky && "sticky top-0 -mx-4 px-4 md:-mx-8 md:px-8",
      )}
    >
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {visible.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              document
                .getElementById(`menu-cat-${c.id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="shrink-0 cursor-pointer rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-stone-700 ring-1 ring-[#e8e0d6] hover:text-[#9a0002] hover:ring-[#9a0002]/35 dark:bg-[#1c1917] dark:text-stone-200 dark:ring-[#3d3732]"
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
          title={paused ? "Activar" : "Pausar"}
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

function PreviewCard({ product, onEdit }: { product: MenuProductView; onEdit: () => void }) {
  const paused = !product.available;
  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        "w-full overflow-hidden rounded-2xl bg-white text-left dark:bg-[#1c1917]",
        paused && "opacity-70",
      )}
    >
      <div className={MENU_IMAGE_FRAME_CLASS}>
        {product.iconUrl ? (
          <ProductImageToggle
            iconUrl={product.iconUrl}
            photoUrl={product.photoUrl}
            className={cn("h-full w-full", paused && "grayscale")}
          />
        ) : (
          <ProductImagePlaceholder className={cn("h-full w-full", paused && "grayscale")} />
        )}
        {paused ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white">
            Pausado
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <p className="truncate text-[13px] font-semibold text-stone-900 dark:text-stone-100">
          {product.name}
        </p>
        <p className="mt-1 text-[14px] font-bold text-[#9a0002]">{money(product.price_cents)}</p>
      </div>
    </button>
  );
}

function EmptyState({
  icon,
  title,
  body,
  cta,
  onCta,
}: {
  icon: string;
  title: string;
  body: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#e8e0d6] bg-white/60 px-6 py-10 text-center dark:border-[#3d3732] dark:bg-[#1c1917]/60">
      <MaterialSymbol icon={icon} size={36} className="mx-auto text-stone-300 dark:text-stone-600" />
      <p className="mt-4 text-[15px] font-bold text-stone-800 dark:text-stone-100">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-snug text-stone-500">{body}</p>
      <button
        type="button"
        onClick={onCta}
        className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#9a0002] px-6 py-3 text-[13px] font-bold text-white hover:bg-[#850002]"
      >
        <MaterialSymbol icon="add" size={18} />
        {cta}
      </button>
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
  const [mode, setMode] = useState<ViewMode>("manage");
  const pendingDeletes = useRef(new Map<string, number>());

  useEffect(() => {
    setProducts(initialProducts);
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
    if (uncategorized.length > 0) {
      sections.push({ id: "other", name: "Otros", items: uncategorized });
    }
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

  const empty =
    categories.length === 0 && products.length === 0 ? (
      <EmptyState
        icon="restaurant_menu"
        title="Todavía no hay artículos en tu carta"
        body="Creá categorías (Entradas, Bebidas…) y sumá tu primer producto con foto y precio."
        cta="Empezar mi carta"
        onCta={openCategories}
      />
    ) : categories.length === 0 ? (
      <EmptyState
        icon="category"
        title="Falta organizar categorías"
        body="Ej. Entradas, Principales, Bebidas — después agregás productos."
        cta="Crear categorías"
        onCta={openCategories}
      />
    ) : products.length === 0 ? (
      <EmptyState
        icon="add_photo_alternate"
        title="No hay artículos todavía"
        body="Sumá ícono, precio y categoría para que aparezcan en tu menú público."
        cta="Crear mi primer producto"
        onCta={openNew}
      />
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Carta</h1>
          <p className="mt-1 text-[13px] text-stone-500">
            {products.length} producto{products.length === 1 ? "" : "s"} · {categories.length}{" "}
            categorí{categories.length === 1 ? "a" : "as"}
            {businessName ? ` · ${businessName}` : ""}
          </p>
          <p className="mt-0.5 text-[12px] font-semibold text-stone-400">
            {freePlanLimitsLabel(products.length, categories.length)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-[#e8e0d6]/70 p-0.5 dark:bg-[#2a2623]">
            <button
              type="button"
              onClick={() => setMode("manage")}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                mode === "manage"
                  ? "bg-white text-stone-900 shadow-sm dark:bg-[#1c1917] dark:text-stone-100"
                  : "text-stone-500 hover:text-stone-800 dark:text-stone-400",
              )}
            >
              Gestionar
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                mode === "preview"
                  ? "bg-white text-stone-900 shadow-sm dark:bg-[#1c1917] dark:text-stone-100"
                  : "text-stone-500 hover:text-stone-800 dark:text-stone-400",
              )}
            >
              Vista cliente
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
            Agregar
          </button>
        </div>
      </div>

      {atProductLimit ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Llegaste al límite de {FREE_PLAN_MAX_PRODUCTS} productos del Plan Inicial.
        </p>
      ) : null}

      {empty ? (
        empty
      ) : mode === "manage" ? (
        <div>
          <CategoryChips categories={categories} products={products} sticky />
          <div className="mt-4 space-y-6">
            {grouped.map((section) => (
              <section
                key={section.id}
                id={section.id === "other" ? undefined : `menu-cat-${section.id}`}
                className="scroll-mt-16"
              >
                <h2 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wide text-stone-400">
                  {section.name}
                  <span className="ml-1.5 font-semibold normal-case tracking-normal text-stone-300">
                    {section.items.length}
                  </span>
                </h2>
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
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "overflow-hidden rounded-[28px] border border-[#e8e0d6] bg-[#f3efe8] dark:border-[#3d3732] dark:bg-[#141210]",
            MENU_PREVIEW_MAX_CLASS,
          )}
        >
          <div className="border-b border-[#e8e0d6]/80 px-5 py-3 dark:border-[#3d3732]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Así lo ven tus clientes
            </p>
          </div>
          <div className="px-5 pb-8 pt-4">
            <CategoryChips categories={categories} products={products} />
            <div className="mt-4 space-y-7">
              {grouped.map((section) => (
                <section
                  key={section.id}
                  id={section.id === "other" ? undefined : `menu-cat-${section.id}`}
                >
                  <h3 className="mb-3 text-[14px] font-bold text-stone-900 dark:text-stone-100">
                    {section.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {section.items.map((p) => (
                      <PreviewCard key={p.id} product={p} onEdit={() => openEdit(p)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
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
