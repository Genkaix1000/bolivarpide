import { BADGE_DEFINITIONS, type BadgeDefinition, type BadgeMetric } from "./definitions";

export interface CustomerStats {
  profileComplete: boolean;
  identityVerified: boolean;
  addressesCount: number;
  favoritesCount: number;
  ordersDelivered: number;
  spentTotalCents: number;
  paidDigitalOrders: number;
  bestStreakDays: number;
}

export function metricValue(stats: CustomerStats, metric: BadgeMetric): number {
  switch (metric) {
    case "profile_complete":
      return stats.profileComplete ? 1 : 0;
    case "identity_verified":
      return stats.identityVerified ? 1 : 0;
    case "addresses_count":
      return stats.addressesCount;
    case "favorites_count":
      return stats.favoritesCount;
    case "orders_delivered":
      return stats.ordersDelivered;
    case "spent_total_cents":
      return stats.spentTotalCents;
    case "paid_digital_orders":
      return stats.paidDigitalOrders;
    case "best_streak_days":
      return stats.bestStreakDays;
  }
}

export function isBadgeEarned(def: BadgeDefinition, stats: CustomerStats): boolean {
  return metricValue(stats, def.metric) >= def.target;
}

/** Máxima cantidad de días consecutivos con al menos un pedido entregado. */
export function computeBestStreak(deliveredDates: string[]): number {
  if (deliveredDates.length === 0) return 0;

  const days = [...new Set(deliveredDates)].sort();

  let best = 1;
  let current = 1;

  for (let i = 1; i < days.length; i++) {
    const prev = new Date(`${days[i - 1]}T00:00:00Z`).getTime();
    const curr = new Date(`${days[i]}T00:00:00Z`).getTime();
    const diffDays = Math.round((curr - prev) / 86_400_000);

    if (diffDays === 1) {
      current += 1;
    } else {
      current = 1;
    }
    if (current > best) best = current;
  }

  return best;
}

export function unlockedBadges(
  defs: readonly BadgeDefinition[],
  stats: CustomerStats,
  ownedIds: readonly string[],
): BadgeDefinition[] {
  const owned = new Set(ownedIds);
  return defs.filter((def) => !owned.has(def.id) && isBadgeEarned(def, stats));
}

export { BADGE_DEFINITIONS };