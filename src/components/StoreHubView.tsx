"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useCart } from "@/components/CartProvider";
import type { FeaturedChain, TrendingItem } from "@/lib/business/types";
import type { PublicMenuCategory } from "@/lib/business/publicStore";
import { profileFromChain, StoreLocationBlock, StoreSidePanel } from "@/components/StoreShowcase";
import { ProductImageToggle } from "@/components/menu/ProductImageToggle";
import { ProductImagePlaceholder } from "@/components/menu/ProductImagePlaceholder";
import { MenuReelsFeed } from "@/components/menu/MenuReelsFeed";
import { MobileStoreCoverHeader } from "@/components/store/MobileStoreCoverHeader";
import { MENU_IMAGE_FRAME_CLASS } from "@/lib/images/menuImageSpec";
import { cn } from "@/lib/utils";

function money(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function ProductCard({
  item,
  onOpen,
  onOpenReels,
  onQuickAdd,
}: {
  item: TrendingItem;
  onOpen: () => void;
  onOpenReels: () => void;
  onQuickAdd: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-black/[0.04] dark:border-[#3d3732]",
        "bg-white dark:bg-[#1c1917] text-left hover:border-[#9a0002]/25 transition-all duration-300",
        "shadow-[0_8px_24px_-16px_rgba(61,43,31,0.2)]",
      )}
    >
      <button
        type="button"
        onClick={onOpenReels}
        aria-label={`Ver ${item.name} en Reels`}
        className={cn(MENU_IMAGE_FRAME_CLASS, "w-full cursor-pointer border-0 p-0")}
      >
        {(item.iconImage || item.photoImage || item.image) ? (
          <ProductImageToggle
            iconUrl={item.iconImage ?? item.image}
            photoUrl={item.photoImage}
            className="h-full w-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <ProductImagePlaceholder className="h-full w-full" />
        )}
      </button>
      <span
        role="button"
        tabIndex={0}
        aria-label={`Agregar ${item.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onQuickAdd();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.stopPropagation();
            onQuickAdd();
          }
        }}
        className="absolute right-2.5 top-2.5 z-[1] flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#9a0002] text-sm font-bold text-white shadow hover:bg-[#6b0001] active:scale-95 transition-all"
      >
        +
      </span>
      <button type="button" onClick={onOpen} className="w-full cursor-pointer p-3 text-left">
        <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#9a0002] transition-colors">
          {item.name}
        </p>
        <p className="mt-1 text-[14px] font-bold text-[#9a0002]">{money(item.price)}</p>
      </button>
    </div>
  );
}

function ReelsEntryButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#9a0002]/25 bg-[#9a0002]/8 px-3 py-1.5 text-[12px] font-bold text-[#9a0002] hover:bg-[#9a0002]/15 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#9a0002]/40 dark:bg-[#9a0002]/15 dark:text-[#ff8a8c]"
    >
      <MaterialSymbol icon="slideshow" size={16} />
      Ver en Reels
    </button>
  );
}

function CategoryStickyNav({
  categories,
  products,
}: {
  categories: PublicMenuCategory[];
  products: TrendingItem[];
}) {
  const visible = categories.filter((c) => products.some((p) => p.categoryId === c.id));
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

function MobileStoreInfo({
  chain,
  profile,
}: {
  chain: FeaturedChain;
  profile: ReturnType<typeof profileFromChain>;
}) {
  return (
    <div className="bg-white px-5 pb-4 dark:bg-[#141210]">
      <div className="flex items-center gap-3 rounded-2xl bg-[#f3f1ef] px-3.5 py-3 dark:bg-[#1c1917]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9a0002]/12 text-[#9a0002]">
          <MaterialSymbol icon="delivery_dining" size={22} />
        </div>
        <p className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
          Envío {money(chain.deliveryFee)}
        </p>
      </div>
      <div className="mt-3">
        <StoreLocationBlock profile={profile} />
      </div>
    </div>
  );
}

type Props = {
  chain: FeaturedChain;
  products: TrendingItem[];
  categories?: PublicMenuCategory[];
  backHref: string;
  initialDishId?: string | null;
};

export function StoreHubView({
  chain,
  products,
  categories = [],
  backHref,
  initialDishId = null,
}: Props) {
  const { openProduct, quickAdd } = useCart();
  const [following, setFollowing] = useState(false);
  const [reelsOpen, setReelsOpen] = useState(false);
  const [reelsDishId, setReelsDishId] = useState<string | null>(null);

  const openReels = (productId?: string) => {
    setReelsDishId(productId ?? null);
    setReelsOpen(true);
  };

  useEffect(() => {
    if (!initialDishId || products.length === 0) return;
    if (!products.some((p) => p.id === initialDishId)) return;
    setReelsDishId(initialDishId);
    setReelsOpen(true);
  }, [initialDishId, products]);

  const profile = profileFromChain(chain, products.length, "0");

  const grouped = useMemo(() => {
    const sortedCats = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const sections: { id: string; name: string; items: TrendingItem[] }[] = [];
    for (const c of sortedCats) {
      const items = products.filter((p) => p.categoryId === c.id);
      if (items.length > 0) sections.push({ id: c.id, name: c.name, items });
    }
    const other = products.filter((p) => !p.categoryId || !categories.some((c) => c.id === p.categoryId));
    if (other.length > 0) sections.push({ id: "other", name: "Otros", items: other });
    return sections;
  }, [categories, products]);

  const productGrid =
    products.length === 0 ? (
      <p className="py-8 text-center text-sm text-gray-500">Este local aún no publicó productos.</p>
    ) : grouped.length > 0 ? (
      <div className="space-y-8">
        {grouped.map((section) => (
          <section key={section.id} id={section.id === "other" ? undefined : `menu-cat-${section.id}`}>
            <h3 className="mb-3 text-[14px] font-bold text-gray-900 dark:text-gray-100">{section.name}</h3>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {section.items.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onOpen={() => openProduct(item)}
                  onOpenReels={() => openReels(item.id)}
                  onQuickAdd={() => quickAdd(item)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            onOpen={() => openProduct(item)}
            onOpenReels={() => openReels(item.id)}
            onQuickAdd={() => quickAdd(item)}
          />
        ))}
      </div>
    );

  return (
    <div className="min-h-dvh md:h-dvh md:overflow-hidden md:bg-[#f3efe8] md:pb-0 dark:md:bg-[#141210]">
      <div className="flex min-h-dvh flex-col md:hidden">
        <MobileStoreCoverHeader
          name={chain.name}
          logoUrl={chain.logoImage}
          logoEmoji={chain.logoEmoji}
          bannerUrl={chain.bannerImage}
          bannerBg={chain.bannerBg}
          rating={chain.rating}
          reviewsCount={chain.reviewsCount ?? 0}
          isOpen={chain.isOpen ?? true}
          backHref={backHref}
        />
        <MobileStoreInfo chain={chain} profile={profile} />
        <div className="flex-1 bg-[#f3efe8] px-5 pt-5 pb-28 dark:bg-[#141210]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">Menú</h2>
            <ReelsEntryButton onClick={() => openReels()} disabled={products.length === 0} />
          </div>
          <CategoryStickyNav categories={categories} products={products} />
          {productGrid}
        </div>
      </div>

      <div className="mx-auto hidden h-full max-w-[1280px] md:flex md:pb-0">
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center gap-3 px-6 py-4 lg:px-8">
            <Link
              href={backHref}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.04] bg-white text-gray-700 shadow-sm dark:border-[#3d3732] dark:bg-[#1c1917] dark:text-gray-200"
              aria-label="Volver"
            >
              <MaterialSymbol icon="arrow_back" size={18} />
            </Link>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Menú</h2>
              <p className="text-[12px] text-gray-400">{chain.name}</p>
            </div>
            <ReelsEntryButton onClick={() => openReels()} disabled={products.length === 0} />
          </header>
          <div className="flex-1 overflow-y-auto px-6 pb-28 lg:px-8">
            <CategoryStickyNav categories={categories} products={products} />
            {productGrid}
          </div>
        </main>

        <StoreSidePanel
          profile={profile}
          mode="customer"
          following={following}
          onFollowToggle={() => setFollowing((f) => !f)}
          variant="panel"
          className="w-[360px] shrink-0 lg:w-[400px]"
        />
      </div>

      <MenuReelsFeed
        chain={chain}
        products={products}
        initialProductId={reelsDishId}
        open={reelsOpen}
        onClose={() => setReelsOpen(false)}
      />
    </div>
  );
}
