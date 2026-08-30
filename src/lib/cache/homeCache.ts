import type { FeaturedChain, TrendingItem } from "@/lib/mockData";

const HOME_CACHE_KEY = "bolivarpide_home_cache_v2";

export interface HomeCacheData {
  chains: FeaturedChain[];
  recommended: FeaturedChain[];
  trendingItems: TrendingItem[];
  timestamp: number;
}

/**
 * Obtiene los datos del home desde el caché de sesión/local (Stale-While-Revalidate).
 */
export function getHomeCache(): {
  chains: FeaturedChain[];
  recommended: FeaturedChain[];
  trendingItems: TrendingItem[];
} | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(HOME_CACHE_KEY) || localStorage.getItem(HOME_CACHE_KEY);
    if (!raw) return null;

    const data: HomeCacheData = JSON.parse(raw);
    if (data && Array.isArray(data.chains) && Array.isArray(data.trendingItems)) {
      return {
        chains: data.chains,
        recommended: Array.isArray(data.recommended) && data.recommended.length > 0 ? data.recommended : data.chains,
        trendingItems: data.trendingItems,
      };
    }
  } catch {
    /* ignore corrupted cache */
  }

  return null;
}

/**
 * Guarda los datos del home en sessionStorage y localStorage con timestamp.
 */
export function setHomeCache(data: {
  chains: FeaturedChain[];
  recommended: FeaturedChain[];
  trendingItems: TrendingItem[];
}): void {
  if (typeof window === "undefined") return;

  const payload: HomeCacheData = {
    ...data,
    timestamp: Date.now(),
  };

  try {
    const serialized = JSON.stringify(payload);
    sessionStorage.setItem(HOME_CACHE_KEY, serialized);
    localStorage.setItem(HOME_CACHE_KEY, serialized);
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Limpia el caché del home.
 */
export function clearHomeCache(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(HOME_CACHE_KEY);
    localStorage.removeItem(HOME_CACHE_KEY);
  } catch {
    /* ignore */
  }
}
