import assert from "node:assert/strict";
import { metricValue, isBadgeEarned, computeBestStreak, unlockedBadges, type CustomerStats } from "./engine";
import { BADGE_DEFINITIONS, type BadgeDefinition } from "./definitions";

const FULL_STATS: CustomerStats = {
  profileComplete: true,
  identityVerified: true,
  addressesCount: 3,
  favoritesCount: 2,
  ordersDelivered: 60,
  spentTotalCents: 250_000,
  paidDigitalOrders: 5,
  bestStreakDays: 4,
};

// metricValue
assert.equal(metricValue(FULL_STATS, "profile_complete"), 1);
assert.equal(metricValue({ ...FULL_STATS, profileComplete: false }, "profile_complete"), 0);
assert.equal(metricValue({ ...FULL_STATS, identityVerified: false }, "identity_verified"), 0);
assert.equal(metricValue({ ...FULL_STATS, addressesCount: 3 }, "addresses_count"), 3);
assert.equal(metricValue({ ...FULL_STATS, favoritesCount: 0 }, "favorites_count"), 0);
assert.equal(metricValue({ ...FULL_STATS, ordersDelivered: 5 }, "orders_delivered"), 5);
assert.equal(metricValue({ ...FULL_STATS, spentTotalCents: 250_000 }, "spent_total_cents"), 250_000);
assert.equal(metricValue({ ...FULL_STATS, paidDigitalOrders: 1 }, "paid_digital_orders"), 1);
assert.equal(metricValue({ ...FULL_STATS, bestStreakDays: 3 }, "best_streak_days"), 3);

// isBadgeEarned
assert.equal(isBadgeEarned(badge("orders_delivered", 1), { ...FULL_STATS, ordersDelivered: 1 }), true);
assert.equal(isBadgeEarned(badge("orders_delivered", 5), { ...FULL_STATS, ordersDelivered: 4 }), false);
assert.equal(isBadgeEarned(badge("orders_delivered", 50), { ...FULL_STATS, ordersDelivered: 50 }), true);
assert.equal(isBadgeEarned(badge("spent_total_cents", 100_000), { ...FULL_STATS, spentTotalCents: 99_999 }), false);
assert.equal(isBadgeEarned(badge("spent_total_cents", 100_000), { ...FULL_STATS, spentTotalCents: 100_000 }), true);
assert.equal(isBadgeEarned(badge("profile_complete", 1), { profileComplete: false } as CustomerStats), false);

// computeBestStreak
assert.equal(computeBestStreak([]), 0);
assert.equal(computeBestStreak(["2026-09-01"]), 1);
assert.equal(computeBestStreak(["2026-09-01", "2026-09-02", "2026-09-03"]), 3);
assert.equal(computeBestStreak(["2026-09-01", "2026-09-03"]), 1);
assert.equal(computeBestStreak(["2026-09-01", "2026-09-02", "2026-09-04", "2026-09-05", "2026-09-06"]), 3);
assert.equal(computeBestStreak(["2026-09-01", "2026-09-01"]), 1);
assert.equal(computeBestStreak(["2026-08-30", "2026-08-31", "2026-09-01"]), 3);

// unlockedBadges
const defs: BadgeDefinition[] = [
  badge("orders_delivered", 1),
  badge("orders_delivered", 5),
  badge("orders_delivered", 10),
];

assert.equal(unlockedBadges(defs, { ...FULL_STATS, ordersDelivered: 8 }, []).length, 2);
assert.equal(
  unlockedBadges(defs, { ...FULL_STATS, ordersDelivered: 8 }, ["badge-orders_delivered-1"]).length,
  1,
);
assert.equal(unlockedBadges(defs, { ...FULL_STATS, ordersDelivered: 0 }, []).length, 0);
assert.equal(unlockedBadges([], FULL_STATS, []).length, 0);
assert.equal(
  unlockedBadges(defs, { ...FULL_STATS, ordersDelivered: 8 }, ["badge-orders_delivered-1", "badge-orders_delivered-5"]).length,
  0,
);

// catálogo: ids únicos
const ids = BADGE_DEFINITIONS.map((d) => d.id);
assert.equal(new Set(ids).size, ids.length);

function badge(metric: BadgeDefinition["metric"], target: number): BadgeDefinition {
  return {
    id: `badge-${metric}-${target}`,
    title: "Badge",
    description: "test",
    icon: "star",
    rarity: "oro",
    metric,
    target,
  };
}

console.log("badges/engine.check.ts OK");