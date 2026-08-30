import type { BusinessRow } from "@/lib/business/queries";
import type { TrendingItem } from "@/lib/mockData";
import { toFeaturedChain, type PublishedStore } from "@/lib/business/home";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";

export type PublicMenuCategory = {
  id: string;
  name: string;
  sort_order: number;
};

export type PublicProductRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_path: string | null;
  icon_path: string | null;
  category_id: string | null;
  category: string | null;
  ingredients?: string[];
  options?: Array<{ id?: string; title: string; choices: string[] }>;
};

export function productToTrendingItem(
  business: Pick<BusinessRow, "slug" | "name">,
  product: PublicProductRow,
  categoryName?: string,
): TrendingItem {
  const photo = resolveBusinessAssetUrl(product.image_path);
  const icon = resolveBusinessAssetUrl(product.icon_path);

  const mappedOptions = Array.isArray(product.options)
    ? product.options.map((opt, i) => ({
        id: opt.id || `opt-${i}`,
        name: opt.title,
        required: true,
        choices: opt.choices.map((c, ci) => ({
          id: `choice-${i}-${ci}`,
          label: c,
          priceDelta: 0,
        })),
      }))
    : undefined;

  return {
    id: product.id,
    name: product.name,
    storeName: business.name,
    chainId: business.slug,
    price: product.price_cents / 100,
    emoji: product.name.slice(0, 1).toUpperCase(),
    image: photo ?? icon ?? undefined,
    description: product.description ?? undefined,
    categoryId: product.category_id ?? undefined,
    categoryName: categoryName ?? product.category ?? undefined,
    ingredients: Array.isArray(product.ingredients) ? product.ingredients : undefined,
    options: mappedOptions && mappedOptions.length > 0 ? mappedOptions : undefined,
  };
}

export function publicStoreToFeaturedChain(
  b: PublishedStore & { banner_path?: string | null; slug: string },
) {
  const chain = toFeaturedChain(b);
  return {
    ...chain,
    id: b.slug,
    bannerImage: b.banner_path ?? undefined,
    logoImage: b.logo_path ?? undefined,
    logoEmoji: b.name.slice(0, 1).toUpperCase(),
    bannerBg: "from-[#9a0002] to-[#6b0001]",
    deliveryFee: 0,
    minOrder: 0,
    lat: -36.2295,
    lng: -61.1168,
  };
}
