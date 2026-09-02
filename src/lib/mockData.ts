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
    ctaLink: "#trending",
    image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1400&q=80",
    icon: "local_shipping",
    sortOrder: 1,
    active: true,
  },
  {
    id: "2",
    title: "Burger Week en Bolívar",
    subtitle: "Doble smash beef, cheddar ahumado y panceta crocante",
    badge: "HOT DEALS",
    ctaText: "Pedir en Burger Boz",
    ctaLink: "/c/burgerboz",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1400&q=80",
    icon: "lunch_dining",
    sortOrder: 2,
    active: true,
  },
  {
    id: "3",
    title: "Noche de Pizza a la Leña",
    subtitle: "Masa madre crocante con muzzarella fior di latte artesanal",
    badge: "2X1 MARTES Y JUEVES",
    ctaText: "Pedir en Pizza Store",
    ctaLink: "/c/pizzastore",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80",
    icon: "local_pizza",
    sortOrder: 3,
    active: true,
  },
  {
    id: "4",
    title: "Hora del almuerzo",
    subtitle: "Hasta 25% OFF en menús ejecutivos y platos del día",
    badge: "12 A 15 HS",
    ctaText: "Ver empanadas",
    ctaLink: "/c/empanadas-bolivar",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=80",
    icon: "lunch_dining",
    sortOrder: 4,
    active: true,
  },
  {
    id: "5",
    title: "Café de Especialidad & Bakery",
    subtitle: "Cappuccinos cremosos, medialunas de manteca y croissants tibios",
    badge: "DESAYUNOS & MERIENDAS",
    ctaText: "Ver McCafé",
    ctaLink: "/c/mccafe",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=80",
    icon: "local_cafe",
    sortOrder: 5,
    active: true,
  },
  {
    id: "6",
    title: "Sushi World Bolívar",
    subtitle: "Combinados de salmón fresco, rolls tempura y wok oriental",
    badge: "PREMIUM ROLLS",
    ctaText: "Pedir Sushi",
    ctaLink: "/c/sushiworld",
    image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1400&q=80",
    icon: "set_meal",
    sortOrder: 6,
    active: true,
  },
  {
    id: "7",
    title: "Helados Artesanales Dolce",
    subtitle: "Potes de 1 Kg con cucuruchos de regalo directo a tu puerta",
    badge: "POSTRES",
    ctaText: "Pedir Helado",
    ctaLink: "/c/helados-dolce",
    image: "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=1400&q=80",
    icon: "icecream",
    sortOrder: 7,
    active: true,
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
