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
  rating: number;
}

export interface TrendingItem {
  id: string;
  name: string;
  storeName: string;
  chainId: string;
  price: number;
  emoji: string;
  image?: string;
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

/** Panel de Negocio — mock types */
export interface PanelProduct {
  id: string;
  codeId?: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  image?: string;
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
  estimatedTime?: number; // minutes
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
  /** Circular logo — recommend 512×512 */
  logoImage?: string;
  /** Cover for featured chains / store header — recommend 1200×480 (≈2.5:1) */
  bannerImage?: string;
  tagline?: string;
  rating: number;
  reviewsCount: number;
  isOpen: boolean;
  prepTimeMinutes: number;
}

export const CATEGORIES: Category[] = [
  {
    id: "kiosks",
    name: "Kioscos",
    icon: "storefront",
  },
  {
    id: "cafes",
    name: "Cafeterías",
    icon: "local_cafe",
  },
  {
    id: "restaurants",
    name: "Restaurantes",
    icon: "restaurant_menu",
  },
  {
    id: "pharmacies",
    name: "Farmacias",
    icon: "medication",
  }
];

export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: "promo-burger",
    title: "¡2x1 en Hamburguesas Smoked Beef!",
    subtitle: "Comprá una Doble Cheddar y te regalamos la otra.",
    badge: "¡2X1 HOY!",
    ctaText: "Pedir 2x1",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80",
    icon: "restaurant_menu",
  },
  {
    id: "promo-pizza",
    title: "Noche de Pizzas a la Leña",
    subtitle: "30% de descuento en pizzas de masa madre seleccionadas.",
    badge: "30% OFF",
    ctaText: "Ver Pizzas",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=80",
    icon: "local_pizza",
  },
  {
    id: "promo-coffee",
    title: "Envío Gratis en McCafé & Especialidades",
    subtitle: "Disfrutá tus combos de café con medialunas sin costo de envío.",
    badge: "ENVÍO GRATIS",
    ctaText: "Ver Cafeterías",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80",
    icon: "local_cafe",
  },
  {
    id: "promo-sushi",
    title: "Sushi Roll Combo Premium",
    subtitle: "Combinado de 30 piezas con salmón fresco y rolls autor.",
    badge: "PROMO VIP",
    ctaText: "Pedir Sushi",
    image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1000&q=80",
    icon: "set_meal",
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
    bannerText: "Croissants & Café de Especialidad",
    bannerBg: "bg-[#6d4c41]",
    bannerImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    logoEmoji: "☕",
    logoImage: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80",
    timeEstimate: "12 min",
    deliveryFee: 790.00,
    rating: 4.8
  },
  {
    id: "burgerboz",
    name: "Burger Boz",
    bannerText: "Hamburguesas 100% Smoked Beef",
    bannerBg: "bg-[#9a0002]",
    bannerImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
    logoEmoji: "🍔",
    logoImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80",
    timeEstimate: "15 min",
    deliveryFee: 650.00,
    rating: 4.6
  },
  {
    id: "pizzastore",
    name: "Pizza Store",
    bannerText: "Pizzas de Masa Madre a la Leña",
    bannerBg: "bg-[#5d4037]",
    bannerImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    logoEmoji: "🍕",
    logoImage: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=200&q=80",
    timeEstimate: "20 min",
    deliveryFee: 550.00,
    rating: 4.7
  },
  {
    id: "sushiworld",
    name: "Sushi World",
    bannerText: "Sushi Premium & Wok Oriental",
    bannerBg: "bg-[#37474f]",
    bannerImage: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80",
    logoEmoji: "🍣",
    logoImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=200&q=80",
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
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "cheese-meat-pizza",
    name: "Cheese Meat Pizza",
    storeName: "Pizza Store",
    chainId: "pizzastore",
    price: 6800.00,
    emoji: "🍕",
    image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "cappuccino-media",
    name: "Cappuccino & Medialuna",
    storeName: "McCafé",
    chainId: "mccafe",
    price: 3400.00,
    emoji: "☕",
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "salmon-combo",
    name: "Salmon Roll Combo",
    storeName: "Sushi World",
    chainId: "sushiworld",
    price: 12500.00,
    emoji: "🍣",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "double-cheddar",
    name: "Doble Cheddar Burger",
    storeName: "Burger Boz",
    chainId: "burgerboz",
    price: 6400.00,
    emoji: "🍔",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "garlic-bread",
    name: "Bastones de Ajo & Queso",
    storeName: "Pizza Store",
    chainId: "pizzastore",
    price: 2900.00,
    emoji: "🥖",
    image: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "muffin-chocolate",
    name: "Muffin de Chocolate",
    storeName: "McCafé",
    chainId: "mccafe",
    price: 1900.00,
    emoji: "🧁",
    image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "veggie-roll",
    name: "Veggie Roll Combo",
    storeName: "Sushi World",
    chainId: "sushiworld",
    price: 9800.00,
    emoji: "🍣",
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "loaded-fries",
    name: "Papas Cheddar & Bacon",
    storeName: "Burger Boz",
    chainId: "burgerboz",
    price: 4500.00,
    emoji: "🍟",
    image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80",
  }
];

