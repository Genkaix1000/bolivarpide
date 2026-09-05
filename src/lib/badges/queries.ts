import { createServiceClient } from "@/lib/supabase/service";
import { computeBestStreak, type CustomerStats } from "./engine";

type ProfileRow = {
  display_name: string | null;
  avatar_type: string | null;
  avatar_value: string | null;
  primary_address: string | null;
  identity_verified: boolean | null;
};

export async function loadOwnedBadgeIds(userId: string): Promise<string[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("user_profiles")
    .select("awarded_badges")
    .eq("user_id", userId)
    .maybeSingle();
  const row = data as { awarded_badges: { id: string }[] | null } | null;
  return (row?.awarded_badges ?? []).map((b) => b.id);
}

export async function loadCustomerStats(userId: string): Promise<CustomerStats> {
  const svc = createServiceClient();
  const [profile, addresses, favorites, deliveredOrders] = await Promise.all([
    svc
      .from("user_profiles")
      .select("display_name, avatar_type, avatar_value, primary_address, identity_verified")
      .eq("user_id", userId)
      .maybeSingle(),
    svc
      .from("user_addresses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    svc
      .from("product_likes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    svc
      .from("orders")
      .select("total_cents, delivered_at, payment_status, payment_method")
      .eq("customer_user_id", userId)
      .eq("status", "delivered"),
  ]);
  const profileRow = profile.data as ProfileRow | null;
  const salesRows = (deliveredOrders.data ?? []) as {
    total_cents: number | null;
    delivered_at: string | null;
    payment_status: string | null;
    payment_method: string | null;
  }[];

  const spentTotalCents = salesRows.reduce((acc, r) => acc + (r.total_cents ?? 0), 0);
  const paidDigitalOrders = salesRows.filter(
    (r) => r.payment_status === "paid" && r.payment_method !== "cash",
  ).length;
  const deliveredDates = salesRows
    .map((r) => r.delivered_at)
    .filter((d): d is string => !!d)
    .map((d) => d.slice(0, 10));

  return {
    profileComplete: !!(profileRow?.display_name && profileRow.avatar_type && profileRow.primary_address),
    identityVerified: !!profileRow?.identity_verified,
    addressesCount: addresses.count ?? 0,
    favoritesCount: favorites.count ?? 0,
    ordersDelivered: salesRows.length,
    spentTotalCents,
    paidDigitalOrders,
    bestStreakDays: computeBestStreak(deliveredDates),
  };
}