/** Map DB business → FeaturedChain-shaped card for home. */
export type PublishedStore = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_path: string | null;
  rating: number;
  reviews_count: number;
  prep_time_minutes: number;
  is_open: boolean;
  address: string | null;
};

export function toFeaturedChain(b: PublishedStore) {
  return {
    id: b.id,
    name: b.name,
    bannerText: b.tagline ?? (b.is_open ? "Abierto" : "Cerrado"),
    bannerBg: "from-[#9a0002] to-[#6b0001]",
    logoEmoji: b.name.slice(0, 1).toUpperCase(),
    logoImage: b.logo_path ?? undefined,
    timeEstimate: `${b.prep_time_minutes} min`,
    deliveryFee: 0,
    minOrder: 0,
    rating: Number(b.rating) || 0,
    address: b.address ?? "",
    lat: 0,
    lng: 0,
  };
}
