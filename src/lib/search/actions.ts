"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  CatalogSearchResult,
  SearchResultCategory,
  SearchResultProduct,
  SearchResultStore,
  SearchResultTag,
} from "./types";
import {
  CATEGORIES,
  FEATURED_CHAINS,
  RESTAURANT_SPECIALTIES,
  TRENDING_ITEMS,
} from "@/lib/mockData";

const DIETARY_TAGS: SearchResultTag[] = [
  { id: "sintacc", name: "Opciones Sin TACC / Celíacos", type: "diet" },
  { id: "vegano", name: "Vegano / Plant Based", type: "diet" },
  { id: "vegetariano", name: "Vegetariano", type: "diet" },
  { id: "cheddar", name: "Cheddar & Bacon", type: "ingredient" },
  { id: "muzzarella", name: "Doble Muzzarella", type: "ingredient" },
  { id: "masamadre", name: "Masa Madre", type: "ingredient" },
  { id: "papas", name: "Papas Fritas", type: "ingredient" },
];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function searchCatalogAction(rawQuery: string): Promise<CatalogSearchResult> {
  const query = rawQuery.trim();
  if (!query) {
    return {
      query: "",
      stores: [],
      products: [],
      categories: [],
      tags: [],
      totalCount: 0,
    };
  }

  const qNorm = normalize(query);
  const storesMap = new Map<string, SearchResultStore>();
  const productsMap = new Map<string, SearchResultProduct>();

  try {
    const supabase = await createClient();

    // 1. Query Supabase businesses (only published / enabled)
    const { data: dbStores } = await supabase
      .from("businesses")
      .select("id, slug, name, tagline, category, logo_path, rating, reviews_count, is_open, prep_time_minutes, published")
      .eq("published", true)
      .or(`name.ilike.%${query}%,tagline.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(10);

    if (dbStores) {
      for (const s of dbStores) {
        const ratingNum = Number(s.rating) || 0;
        const reviewsNum = Number(s.reviews_count) || 0;
        const isNewStore = reviewsNum === 0 || ratingNum === 0;

        storesMap.set(s.id, {
          id: s.id,
          slug: s.slug,
          name: s.name,
          tagline: s.tagline,
          category: s.category,
          logoImage: s.logo_path ?? undefined,
          logoEmoji: s.name.slice(0, 1).toUpperCase(),
          rating: ratingNum,
          reviewsCount: reviewsNum,
          isNew: isNewStore,
          isOpen: s.is_open ?? true,
          timeEstimate: `${s.prep_time_minutes || 30} min`,
        });
      }
    }

    // 2. Query Supabase products with joined business info (only published businesses & available products)
    const { data: dbProducts } = await supabase
      .from("products")
      .select(`
        id, name, description, category, price_cents, image_path, available,
        businesses!inner(id, slug, name, logo_path, is_open, published)
      `)
      .eq("available", true)
      .eq("businesses.published", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(15);

    if (dbProducts) {
      for (const p of dbProducts) {
        const rawB = Array.isArray(p.businesses) ? p.businesses[0] : p.businesses;
        const b = rawB as unknown as {
          id: string;
          slug: string;
          name: string;
          logo_path: string | null;
          is_open: boolean | null;
          published: boolean | null;
        } | null;
        if (b && b.published) {
          productsMap.set(p.id, {
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            priceCents: p.price_cents,
            image: p.image_path ?? undefined,
            storeId: b.id,
            storeSlug: b.slug,
            storeName: b.name,
            storeIsOpen: b.is_open ?? true,
          });
        }
      }
    }
  } catch {
    // Graceful fallback to in-memory match if supabase query encounters issues
  }

  // 3. Complement with Mock Featured Chains if not already present
  for (const c of FEATURED_CHAINS) {
    if (
      normalize(c.name).includes(qNorm) ||
      normalize(c.bannerText).includes(qNorm) ||
      normalize(c.address).includes(qNorm)
    ) {
      if (!storesMap.has(c.id)) {
        storesMap.set(c.id, {
          id: c.id,
          slug: c.id,
          name: c.name,
          tagline: c.bannerText,
          category: null,
          logoImage: c.logoImage,
          logoEmoji: c.logoEmoji,
          rating: c.rating,
          reviewsCount: 15,
          isNew: false,
          isOpen: true,
          timeEstimate: c.timeEstimate,
        });
      }
    }
  }

  // 4. Complement with Mock Trending Items
  for (const item of TRENDING_ITEMS) {
    if (
      normalize(item.name).includes(qNorm) ||
      normalize(item.storeName).includes(qNorm) ||
      (item.description && normalize(item.description).includes(qNorm))
    ) {
      if (!productsMap.has(item.id)) {
        productsMap.set(item.id, {
          id: item.id,
          name: item.name,
          description: item.description ?? null,
          category: null,
          priceCents: Math.round(item.price * 100),
          image: item.image,
          storeId: item.chainId,
          storeSlug: item.chainId,
          storeName: item.storeName,
          storeIsOpen: true,
        });
      }
    }
  }

  // 5. Match Categories & Specialties
  const matchedCategories: SearchResultCategory[] = [];
  for (const cat of CATEGORIES) {
    if (normalize(cat.name).includes(qNorm)) {
      matchedCategories.push({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
      });
    }
  }
  for (const spec of RESTAURANT_SPECIALTIES) {
    if (normalize(spec.label).includes(qNorm)) {
      if (!matchedCategories.some((c) => c.id === spec.id)) {
        matchedCategories.push({
          id: spec.id,
          name: spec.label,
          icon: spec.icon,
        });
      }
    }
  }

  // 6. Match Dietary / Ingredient Tags
  const matchedTags: SearchResultTag[] = [];
  for (const tag of DIETARY_TAGS) {
    if (normalize(tag.name).includes(qNorm)) {
      matchedTags.push(tag);
    }
  }

  const stores = Array.from(storesMap.values()).slice(0, 6);
  const products = Array.from(productsMap.values()).slice(0, 10);
  const categories = matchedCategories.slice(0, 4);
  const tags = matchedTags.slice(0, 3);
  const totalCount = stores.length + products.length + categories.length + tags.length;

  return {
    query,
    stores,
    products,
    categories,
    tags,
    totalCount,
  };
}
