import { getCartaPageData } from "@/lib/business/menuQueries";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";
import { CartaView } from "@/components/business/menu/CartaView";
import type { MenuCategoryView, MenuProductView } from "@/lib/business/menuTypes";

export default async function CartaPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { business, categories, products } = await getCartaPageData(businessId);

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const productViews: MenuProductView[] = products.map((p) => ({
    ...p,
    category_id: p.category_id ?? null,
    icon_path: p.icon_path ?? null,
    iconUrl: resolveBusinessAssetUrl(p.icon_path),
    photoUrl: resolveBusinessAssetUrl(p.image_path),
    categoryName: p.category_id
      ? categoryNameById.get(p.category_id) ?? p.category
      : p.category,
  }));

  const categoryViews: MenuCategoryView[] = categories as MenuCategoryView[];

  return (
    <CartaView
      businessId={businessId}
      plan={business.plan}
      categories={categoryViews}
      products={productViews}
    />
  );
}
