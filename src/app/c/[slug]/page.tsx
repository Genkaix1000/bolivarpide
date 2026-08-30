import Link from "next/link";
import { StoreHubView } from "@/components/StoreHubView";
import { getPublicStoreBySlug } from "@/lib/business/queries";
import { productToTrendingItem, publicStoreToFeaturedChain } from "@/lib/business/publicStore";

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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-white dark:bg-[#1c1917] px-6">
        <p className="text-sm text-gray-500">No encontramos este local</p>
        <Link href="/" className="text-sm font-semibold text-[#9a0002]">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const { business, categories, products } = store;
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const chain = publicStoreToFeaturedChain(business);
  const trending = products.map((p) =>
    productToTrendingItem(
      business,
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
