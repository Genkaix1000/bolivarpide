import type {
  Category,
  FeaturedChain,
  PromoBanner,
  SpecialtyCategory,
  TrendingItem,
} from "./types";

/** Categorías de la home (catálogo curado). */
export const CATEGORIES: Category[] = [
  { id: "kiosks", name: "Kioscos", icon: "storefront" },
  { id: "cafes", name: "Cafeterías", icon: "local_cafe" },
  { id: "restaurants", name: "Restaurantes", icon: "restaurant" },
  { id: "icecream", name: "Heladerías", icon: "icecream" },
  { id: "pharmacy", name: "Farmacias", icon: "local_pharmacy" },
  { id: "drinks", name: "Bebidas", icon: "sports_bar" },
];

/** Banners de la home (fallback si no hay promo_banners activos en DB). */
export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: "1",
    title: "Envíos gratis en Bolívar",
    subtitle: "En locales adheridos a partir de $4.000",
    badge: "PROMO",
    ctaText: "Pedir ahora",
    ctaLink: "#trending",
    image:
      "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1400&q=80",
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
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1400&q=80",
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
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80",
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
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=80",
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
    image:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=80",
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
    image:
      "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1400&q=80",
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
    image:
      "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=1400&q=80",
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

/** Contenido de fallback: se nutre de DB (businesses/products) en runtime. */
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