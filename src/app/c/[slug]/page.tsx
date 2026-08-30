import Link from "next/link";
import { StoreHubView } from "@/components/StoreHubView";
import { getPublicStoreBySlug } from "@/lib/business/queries";
import { productToTrendingItem, publicStoreToFeaturedChain } from "@/lib/business/publicStore";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export default async function StoreHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  const store = await getPublicStoreBySlug(slug);

  if (!store) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#faf6f1] dark:bg-[#141210] px-6 text-center select-none">
        {/* Animated Scanner / Store Badge */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute h-28 w-28 rounded-full bg-[#9a0002]/10 animate-ping" />
          <div className="absolute h-24 w-24 rounded-full bg-[#9a0002]/15 animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-white shadow-xl shadow-[#9a0002]/25 border border-white/20">
            <MaterialSymbol icon="storefront" size={38} className="text-white drop-shadow-md" />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white dark:ring-[#141210] shadow-sm">
              <MaterialSymbol icon="search" size={16} />
            </span>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-2xl">
          Local no disponible
        </h1>
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          No pudimos encontrar el comercio <span className="font-semibold text-gray-700 dark:text-gray-300">"{slug}"</span> o actualmente no se encuentra abierto al público.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#9a0002] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#9a0002]/20 hover:bg-[#7f0002] active:scale-[0.98] transition-all"
          >
            <MaterialSymbol icon="explore" size={18} />
            Explorar locales
          </Link>
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#e8e0d6] dark:border-[#3d3732] bg-white dark:bg-[#1c1917] px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#25211e] active:scale-[0.98] transition-all"
          >
            <MaterialSymbol icon="arrow_back" size={18} />
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const { business, categories, products } = store;
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const chain = publicStoreToFeaturedChain(business);
  const trending = products.map((p) =>
    productToTrendingItem(
      {
        slug: business.slug,
        name: business.name,
        logo_path: business.logo_path,
        banner_path: business.banner_path,
        rating: business.rating,
        reviews_count: business.reviews_count,
        is_open: business.is_open,
      },
      p,
      p.category_id ? categoryNameById.get(p.category_id) : p.category,
    ),
  );
  const backHref =
    from === "negocio" ? `/negocio/${business.id}/dashboard` : "/";

  return (
    <StoreHubView
      chain={chain}
      products={trending}
      categories={categories}
      backHref={backHref}
    />
  );
}
