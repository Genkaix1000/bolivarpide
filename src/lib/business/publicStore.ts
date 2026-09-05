import type { BusinessRow } from "@/lib/business/queries";
import type { TrendingItem } from "@/lib/business/types";
import { toFeaturedChain, type PublishedStore } from "@/lib/business/home";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";
import { parseMenuOptionGroups } from "@/lib/business/menuOptionTypes";

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
  options?: Array<{ id?: string; title: string; kind?: string; required?: boolean; choices: unknown[] }>;
};

export function productToTrendingItem(
  business: Pick<BusinessRow, "slug" | "name"> & {
    logo_path?: string | null;
    banner_path?: string | null;
    rating?: number;
    reviews_count?: number;
    is_open?: boolean;
  },
  product: PublicProductRow,
  categoryName?: string,
): TrendingItem {
  const photo = resolveBusinessAssetUrl(product.image_path);
  const icon = resolveBusinessAssetUrl(product.icon_path);

  const mappedOptions = (() => {
    const groups = parseMenuOptionGroups(product.options);
    if (groups.length === 0) return undefined;
    return groups.map((opt, i) => ({
      id: opt.id || `opt-${i}`,
      name: opt.title,
      required: opt.kind === "extras" ? false : Boolean(opt.required),
      multi: opt.kind === "extras",
      choices: opt.choices.map((c, ci) => ({
        id: `choice-${i}-${ci}`,
        label: c.label,
        priceDelta: c.price_cents > 0 ? c.price_cents / 100 : 0,
      })),
    }));
  })();

  return {
    id: product.id,
    name: product.name,
    storeName: business.name,
    chainId: business.slug,
    price: product.price_cents / 100,
    emoji: product.name.slice(0, 1).toUpperCase(),
    // Primary preview is the icon (el ícono es la vista previa principal)
    image: icon ?? photo ?? undefined,
    iconImage: icon ?? photo ?? undefined,
    photoImage: photo ?? icon ?? undefined,
    description: product.description ?? undefined,
    categoryId: product.category_id ?? undefined,
    categoryName: categoryName ?? product.category ?? undefined,
    ingredients: Array.isArray(product.ingredients) ? product.ingredients : undefined,
    options: mappedOptions && mappedOptions.length > 0 ? mappedOptions : undefined,
    storeRating: Number(business.rating) || 0,
    storeReviewsCount: Number(business.reviews_count) || 0,
    storeLogoUrl: resolveBusinessAssetUrl(business.logo_path ?? null),
    storeBannerUrl: resolveBusinessAssetUrl(business.banner_path ?? null),
    storeIsOpen: business.is_open,
  };
}

export function publicStoreToFeaturedChain(
  b: PublishedStore & { banner_path?: string | null; slug: string },
) {
  const chain = toFeaturedChain(b);
  return {
    ...chain,
    id: b.slug,
    logoEmoji: b.name.slice(0, 1).toUpperCase(),
    bannerBg: "from-[#9a0002] to-[#6b0001]",
    deliveryFee: 0,
    minOrder: 0,
    lat: -36.2295,
    lng: -61.1168,
  };
}
