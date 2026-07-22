export interface Category {
  id: string;
  name: string;
  /** Material Symbol ligature name */
  icon: string;
  /** @deprecated use `icon` — kept for gradual migration */
  emoji: string;
  bgColor: string;
  textColor: string;
  activeBgColor: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  /** Material Symbol ligature name */
  icon: string;
  /** @deprecated use `icon` */
  emoji: string;
  gradient: string;
}

export interface SpecialtyCategory {
  id: string;
  label: string;
  icon: string;
}

export interface FeaturedChain {
  id: string;
  name: string;
  bannerText: string;
  bannerBg: string;
  logoEmoji: string;
  logoBg: string;
  timeEstimate: string;
  deliveryFee: number;
  rating: number;
}

export interface TrendingItem {
  id: string;
  name: string;
  storeName: string;
  chainId: string;
  price: number;
  emoji: string;
  bgColor: string;
}

export interface PopularChain {
  id: string;
  initials: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "kiosks",
    name: "Kioscos",
    icon: "storefront",
    emoji: "storefront",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    textColor: "text-orange-600 dark:text-orange-400",
    activeBgColor: "bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-800"
  },
  {
    id: "cafes",
    name: "Cafeterías",
    icon: "local_cafe",
    emoji: "local_cafe",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    textColor: "text-purple-600 dark:text-purple-400",
    activeBgColor: "bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800"
  },
  {
    id: "restaurants",
    name: "Restaurantes",
    icon: "restaurant_menu",
    emoji: "restaurant_menu",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    textColor: "text-red-600 dark:text-red-400",
    activeBgColor: "bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800"
  },
  {
    id: "pharmacies",
    name: "Farmacias",
    icon: "medication",
    emoji: "medication",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    textColor: "text-cyan-600 dark:text-cyan-400",
    activeBgColor: "bg-cyan-100 dark:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-800"
  }
];

export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: "promo-burger",
    title: "¡Promo 2x1 en Hamburguesas!",
    subtitle: "Comprá una y te regalamos la otra. Disponible hoy.",
    icon: "restaurant_menu",
    emoji: "restaurant_menu",
    gradient: "from-[#9a0002] to-[#6b0001]"
  },
  {
    id: "promo-coffee",
    title: "Envío Gratis en Cafeterías",
    subtitle: "Disfrutá tus desayunos favoritos sin costo de envío.",
    icon: "local_cafe",
    emoji: "local_cafe",
    gradient: "from-[#ff9800] to-[#6b0001]"
  },
  {
    id: "promo-pharmacy",
    title: "Farmacia 24hs Cerca Tuyo",
    subtitle: "Medicamentos y cuidado personal directo a tu puerta.",
    icon: "medication",
    emoji: "medication",
    gradient: "from-[#00bcd4] to-[#009688]"
  }
];

/** Especialidades de restaurante — compartidas con /negocio/registro */
export const RESTAURANT_SPECIALTIES: SpecialtyCategory[] = [
  { id: "empanadas", label: "Empanadas", icon: "ramen_dining" },
  { id: "hamburguesas", label: "Hamburguesas", icon: "lunch_dining" },
  { id: "pizza", label: "Pizza", icon: "local_pizza" },
  { id: "sushi", label: "Sushi", icon: "set_meal" },
  { id: "helados", label: "Helados", icon: "icecream" },
  { id: "asado", label: "Asado", icon: "outdoor_grill" },
  { id: "italiana", label: "Italiana", icon: "dinner_dining" },
  { id: "cafe", label: "Café", icon: "local_cafe" },
  { id: "panaderia", label: "Panadería", icon: "bakery_dining" },
  { id: "saludable", label: "Saludable", icon: "spa" },
  { id: "sandwiches", label: "Sándwiches", icon: "lunch_dining" },
  { id: "vegetariana", label: "Vegetariana", icon: "eco" },
  { id: "desayunos_meriendas", label: "Desayunos", icon: "breakfast_dining" },
  { id: "jugos", label: "Jugos", icon: "local_drink" },
  { id: "mexicana", label: "Mexicana", icon: "restaurant" },
  { id: "milanesas", label: "Milanesas", icon: "dinner_dining" },
  { id: "asiatica", label: "Asiática", icon: "ramen_dining" },
  { id: "pollo", label: "Pollo", icon: "kebab_dining" },
  { id: "postres", label: "Postres", icon: "cake" },
  { id: "internacional", label: "Internacional", icon: "public" },
  { id: "peruana", label: "Peruana", icon: "public" },
  { id: "pescados", label: "Pescados", icon: "set_meal" },
  { id: "arabe", label: "Árabe", icon: "restaurant" },
  { id: "hot_dogs", label: "Hot Dogs", icon: "lunch_dining" },
  { id: "argentina", label: "Argentina", icon: "flag" },
];

