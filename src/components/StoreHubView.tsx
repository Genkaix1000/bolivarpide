"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useCart } from "@/components/CartProvider";
import type { FeaturedChain, TrendingItem } from "@/lib/mockData";
import type { PublicMenuCategory } from "@/lib/business/publicStore";
import { profileFromChain, StoreLocationBlock, StoreSidePanel } from "@/components/StoreShowcase";
import { cn } from "@/lib/utils";

function money(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function ProductCard({
  item,
  onOpen,
  onQuickAdd,
}: {
  item: TrendingItem;
  onOpen: () => void;
  onQuickAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-black/[0.04] dark:border-[#3d3732]",
        "bg-white dark:bg-[#1c1917] text-left cursor-pointer hover:border-[#9a0002]/25 transition-all duration-300",
        "shadow-[0_8px_24px_-16px_rgba(61,43,31,0.2)]",
      )}
    >
      <div className="relative h-28 md:h-36 overflow-hidden bg-[#f0ebe4] dark:bg-[#231f1c]">
        {item.image ? (
          <img
            src={item.image}
            alt=""
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">{item.emoji}</div>
        )}
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
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#9a0002] text-sm font-bold text-white shadow hover:bg-[#6b0001] active:scale-95 transition-all"
        >
          +
        </span>
      </div>
      <div className="p-3">
        <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#9a0002] transition-colors">
          {item.name}
        </p>
        <p className="mt-1 text-[14px] font-bold text-[#9a0002]">{money(item.price)}</p>
      </div>
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

function MobileStoreHeader({
  chain,
  profile,
  following,
  onFollowToggle,
  productsCount,
  backHref,
}: {
  chain: FeaturedChain;
  profile: ReturnType<typeof profileFromChain>;
  following: boolean;
  onFollowToggle: () => void;
  productsCount: number;
  backHref: string;
}) {
  return (
    <div className="bg-white dark:bg-[#141210]">
      <div className="relative h-[200px] w-full overflow-hidden bg-[#2a201c]">
        {chain.bannerImage ? (
          <img src={chain.bannerImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={cn("h-full w-full", chain.bannerBg)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-black/25" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <Link
            href={backHref}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
            aria-label="Volver"
          >
            <MaterialSymbol icon="arrow_back" size={20} />
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm cursor-pointer"
              aria-label="Favorito"
            >
              <MaterialSymbol icon="favorite" size={20} />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm cursor-pointer"
              aria-label="Compartir"
              onClick={() => {
                if (navigator.share) void navigator.share({ title: chain.name, url: window.location.href });
              }}
            >
              <MaterialSymbol icon="ios_share" size={20} />
            </button>
          </div>
        </div>
        <p className="absolute bottom-12 left-4 right-4 text-center text-[15px] font-semibold tracking-wide text-white drop-shadow-md">
          {chain.bannerText}
        </p>
      </div>

      <div className="relative z-10 -mt-10 px-5 pb-2">
        <div className="mx-auto flex max-w-lg flex-col items-center">
          <div className="h-[72px] w-[72px] overflow-hidden rounded-full border-[3px] border-white dark:border-[#141210] bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]">
            {chain.logoImage ? (
              <img src={chain.logoImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl">{chain.logoEmoji}</div>
            )}
          </div>
          <h1 className="mt-3 text-[22px] font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {chain.name}
          </h1>

          <div className="mt-4 flex w-full max-w-sm items-center justify-center">
            <div className="flex flex-1 flex-col items-center">
              <span className="text-[16px] font-bold text-gray-900 dark:text-gray-100">0</span>
              <span className="text-[11px] text-gray-400">Seguidores</span>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-[#2a2623]" />
            <div className="flex flex-1 flex-col items-center">
              <span className="text-[16px] font-bold text-gray-900 dark:text-gray-100">{productsCount}</span>
              <span className="text-[11px] text-gray-400">Productos</span>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-[#2a2623]" />
            <div className="flex flex-1 flex-col items-center">
              <span className="flex items-center gap-0.5 text-[16px] font-bold text-gray-900 dark:text-gray-100">
                {chain.rating}
                <MaterialSymbol icon="star" size={14} fill className="text-amber-500" />
              </span>
              <span className="text-[11px] text-gray-400">Rating</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onFollowToggle}
            className={cn(
              "mt-5 w-full max-w-sm rounded-full py-3 text-[14px] font-semibold cursor-pointer transition-colors",
              following
                ? "border border-[#9a0002]/40 bg-[#9a0002]/8 text-[#9a0002]"
                : "bg-[#9a0002] text-white hover:bg-[#6b0001]",
            )}
          >
            {following ? "Siguiendo" : "Seguir"}
          </button>

          <div className="mt-4 flex w-full max-w-sm items-center gap-3 rounded-2xl bg-[#f3f1ef] dark:bg-[#1c1917] px-3.5 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9a0002]/12 text-[#9a0002]">
              <MaterialSymbol icon="delivery_dining" size={22} />
            </div>
            <div className="min-w-0 text-[12px] leading-snug text-gray-600 dark:text-gray-300">
              <p className="font-bold text-gray-900 dark:text-gray-100">
                Envío {money(chain.deliveryFee)}
              </p>
            </div>
          </div>

          <div className="mt-3 w-full max-w-sm">
            <StoreLocationBlock profile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  chain: FeaturedChain;
  products: TrendingItem[];
  categories?: PublicMenuCategory[];
  backHref: string;
};

export function StoreHubView({ chain, products, categories = [], backHref }: Props) {
  const { openProduct, quickAdd } = useCart();
  const [following, setFollowing] = useState(false);

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
            onQuickAdd={() => quickAdd(item)}
          />
        ))}
      </div>
    );

  return (
    <div className="min-h-dvh bg-[#f3efe8] dark:bg-[#141210] pb-28 md:h-dvh md:overflow-hidden md:pb-0">
      <div className="md:hidden">
        <MobileStoreHeader
          chain={chain}
          profile={profile}
          following={following}
          onFollowToggle={() => setFollowing((f) => !f)}
          productsCount={products.length}
          backHref={backHref}
        />
        <div className="mx-auto max-w-lg px-5 pt-6 pb-4">
          <h2 className="mb-1 text-[15px] font-bold text-gray-900 dark:text-gray-100">Menú</h2>
          <CategoryStickyNav categories={categories} products={products} />
          {productGrid}
        </div>
      </div>

      <div className="mx-auto hidden h-full max-w-[1280px] md:flex">
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center gap-3 px-6 py-4 lg:px-8">
            <Link
              href={backHref}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.04] bg-white text-gray-700 shadow-sm dark:border-[#3d3732] dark:bg-[#1c1917] dark:text-gray-200"
              aria-label="Volver"
            >
              <MaterialSymbol icon="arrow_back" size={18} />
            </Link>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Menú</h2>
              <p className="text-[12px] text-gray-400">{chain.name}</p>
            </div>
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
    </div>
  );
}
