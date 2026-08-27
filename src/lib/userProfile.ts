export type AvatarType = "character" | "initials" | "symbol" | "emoji";

export interface UserAvatar {
  type: AvatarType;
  value: string;
  frameId?: string;
  gradientId: string;
}

export type BadgeRarity = "bronce" | "plata" | "oro" | "rubi" | "diamante";

export interface UserAwardBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  emoji?: string;
  rarity: BadgeRarity;
  unlockedAt?: string;
  awardedBy?: string;
  isFeatured?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: UserAvatar;
  primaryAddress: string;
  awardedBadges: UserAwardBadge[];
  unlockedFrameIds: string[];
}

export interface ColorOption {
  id: string;
  label: string;
  color: string;
  secondaryColor?: string;
}

export interface CharacterPreset {
  id: string;
  name: string;
  description: string;
  foodTag: string;
  defaultColorId: string;
}

export interface AvatarFramePreset {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  borderClass: string;
  icon: string;
}

export interface PlaceholderIcon {
  id: string;
  name: string;
  type: "symbol" | "emoji";
  value: string;
  category: "comida" | "estilo" | "emojis";
}

export const COLOR_PALETTES: ColorOption[] = [
  {
    id: "mustard",
    label: "Mostaza Cálido",
    color: "#F59E0B",
    secondaryColor: "#D97706",
  },
  {
    id: "navy",
    label: "Azul Medianoche",
    color: "#343058",
    secondaryColor: "#252140",
  },
  {
    id: "cherry",
    label: "Cherry Cola",
    color: "#9A0002",
    secondaryColor: "#6B0001",
  },
  {
    id: "coral",
    label: "Coral Durazno",
    color: "#FB923C",
    secondaryColor: "#EA580C",
  },
  {
    id: "mint",
    label: "Verde Salvia",
    color: "#34D399",
    secondaryColor: "#059669",
  },
  {
    id: "sky",
    label: "Cielo Pastel",
    color: "#38BDF8",
    secondaryColor: "#0284C7",
  },
  {
    id: "lavender",
    label: "Lavanda Suave",
    color: "#A78BFA",
    secondaryColor: "#7C3AED",
  },
  {
    id: "cream",
    label: "Vainilla Crema",
    color: "#FDE68A",
    secondaryColor: "#F59E0B",
  },
];

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: "char-cat-sushi",
    name: "Michi Sushi Roll",
    description: "Gatito foodie deleitándose con un roll de salmón y sésamo",
    foodTag: "🍣 Michi & Sushi",
    defaultColorId: "mint",
  },
  {
    id: "char-sushi-boy",
    name: "Sushi Uramaki",
    description: "Comiendo un roll de salmón fresco con sésamo",
    foodTag: "🍣 Sushi Niño",
    defaultColorId: "mustard",
  },
  {
    id: "char-burrito-guy",
    name: "Wrap & Thumbs Up",
    description: "Con burrito completo y pulgar arriba de aprobación",
    foodTag: "🌯 Wrap & Burrito",
    defaultColorId: "navy",
  },
  {
    id: "char-bowl-girl",
    name: "Bowl Gourmet",
    description: "Disfrutando un bowl con albóndigas, papas y ensalada",
    foodTag: "🥗 Bowl Completo",
    defaultColorId: "navy",
  },
  {
    id: "char-pizza-slice",
    name: "Slice de Pizza",
    description: "Mordiendo una porción crocante con queso fundido",
    foodTag: "🍕 Pizza Pepperoni",
    defaultColorId: "cherry",
  },
  {
    id: "char-burger-double",
    name: "Doble Burger",
    description: "Saboreando una hamburguesa doble con lechuga y sésamo",
    foodTag: "🍔 Doble Burger",
    defaultColorId: "coral",
  },
  {
    id: "char-ramen-bowl",
    name: "Ramen & Palillos",
    description: "Disfrutando fideos ramen humeantes con huevo y nori",
    foodTag: "🍜 Ramen Caliente",
    defaultColorId: "mint",
  },
];

