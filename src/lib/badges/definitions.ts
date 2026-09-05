import type { BadgeRarity } from "@/lib/userProfile";

export type BadgeMetric =
  | "profile_complete"
  | "identity_verified"
  | "addresses_count"
  | "favorites_count"
  | "orders_delivered"
  | "spent_total_cents"
  | "paid_digital_orders"
  | "best_streak_days";

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  emoji?: string;
  rarity: BadgeRarity;
  metric: BadgeMetric;
  target: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "perfil-completo",
    title: "Perfil completo",
    description: "Completá tu perfil con nombre, avatar y dirección.",
    icon: "badge",
    emoji: "🪪",
    rarity: "bronce",
    metric: "profile_complete",
    target: 1,
  },
  {
    id: "identidad-verificada",
    title: "Identidad verificada",
    description: "Verificá tu identidad con tu DNI en Mi perfil.",
    icon: "verified",
    emoji: "🪪",
    rarity: "plata",
    metric: "identity_verified",
    target: 1,
  },
  {
    id: "primera-direccion",
    title: "Primera dirección",
    description: "Guardá tu primer domicilio de entrega.",
    icon: "location_on",
    emoji: "📍",
    rarity: "bronce",
    metric: "addresses_count",
    target: 1,
  },
  {
    id: "primer-favorito",
    title: "Primer favorito",
    description: "Guardá tu primer plato favorito.",
    icon: "favorite",
    emoji: "❤️",
    rarity: "bronce",
    metric: "favorites_count",
    target: 1,
  },
  {
    id: "primer-pedido",
    title: "Primer pedido",
    description: "Recibí tu primer pedido entregado.",
    icon: "fastfood",
    emoji: "🍔",
    rarity: "bronce",
    metric: "orders_delivered",
    target: 1,
  },
  {
    id: "cinco-pedidos",
    title: "Cinco pedidos",
    description: "¡Cinco pedidos entregados!",
    icon: "takeout_dining",
    emoji: "🍕",
    rarity: "plata",
    metric: "orders_delivered",
    target: 5,
  },
  {
    id: "diez-pedidos",
    title: "Diez pedidos",
    description: "Diez pedidos entregados. ¡Se te da bien esto!",
    icon: "celebration",
    emoji: "🎉",
    rarity: "oro",
    metric: "orders_delivered",
    target: 10,
  },
  {
    id: "cincuenta-pedidos",
    title: "Cincuenta pedidos",
    description: "Cincuenta pedidos entregados. Cliente de ley.",
    icon: "military_tech",
    emoji: "🏅",
    rarity: "rubi",
    metric: "orders_delivered",
    target: 50,
  },
  {
    id: "gasto-100k",
    title: "$100.000 gastados",
    description: "Acumulaste $100.000 en pedidos entregados.",
    icon: "savings",
    emoji: "💸",
    rarity: "plata",
    metric: "spent_total_cents",
    target: 100_000,
  },
  {
    id: "gasto-500k",
    title: "$500.000 gastados",
    description: "Acumulaste $500.000 en pedidos entregados. ¡Impresionante!",
    icon: "account_balance_wallet",
    emoji: "💰",
    rarity: "oro",
    metric: "spent_total_cents",
    target: 500_000,
  },
  {
    id: "pago-digital",
    title: "Primer pago digital",
    description: "Pagaste tu primer pedido por Mercado Pago.",
    icon: "qr_code",
    emoji: "📱",
    rarity: "plata",
    metric: "paid_digital_orders",
    target: 1,
  },
  {
    id: "racha-3d",
    title: "Racha de 3 días",
    description: "Recibiste pedidos en 3 días consecutivos.",
    icon: "local_fire_department",
    emoji: "🔥",
    rarity: "plata",
    metric: "best_streak_days",
    target: 3,
  },
];