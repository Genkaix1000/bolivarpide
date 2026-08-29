import type { BusinessRow } from "@/lib/business/queries";
import type { TrendingItem } from "@/lib/mockData";
import { toFeaturedChain, type PublishedStore } from "@/lib/business/home";

export type PublicProductRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_path: string | null;
  category: string | null;
};

export function productToTrendingItem(
  business: Pick<BusinessRow, "slug" | "name">,
  product: PublicProductRow,
): TrendingItem {
  return {
    id: product.id,
    name: product.name,
    storeName: business.name,
    chainId: business.slug,
    price: product.price_cents / 100,
    emoji: product.name.slice(0, 1).toUpperCase(),
    image: product.image_path ?? undefined,
    description: product.description ?? undefined,
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