export const FEATURED_CHAINS: FeaturedChain[] = [
  {
    id: "mccafe",
    name: "McCafé",
    bannerText: "Croissants & Coffee",
    bannerBg: "bg-gradient-to-r from-amber-800 to-yellow-600",
    logoEmoji: "☕",
    logoBg: "bg-amber-100 dark:bg-amber-950/40",
    timeEstimate: "12 min",
    deliveryFee: 790.00,
    rating: 4.8
  },
  {
    id: "burgerboz",
    name: "Burger Boz",
    bannerText: "Las Mejores Hamburguesas",
    bannerBg: "bg-gradient-to-r from-red-700 to-amber-600",
    logoEmoji: "🍔",
    logoBg: "bg-red-100 dark:bg-red-950/40",
    timeEstimate: "15 min",
    deliveryFee: 650.00,
    rating: 4.6
  },
  {
    id: "pizzastore",
    name: "Pizza Store",
    bannerText: "Pizzas de Masa Madre",
    bannerBg: "bg-gradient-to-r from-orange-600 to-yellow-600",
    logoEmoji: "🍕",
    logoBg: "bg-orange-100 dark:bg-orange-950/40",
    timeEstimate: "20 min",
    deliveryFee: 550.00,
    rating: 4.7
  },
  {
    id: "sushiworld",
    name: "Sushi World",
    bannerText: "Sushi Premium & Wok",
    bannerBg: "bg-gradient-to-r from-indigo-900 to-purple-800",
    logoEmoji: "🍣",
    logoBg: "bg-indigo-100 dark:bg-indigo-950/40",
    timeEstimate: "25 min",
    deliveryFee: 890.00,
    rating: 4.9
  }
];

export const TRENDING_ITEMS: TrendingItem[] = [
  {
    id: "burger-anjaz",
    name: "Burger Beef 'Anjaz'",
    storeName: "Burger Boz",
    chainId: "burgerboz",
    price: 5900.00,
    emoji: "🍔",
    bgColor: "bg-amber-50 dark:bg-amber-950/30"
  },
  {
    id: "cheese-meat-pizza",
    name: "Cheese Meat Pizza",
    storeName: "Pizza Store",
    chainId: "pizzastore",
    price: 6800.00,
    emoji: "🍕",
    bgColor: "bg-orange-50 dark:bg-orange-950/30"
  },
  {
    id: "cappuccino-media",
    name: "Cappuccino & Medialuna",
    storeName: "McCafé",
    chainId: "mccafe",
    price: 3400.00,
    emoji: "☕",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30"
  },
  {
    id: "salmon-combo",
    name: "Salmon Roll Combo",
    storeName: "Sushi World",
    chainId: "sushiworld",
    price: 12500.00,
    emoji: "🍣",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30"
  },
  {
    id: "double-cheddar",
    name: "Doble Cheddar Burger",
    storeName: "Burger Boz",
    chainId: "burgerboz",
    price: 6400.00,
    emoji: "🍔",
    bgColor: "bg-red-50 dark:bg-red-950/30"
  },
  {
    id: "garlic-bread",
    name: "Bastones de Ajo",
    storeName: "Pizza Store",
    chainId: "pizzastore",
    price: 2900.00,
    emoji: "🥖",
    bgColor: "bg-amber-50 dark:bg-amber-950/30"
  },
  {
    id: "muffin-chocolate",
    name: "Muffin de Chocolate",
    storeName: "McCafé",
    chainId: "mccafe",
    price: 1900.00,
    emoji: "🧁",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30"
  },
  {
    id: "veggie-roll",
    name: "Veggie Roll Combo",
    storeName: "Sushi World",
    chainId: "sushiworld",
    price: 9800.00,
    emoji: "🍣",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30"
  },
  {
    id: "loaded-fries",
    name: "Papas Cheddar & Bacon",
    storeName: "Burger Boz",
    chainId: "burgerboz",
    price: 4500.00,
    emoji: "🍟",
    bgColor: "bg-red-50 dark:bg-red-950/30"
  }
];

export const POPULAR_CHAINS: PopularChain[] = [
  { id: "mc", initials: "MC", color: "bg-yellow-400 text-black font-bold" },
  { id: "bk", initials: "BK", color: "bg-orange-500 text-white font-bold" },
  { id: "sb", initials: "SB", color: "bg-green-600 text-white font-bold" },
  { id: "sw", initials: "SW", color: "bg-emerald-400 text-black font-bold" },
  { id: "kf", initials: "KF", color: "bg-red-600 text-white font-bold" }
];
