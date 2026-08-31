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
  image?: string;
  /** Material Symbol ligature name */
  icon: string;
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

export interface PopularChain {
  id: string;
  name: string;
  initials: string;
  color: string;
  logoImage?: string;
  timeEstimate?: string;
  rating?: number;
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

export interface BusinessStats {
  ordersToday: number;
  ordersYesterday: number;
  revenueToday: number;
  revenueYesterday: number;
  revenueMonth: number;
  revenueMonthLast: number;
  completedOrdersMonth: number;
  activeOrders: number;
  avgTicket: number;
  avgResponseTimeMin: number;
  avgPrepTimeMin: number;
}

export interface TutorialTask {
  id: string;
  label: string;
  completed: boolean;
}

export interface ActiveDriver {
  id: string;
  name: string;
  role: string;
  status: "available" | "delivering" | "offline";
  currentOrder?: number;
}

export interface DetailedOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  itemsCount: number;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paymentMethod: "Mercado Pago" | "Efectivo" | "Transferencia";
  status: "pending" | "preparing" | "delivering" | "delivered" | "cancelled";
  time: string;
  estimatedTime?: number;
  driverName?: string;
  notes?: string;
}

export interface RecentOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  itemsCount: number;
  total: number;
  status: "pending" | "accepted" | "preparing" | "delivering" | "delivered" | "cancelled";
  time: string;
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

export const CATEGORIES: Category[] = [
  { id: "kiosks", name: "Kioscos", icon: "storefront" },
  { id: "cafes", name: "Cafeterías", icon: "local_cafe" },
  { id: "restaurants", name: "Restaurantes", icon: "restaurant" },
  { id: "icecream", name: "Heladerías", icon: "icecream" },
  { id: "pharmacy", name: "Farmacias", icon: "local_pharmacy" },
  { id: "drinks", name: "Bebidas", icon: "sports_bar" },
];

export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: "1",
    title: "Envíos gratis en Bolívar",
    subtitle: "En locales adheridos a partir de $4.000",
    badge: "PROMO",
    ctaText: "Pedir ahora",
    icon: "local_shipping",
  },
  {
    id: "2",
    title: "Hora del almuerzo",
    subtitle: "Hasta 20% OFF en menú ejecutivo",
    badge: "12 a 15 HS",
    ctaText: "Ver opciones",
    icon: "lunch_dining",
  },
];

export const SPECIALTY_CATEGORIES: SpecialtyCategory[] = [
  { id: "hamburguesas", label: "Hamburguesas", icon: "lunch_dining" },
  { id: "pizzas", label: "Pizzas", icon: "local_pizza" },
  { id: "empanadas", label: "Empanadas", icon: "bakery_dining" },
  { id: "cafeteria", label: "Cafetería", icon: "local_cafe" },
  { id: "sushi", label: "Sushi", icon: "set_meal" },
  { id: "helados", label: "Helados", icon: "icecream" },
];

export const RESTAURANT_SPECIALTIES = SPECIALTY_CATEGORIES;

export const FEATURED_CHAINS: FeaturedChain[] = [];
export const TRENDING_ITEMS: TrendingItem[] = [];

export function productsForChain(chainId: string): TrendingItem[] {
  return TRENDING_ITEMS.filter((i) => i.chainId === chainId);
}

export function suggestionsForChain(chainId: string, excludeId: string, limit = 4): TrendingItem[] {
  return productsForChain(chainId).filter((i) => i.id !== excludeId).slice(0, limit);
}

export function itemNeedsSheet(item: TrendingItem): boolean {
  return Boolean(item.options?.some((o) => o.required));
}

export const POPULAR_CHAINS: PopularChain[] = [];

export const MOCK_BUSINESS: BusinessInfo = {
  name: "Pizza Store",
  initials: "PS",
  logoBg: "bg-gradient-to-br from-[#9a0002] to-[#6b0001]",
  rating: 4.7,
  reviewsCount: 128,
  isOpen: true,
  prepTimeMinutes: 20,
  chainId: "pizzastore",
  address: "Alsina 520, Bolívar, Buenos Aires",
  lat: -36.2295,
  lng: -61.1168,
  deliveryFee: 550,
  minOrder: 7000,
  followersLabel: "31.5K",
};

export const MOCK_BUSINESS_STATS: BusinessStats = {
  ordersToday: 24,
  ordersYesterday: 18,
  revenueToday: 187500,
  revenueYesterday: 142045,
  revenueMonth: 2845000,
  revenueMonthLast: 2410000,
  completedOrdersMonth: 342,
  activeOrders: 3,
  avgTicket: 7850,
  avgResponseTimeMin: 3.2,
  avgPrepTimeMin: 18.5,
};

export const MOCK_DAYS: string[] = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const MOCK_WEEKLY_SALES: number[] = [12, 19, 15, 22, 28, 35, 24];

export const MOCK_SALES_CHART = {
  today: {
    labels: ["9h", "11h", "13h", "15h", "17h", "19h", "21h"],
    delivery: [4200, 8500, 15200, 9800, 12400, 18600, 11200],
    takeaway: [800, 2100, 3200, 1800, 2400, 4100, 2200],
    orders: [3, 5, 9, 6, 7, 11, 8],
    ticket: [8200, 8400, 8100, 8600, 8800, 9000, 8750],
  },
  week: {
    labels: MOCK_DAYS,
    delivery: [52000, 68000, 61000, 84000, 102000, 128000, 115000],
    takeaway: [12000, 15000, 13000, 18000, 22000, 28000, 24000],
    orders: [12, 19, 15, 22, 28, 35, 24],
    ticket: [8200, 8400, 8100, 8600, 8800, 9000, 8750],
  },
  month: {
    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
    delivery: [320000, 380000, 410000, 450000],
    takeaway: [65000, 72000, 80000, 88000],
    orders: [85, 92, 98, 105],
    ticket: [8300, 8500, 8700, 8900],
  },
} as const;
