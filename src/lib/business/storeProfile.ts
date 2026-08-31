import type { StoreProfile } from "@/components/StoreShowcase";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";

export type DbBusinessProfile = {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  logo_path?: string | null;
  banner_path?: string | null;
  rating?: number;
  reviews_count?: number;
  prep_time_minutes?: number;
  address?: string | null;
  is_open?: boolean;
};

export function profileFromDbBusiness(
  b: DbBusinessProfile,
  productsCount: number,
): StoreProfile {
  return {
    name: b.name,
    bannerText: b.tagline ?? b.name,
    bannerImage: resolveBusinessAssetUrl(b.banner_path) ?? b.banner_path ?? undefined,
    bannerBgClass: "bg-[#5d4037]",
    logoImage: resolveBusinessAssetUrl(b.logo_path) ?? b.logo_path ?? undefined,
    logoEmoji: b.name.slice(0, 1).toUpperCase(),
    rating: Number(b.rating) || 0,
    followersLabel: "0",
    productsCount,
    timeEstimate: `${b.prep_time_minutes ?? 30} min`,
    deliveryFee: 0,
    minOrder: 0,
    address: b.address ?? "",
    lat: -36.2295,
    lng: -61.1168,
    chainId: b.id || b.slug,
  };
}