export const AVATAR_FRAMES: AvatarFramePreset[] = [
  {
    id: "none",
    name: "Sin marco",
    description: "Fondo circular limpio",
    rarity: "bronce",
    borderClass: "",
    icon: "circle",
  },
  {
    id: "frame-gold-legend",
    name: "Aura Dorada Honor",
    description: "Alas doradas con pedestal de diamante (Otorgado por fidelidad y tiempo en la app)",
    rarity: "oro",
    borderClass: "ring-4 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.55)]",
    icon: "workspace_premium",
  },
  {
    id: "frame-ruby-royale",
    name: "Aura Carmesí Gourmet",
    description: "Cresta carmesí con rubí facetado (Otorgado a grandes compradores)",
    rarity: "rubi",
    borderClass: "ring-4 ring-[#9a0002] shadow-[0_0_20px_rgba(154,0,2,0.6)]",
    icon: "military_tech",
  },
  {
    id: "frame-sapphire-explorer",
    name: "Aura Zafiro Cósmico",
    description: "Alas celestiales con brújula estelar (Otorgado a exploradores y navegantes)",
    rarity: "diamante",
    borderClass: "ring-4 ring-cyan-400 shadow-[0_0_22px_rgba(34,211,238,0.6)]",
    icon: "explore",
  },
];

export const INITIAL_AWARDED_BADGES: UserAwardBadge[] = [
  {
    id: "badge-vip-founder",
    title: "Cliente Fundador VIP",
    description: "Otorgado a los primeros miembros ilustres de la comunidad de BolivarPide.",
    icon: "military_tech",
    emoji: "👑",
    rarity: "diamante",
    unlockedAt: "Agosto 2026",
    awardedBy: "BolivarPide Oficial",
    isFeatured: true,
  },
  {
    id: "badge-gourmet-taster",
    title: "Catador Gourmet",
    description: "Reconocimiento por degustar y calificar múltiples locales de la zona.",
    icon: "stars",
    emoji: "🍣",
    rarity: "oro",
    unlockedAt: "Agosto 2026",
    awardedBy: "Comunidad Gastronómica",
    isFeatured: true,
  },
  {
    id: "badge-fast-order",
    title: "Pionero del Delivery",
    description: "Premio por realizar pedidos veloces y apoyar al comercio de barrio.",
    icon: "bolt",
    emoji: "⚡",
    rarity: "rubi",
    unlockedAt: "Agosto 2026",
    awardedBy: "Club de Repartidores",
    isFeatured: true,
  },
  {
    id: "badge-pizza-lover",
    title: "Maestro Pizzero",
    description: "Premio otorgado a los apasionados por la auténtica pizza a la piedra.",
    icon: "local_pizza",
    emoji: "🍕",
    rarity: "plata",
    unlockedAt: "Agosto 2026",
    awardedBy: "Pizzerías Unidas",
    isFeatured: false,
  },
  {
    id: "badge-sweet-tooth",
    title: "Diente Dulce",
    description: "Por no dejar pasar ningún postre ni helado en el pedido.",
    icon: "icecream",
    emoji: "🍦",
    rarity: "bronce",
    unlockedAt: "Agosto 2026",
    awardedBy: "Heladerías Locales",
    isFeatured: false,
  },
];

