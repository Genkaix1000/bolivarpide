export interface Category {
  id: string;
  name: string;
  /** Material Symbol ligature name */
  icon: string;
  image?: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  image?: string;
  /** Material Symbol ligature name */
  icon: string;
  active?: boolean;
  sortOrder?: number;
}

export interface SpecialtyCategory {
  id: string;
  label: string;
  icon: string;
  image?: string;
}

export type ProductOptionChoice = {
  id: string;
  label: string;
  priceDelta?: number;
};

export interface ProductOption {
  id: string;
  name: string;
  required: boolean;
  /** Extras: el cliente puede marcar varios */
  multi?: boolean;
  choices: ProductOptionChoice[];
}

export interface FeaturedChain {
  id: string;
  name: string;
  bannerText: string;
  bannerBg: string;
  bannerImage?: string;
  logoEmoji: string;
  logoImage?: string;
  timeEstimate: string;
  deliveryFee: number;
  minOrder: number;
  rating: number;
  reviewsCount?: number;
  isOpen?: boolean;
  address: string;
  lat: number;
  lng: number;
}

export interface TrendingItem {
  id: string;
  name: string;
  storeName: string;
  chainId: string;
  price: number;
  emoji: string;
  image?: string;
  /** Ícono cuadrado del menú */
  iconImage?: string;
  /** Foto real del plato */
  photoImage?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  ingredients?: string[];
  options?: ProductOption[];
  storeRating?: number;
  storeReviewsCount?: number;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  storeIsOpen?: boolean;
}

export interface PanelProduct {
  id: string;
  codeId?: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  image?: string;
  soldCount?: number;
  timePlaced?: string;
  lastUpdated?: string;
}

export interface BusinessInfo {
  name: string;
  initials: string;
  logoBg: string;
  logoImage?: string;
  bannerImage?: string;
  tagline?: string;
  rating: number;
  reviewsCount: number;
  isOpen: boolean;
  prepTimeMinutes: number;
  chainId?: string;
  address: string;
  lat: number;
  lng: number;
  deliveryFee: number;
  minOrder: number;
  followersLabel: string;
}