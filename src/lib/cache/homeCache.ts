import type { FeaturedChain, TrendingItem } from "@/lib/mockData";

const HOME_CACHE_KEY = "bolivarpide_home_cache_v3";
/** Stale-while-revalidate en cliente: pasado el TTL se ignora y se vuelve a fetchear. */
export const HOME_CACHE_TTL_MS = 5 * 60 * 1000;

export interface HomeCacheData {
  chains: FeaturedChain[];
  recommended: FeaturedChain[];
  trendingItems: TrendingItem[];
  timestamp: number;
}

/**
 * Lee el caché de Home (localStorage + TTL).
 */
export function getHomeCache(): {
  chains: FeaturedChain[];
  recommended: FeaturedChain[];
  trendingItems: TrendingItem[];
} | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(HOME_CACHE_KEY);
    if (!raw) return null;

    const data: HomeCacheData = JSON.parse(raw);
    if (!data?.timestamp || Date.now() - data.timestamp > HOME_CACHE_TTL_MS) {
      localStorage.removeItem(HOME_CACHE_KEY);
      return null;
    }
    if (!Array.isArray(data.chains) || !Array.isArray(data.trendingItems)) return null;

    return {
      chains: data.chains,
      recommended:
        Array.isArray(data.recommended) && data.recommended.length > 0
          ? data.recommended
          : data.chains,
      trendingItems: data.trendingItems,
    };
  } catch {
    return null;
  }
}

/**
 * Guarda el caché de Home en localStorage.
 */
export function setHomeCache(data: {
  chains: FeaturedChain[];
  recommended: FeaturedChain[];
  trendingItems: TrendingItem[];
}): void {
  if (typeof window === "undefined") return;

  try {
    const payload: HomeCacheData = { ...data, timestamp: Date.now() };
    localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function clearHomeCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HOME_CACHE_KEY);
    // limpieza de claves viejas (session + v2)
    sessionStorage.removeItem("bolivarpide_home_cache_v2");
    localStorage.removeItem("bolivarpide_home_cache_v2");
  } catch {
    /* ignore */
  }
}