export const PLACEHOLDER_ICONS: PlaceholderIcon[] = [
  // Comida y Bebidas
  { id: "sym-burger", name: "Hamburguesa", type: "symbol", value: "lunch_dining", category: "comida" },
  { id: "sym-pizza", name: "Pizza", type: "symbol", value: "local_pizza", category: "comida" },
  { id: "sym-ramen", name: "Ramen", type: "symbol", value: "ramen_dining", category: "comida" },
  { id: "sym-coffee", name: "Café", type: "symbol", value: "local_cafe", category: "comida" },
  { id: "sym-icecream", name: "Helado", type: "symbol", value: "icecream", category: "comida" },
  { id: "sym-cake", name: "Torta", type: "symbol", value: "cake", category: "comida" },
  { id: "sym-croissant", name: "Panadería", type: "symbol", value: "bakery_dining", category: "comida" },
  { id: "sym-utensils", name: "Cubiertos", type: "symbol", value: "restaurant", category: "comida" },
  { id: "sym-fastfood", name: "Comida rápida", type: "symbol", value: "fastfood", category: "comida" },
  { id: "sym-cocktail", name: "Trago", type: "symbol", value: "local_bar", category: "comida" },
  { id: "sym-cookie", name: "Galleta", type: "symbol", value: "cookie", category: "comida" },
  { id: "sym-eco", name: "Saludable", type: "symbol", value: "eco", category: "comida" },

  // Estilo y Personajes
  { id: "sym-face", name: "Persona", type: "symbol", value: "face", category: "estilo" },
  { id: "sym-smile", name: "Sonrisa", type: "symbol", value: "sentiment_very_satisfied", category: "estilo" },
  { id: "sym-pets", name: "Mascota", type: "symbol", value: "pets", category: "estilo" },
  { id: "sym-gamer", name: "Gamer", type: "symbol", value: "sports_esports", category: "estilo" },
  { id: "sym-rocket", name: "Cohete", type: "symbol", value: "rocket_launch", category: "estilo" },
  { id: "sym-star", name: "Estrella", type: "symbol", value: "star", category: "estilo" },
  { id: "sym-fire", name: "Fuego", type: "symbol", value: "local_fire_department", category: "estilo" },
  { id: "sym-bolt", name: "Rayo", type: "symbol", value: "bolt", category: "estilo" },

  // Emojis
  { id: "emo-sushi", name: "Sushi", type: "emoji", value: "🍣", category: "emojis" },
  { id: "emo-burger", name: "Hamburguesa", type: "emoji", value: "🍔", category: "emojis" },
  { id: "emo-pizza", name: "Pizza", type: "emoji", value: "🍕", category: "emojis" },
  { id: "emo-taco", name: "Taco", type: "emoji", value: "🌮", category: "emojis" },
  { id: "emo-icecream", name: "Helado", type: "emoji", value: "🍦", category: "emojis" },
  { id: "emo-coffee", name: "Café", type: "emoji", value: "☕", category: "emojis" },
  { id: "emo-donut", name: "Dona", type: "emoji", value: "🍩", category: "emojis" },
  { id: "emo-avocado", name: "Palta", type: "emoji", value: "🥑", category: "emojis" },
  { id: "emo-fries", name: "Papas", type: "emoji", value: "🍟", category: "emojis" },
  { id: "emo-crown", name: "Corona", type: "emoji", value: "👑", category: "emojis" },
  { id: "emo-rocket", name: "Cohete", type: "emoji", value: "🚀", category: "emojis" },
  { id: "emo-fire", name: "Fuego", type: "emoji", value: "🔥", category: "emojis" },
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: "user-abigail",
  name: "St. Abigail",
  email: "client.abigail@delivery.com",
  avatar: {
    type: "character",
    value: "char-cat-sushi",
    frameId: "none",
    gradientId: "mint",
  },
  primaryAddress: "St. Abigail, Calle Ficticia 123",
  awardedBadges: INITIAL_AWARDED_BADGES,
  unlockedFrameIds: ["none", "frame-gold-legend", "frame-ruby-royale", "frame-sapphire-explorer"],
};

export function getColorPalette(colorId?: string): ColorOption {
  const found = COLOR_PALETTES.find((c) => c.id === colorId);
  return found || COLOR_PALETTES[0];
}

export function getRarityColor(rarity: BadgeRarity): { bg: string; text: string; border: string; glow: string } {
  switch (rarity) {
    case "diamante":
      return { bg: "bg-cyan-500/10 dark:bg-cyan-500/20", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-400/40", glow: "shadow-cyan-500/20" };
    case "rubi":
      return { bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-[#9a0002] dark:text-red-400", border: "border-red-500/40", glow: "shadow-red-500/20" };
    case "oro":
      return { bg: "bg-amber-500/10 dark:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-400/40", glow: "shadow-amber-500/20" };
    case "plata":
      return { bg: "bg-slate-500/10 dark:bg-slate-400/20", text: "text-slate-600 dark:text-slate-300", border: "border-slate-300 dark:border-slate-600", glow: "shadow-slate-500/10" };
    case "bronce":
    default:
      return { bg: "bg-orange-950/10 dark:bg-orange-950/20", text: "text-amber-800 dark:text-amber-600", border: "border-amber-700/30", glow: "shadow-amber-800/10" };
  }
}