export const POPULAR_CHAINS: PopularChain[] = [
  { id: "mc", name: "McDonald's", initials: "MC", color: "bg-yellow-400 text-black font-bold", logoImage: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=300&q=80", timeEstimate: "15 min", rating: 4.8 },
  { id: "bk", name: "Burger King", initials: "BK", color: "bg-orange-500 text-white font-bold", logoImage: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=300&q=80", timeEstimate: "20 min", rating: 4.7 },
  { id: "sb", name: "Starbucks", initials: "SB", color: "bg-green-600 text-white font-bold", logoImage: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80", timeEstimate: "12 min", rating: 4.9 },
  { id: "sw", name: "Subway", initials: "SW", color: "bg-emerald-400 text-black font-bold", logoImage: "https://images.unsplash.com/photo-1626078436896-f94d93051493?auto=format&fit=crop&w=300&q=80", timeEstimate: "15 min", rating: 4.5 },
  { id: "kf", name: "KFC", initials: "KF", color: "bg-red-600 text-white font-bold", logoImage: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=300&q=80", timeEstimate: "22 min", rating: 4.6 }
];

/** Panel de Negocio — mock data */
/** Simulated panel business — reuses Pizza Store assets from FEATURED_CHAINS */
export const MOCK_BUSINESS: BusinessInfo = {
  name: "Pizzería & Café Don Luis",
  initials: "DL",
  logoBg: "bg-gradient-to-br from-[#9a0002] to-[#6b0001]",
  logoImage: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=200&q=80",
  bannerImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
  tagline: "Pizzas de Masa Madre a la Leña",
  rating: 4.9,
  reviewsCount: 128,
  isOpen: true,
  prepTimeMinutes: 25,
};

export const MOCK_BUSINESS_STATS: BusinessStats = {
  ordersToday: 24,
  ordersYesterday: 18,
  revenueToday: 187500,
  revenueYesterday: 142045,
  revenueMonth: 2845000,
  revenueMonthLast: 2410000,
  completedOrdersMonth: 342,
  activeOrders: 5,
  avgTicket: 8318,
  avgResponseTimeMin: 3.2,
  avgPrepTimeMin: 18.5,
};

export const MOCK_TUTORIAL_TASKS: TutorialTask[] = [
  { id: "profile", label: "Logo y portada cargados en buena calidad", completed: true },
  { id: "menu", label: "Menú o carta cargada (min 5 productos)", completed: true },
  { id: "qr", label: "Menú QR generado e impreso", completed: true },
  { id: "promos", label: "Primera promoción de bienvenida creada", completed: false },
  { id: "logistics", label: "Al menos 1 repartidor/delivery asociado", completed: true },
];

export const MOCK_DRIVERS: ActiveDriver[] = [
  { id: "drv-1", name: "Franco Benítez", role: "Repartidor Local", status: "delivering", currentOrder: 1041 },
  { id: "drv-2", name: "Matías Rossi", role: "Repartidor Local", status: "available" },
  { id: "drv-3", name: "Gonzalo López", role: "Cadete Propio", status: "delivering", currentOrder: 1040 },
];

export const MOCK_RECENT_ORDERS: RecentOrder[] = [
  { id: "ord-1", orderNumber: 1043, customerName: "Valentina Paz", itemsCount: 3, total: 9800, status: "pending", time: "18:52" },
  { id: "ord-2", orderNumber: 1042, customerName: "Juan Pérez", itemsCount: 2, total: 6400, status: "preparing", time: "18:40" },
  { id: "ord-3", orderNumber: 1041, customerName: "María Gómez", itemsCount: 4, total: 11200, status: "delivering", time: "18:32" },
  { id: "ord-4", orderNumber: 1040, customerName: "Lucas Fernández", itemsCount: 5, total: 14500, status: "delivered", time: "18:15" },
  { id: "ord-5", orderNumber: 1039, customerName: "Sofía Álvarez", itemsCount: 1, total: 3200, status: "cancelled", time: "17:50" },
];

export const MOCK_DETAILED_ORDERS: DetailedOrder[] = [
  {
    id: "ord-6",
    orderNumber: 1044,
    customerName: "Camila Torres",
    customerPhone: "2314-770184",
    deliveryAddress: "Mitre 218",
    itemsCount: 2,
    items: [
      { name: "Pizza Napolitana con Aceitunas", qty: 1, price: 7400 },
      { name: "Coca-Cola 1.5L", qty: 1, price: 2200 },
    ],
    total: 9600,
    paymentMethod: "Mercado Pago",
    status: "pending",
    time: "18:55",
  },
  {
    id: "ord-1",
    orderNumber: 1043,
    customerName: "Valentina Paz",
    customerPhone: "2314-558291",
    deliveryAddress: "Av. San Martín 452, Piso 2A",
    itemsCount: 3,
    items: [
      { name: "Pizza Muzzarella Gigante", qty: 1, price: 6800 },
      { name: "Empanadas de Carne Cortada a Cuchillo", qty: 2, price: 1500 },
    ],
    total: 9800,
    paymentMethod: "Mercado Pago",
    status: "pending",
    time: "18:52",
    notes: "Por favor enviar servilletas y aderezos.",
  },
  {
    id: "ord-2",
    orderNumber: 1042,
    customerName: "Juan Pérez",
    customerPhone: "2314-412093",
    deliveryAddress: "General Paz 890",
    itemsCount: 2,
    items: [
      { name: "Hamburguesa Doble Cheddar con Papas", qty: 1, price: 5200 },
      { name: "Gaseosa 500ml", qty: 1, price: 1200 },
    ],
    total: 6400,
    paymentMethod: "Efectivo",
    status: "preparing",
    estimatedTime: 20,
    time: "18:40",
  },
  {
    id: "ord-5",
    orderNumber: 1038,
    customerName: "Diego Ruiz",
    customerPhone: "2314-334871",
    deliveryAddress: "Sarmiento 77, Local 4",
    itemsCount: 8,
    items: [
      { name: "Empanada Carne Cuchillo", qty: 6, price: 1500 },
      { name: "Agua Mineral sin Gas 500ml", qty: 2, price: 900 },
    ],
    total: 10800,
    paymentMethod: "Efectivo",
    status: "preparing",
    estimatedTime: 15,
    time: "18:28",
    notes: "Sin aceitunas.",
  },
  {
    id: "ord-3",
    orderNumber: 1041,
    customerName: "María Gómez",
    customerPhone: "2314-993182",
    deliveryAddress: "Alvear 1240",
    itemsCount: 4,
    items: [
      { name: "Pizza Especial Don Luis", qty: 1, price: 8200 },
      { name: "Bastones de Muzzarella", qty: 1, price: 3000 },
    ],
    total: 11200,
    paymentMethod: "Transferencia",
    status: "delivering",
    driverName: "Franco Benítez",
    time: "18:32",
  },
  {
    id: "ord-4",
    orderNumber: 1040,
    customerName: "Lucas Fernández",
    customerPhone: "2314-118492",
    deliveryAddress: "Belgrano 312",
    itemsCount: 5,
    items: [
      { name: "Lomito Completo", qty: 2, price: 11000 },
      { name: "Papas Rústicas", qty: 1, price: 3500 },
    ],
    total: 14500,
    paymentMethod: "Mercado Pago",
    status: "delivered",
    driverName: "Gonzalo López",
    time: "18:15",
  },
];

export const MOCK_PRODUCTS: PanelProduct[] = [
  { id: "prod-1",  codeId: "3457283094", name: "Pizza Muzzarella Gigante",          category: "Pizzas",       price: 6800,  available: true,  image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", timePlaced: "10/15/2025 02:40 PM", lastUpdated: "01/16/2026 11:30 AM" },
  { id: "prod-2",  codeId: "1234509876", name: "Pizza Especial Don Luis",            category: "Pizzas",       price: 8200,  available: true,  image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80", timePlaced: "02/28/2025 05:30 PM", lastUpdated: "02/28/2026 05:30 PM" },
  { id: "prod-3",  codeId: "9876543210", name: "Pizza Napolitana con Aceitunas",     category: "Pizzas",       price: 7400,  available: false, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80", timePlaced: "01/16/2025 11:30 AM", lastUpdated: "03/10/2026 09:30 AM" },
  { id: "prod-4",  codeId: "3457283095", name: "Empanada Carne Cuchillo",            category: "Empanadas",    price: 1500,  available: true,  image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80", timePlaced: "10/15/2025 02:40 PM", lastUpdated: "01/16/2026 11:30 AM" },
  { id: "prod-5",  codeId: "4567891230", name: "Empanada Pollo y Verdura",           category: "Empanadas",    price: 1400,  available: true,  image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80", timePlaced: "11/04/2025 01:15 PM", lastUpdated: "02/01/2026 10:20 AM" },
  { id: "prod-6",  codeId: "7891234560", name: "Hamburguesa Doble Cheddar",          category: "Hamburguesas", price: 5200,  available: true,  image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", timePlaced: "01/16/2025 11:30 AM", lastUpdated: "03/10/2026 09:30 AM" },
  { id: "prod-7",  codeId: "3457283096", name: "Hamburguesa Crispy Chicken",         category: "Hamburguesas", price: 4800,  available: true,  image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80", timePlaced: "10/15/2025 02:40 PM", lastUpdated: "01/16/2026 11:30 AM" },
  { id: "prod-8",  codeId: "1234509877", name: "Lomito Completo",                    category: "Sándwiches",   price: 5500,  available: false, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80", timePlaced: "01/16/2025 11:30 AM", lastUpdated: "03/10/2026 09:30 AM" },
  { id: "prod-9",  codeId: "5678901234", name: "Sándwich Caprese con Rúcula",        category: "Sándwiches",   price: 4100,  available: true,  image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=600&q=80", timePlaced: "10/15/2025 02:40 PM", lastUpdated: "01/16/2026 11:30 AM" },
  { id: "prod-10", codeId: "3457283097", name: "Torta Oreo",                         category: "Postres",      price: 3800,  available: true,  image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80", timePlaced: "10/15/2025 02:40 PM", lastUpdated: "01/16/2026 11:30 AM" },
  { id: "prod-11", codeId: "1234509878", name: "Tiramisú Casero",                    category: "Postres",      price: 4200,  available: true,  image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80", timePlaced: "02/28/2025 05:30 PM", lastUpdated: "02/28/2026 05:30 PM" },
  { id: "prod-12", codeId: "8901234567", name: "Papas Rústicas",                     category: "Guarniciones", price: 3500,  available: true,  image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80", timePlaced: "10/15/2025 02:40 PM", lastUpdated: "01/16/2026 11:30 AM" },
  { id: "prod-13", codeId: "3457283098", name: "Bastones de Muzzarella",             category: "Guarniciones", price: 3000,  available: false, image: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=600&q=80", timePlaced: "10/15/2025 02:40 PM", lastUpdated: "01/16/2026 11:30 AM" },
  { id: "prod-14", codeId: "2345678901", name: "Coca-Cola 1.5L",                     category: "Bebidas",      price: 2200,  available: true,  image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80", timePlaced: "10/15/2025 02:40 PM", lastUpdated: "02/28/2026 05:30 PM" },
  { id: "prod-15", codeId: "6789012345", name: "Agua Mineral sin Gas 500ml",         category: "Bebidas",      price: 900,   available: true,  image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=80", timePlaced: "10/15/2025 02:40 PM", lastUpdated: "02/28/2026 05:30 PM" },
];

export const MOCK_DAYS: string[] = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const MOCK_WEEKLY_SALES: number[] = [12, 19, 15, 22, 28, 35, 24];
