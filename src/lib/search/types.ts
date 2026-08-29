export interface SearchResultStore {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  category: string | null;
  logoImage?: string;
  logoEmoji?: string;
  rating: number;
  reviewsCount: number;
  isNew: boolean;
  isOpen: boolean;
  timeEstimate: string;
}

export interface SearchResultProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  priceCents: number;
  image?: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  storeIsOpen: boolean;
}

export interface SearchResultCategory {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

export interface SearchResultTag {
  id: string;
  name: string;
  type: "diet" | "ingredient";
  count?: number;
}

export interface CatalogSearchResult {
  query: string;
  stores: SearchResultStore[];
  products: SearchResultProduct[];
  categories: SearchResultCategory[];
  tags: SearchResultTag[];
  totalCount: number;
}
