import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { toFeaturedChain } from "@/lib/business/home";
import { productToTrendingItem } from "@/lib/business/publicStore";
import { PROMO_BANNERS } from "@/lib/business/staticContent";
import type { FeaturedChain, PromoBanner, TrendingItem } from "@/lib/business/types";

export type HomeData = {
  chains: FeaturedChain[];
  recommended: FeaturedChain[];
  trendingItems: TrendingItem[];
  promoBanners: PromoBanner[];
};

/**
 * Cliente Supabase público sin sesión (solo RLS pública, read-most): los datos del
 * home no dependen del usuario y así no se rompe el ISR (sin cookies dinámicas).
 */
function publicSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

async function loadHomeData(): Promise<HomeData> {
  const supabase = publicSupabase();

  const { data: pubs } = await supabase
    .from("businesses")
    .select(
      "id, slug, name, tagline, logo_path, banner_path, rating, reviews_count, prep_time_minutes, is_open, address",
    )
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (!pubs || pubs.length === 0) {
    return { chains: [], recommended: [], trendingItems: [], promoBanners: PROMO_BANNERS };
  }

  const chains = pubs.map(toFeaturedChain);

  let trendingItems: TrendingItem[] = [];
  const { data: productRows } = await supabase
    .from("products")
    .select(
      "id, name, description, price_cents, image_path, icon_path, category_id, category, ingredients, options, business_id, businesses!inner(slug, name, published, logo_path, banner_path, rating, reviews_count, is_open)",
    )
    .eq("available", true)
    .eq("businesses.published", true)
    .order("updated_at", { ascending: false })
    .limit(12);

  if (productRows && productRows.length > 0) {
    trendingItems = productRows.map((row) => {
      const bizRaw = (row.businesses as
        | {
            slug: string;
            name: string;
            logo_path?: string | null;
            banner_path?: string | null;
            rating?: number;
            reviews_count?: number;
            is_open?: boolean;
          }
        | Array<{
            slug: string;
            name: string;
            logo_path?: string | null;
            banner_path?: string | null;
            rating?: number;
            reviews_count?: number;
            is_open?: boolean;
          }>);
      const biz = Array.isArray(bizRaw) ? bizRaw[0] : bizRaw;
      return productToTrendingItem(
        {
          slug: biz.slug,
          name: biz.name,
          logo_path: biz.logo_path,
          banner_path: biz.banner_path,
          rating: biz.rating,
          reviews_count: biz.reviews_count,
          is_open: biz.is_open,
        },
        {
          id: row.id,
          name: row.name,
          description: row.description,
          price_cents: row.price_cents,
          image_path: row.image_path,
          icon_path: row.icon_path,
          category_id: row.category_id,
          category: row.category,
          ingredients: row.ingredients,
          options: row.options,
        },
        row.category_id ? undefined : row.category,
      );
    });
  }

  let promoBanners: PromoBanner[] = PROMO_BANNERS;
  const { data: promoRows } = await supabase
    .from("promo_banners")
    .select("id, title, subtitle, badge, cta_text, cta_link, image, icon, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (promoRows && promoRows.length > 0) {
    promoBanners = promoRows.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      badge: r.badge || undefined,
      ctaText: r.cta_text || undefined,
      ctaLink: r.cta_link || undefined,
      image: r.image || undefined,
      icon: r.icon || "local_offer",
      sortOrder: r.sort_order,
      active: r.is_active,
    }));
  }

  return {
    chains: shuffle(chains),
    recommended: shuffle(chains),
    trendingItems,
    promoBanners,
  };
}

/** Memoización por request; el cache durarero lo hace el ISR de la page (revalidate=60). */
export const getHomeData = cache(loadHomeData);