import type { UserAvatar, UserAwardBadge, UserProfile } from "@/lib/userProfile";
import { DEFAULT_USER_PROFILE } from "@/lib/userProfile";
import { createClient } from "@/lib/supabase/client";

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_type: string;
  avatar_value: string;
  avatar_gradient_id: string;
  primary_address: string;
  awarded_badges: UserAwardBadge[] | null;
  identity_verified: boolean | null;
  identity_verified_at: string | null;
  notification_orders: boolean | null;
  notification_promos: boolean | null;
  notification_whatsapp: boolean | null;
  preferred_payment_method: string | null;
};

export function normalizeAvatarType(type: string): UserAvatar["type"] {
  if (type === "symbol" || type === "emoji" || type === "initials") return type;
  return "initials";
}

export function rowToProfile(
  row: ProfileRow,
  fallback: { name: string; email: string },
): UserProfile {
  return {
    id: row.user_id,
    name: row.display_name?.trim() || fallback.name,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    phone: row.phone || "",
    email: fallback.email,
    avatar: {
      type: normalizeAvatarType(row.avatar_type),
      value: row.avatar_value || "?",
      gradientId: row.avatar_gradient_id || DEFAULT_USER_PROFILE.avatar.gradientId,
    },
    primaryAddress: row.primary_address || "",
    awardedBadges: row.awarded_badges ?? [],
    identityVerified: !!row.identity_verified,
    identityVerifiedAt: row.identity_verified_at || null,
    notificationOrders: row.notification_orders ?? true,
    notificationPromos: row.notification_promos ?? false,
    notificationWhatsapp: row.notification_whatsapp ?? true,
    preferredPaymentMethod: (row.preferred_payment_method as UserProfile["preferredPaymentMethod"]) || "cash",
  };
}

export function profileToRow(profile: UserProfile): Omit<ProfileRow, "user_id"> {
  return {
    display_name: profile.name || null,
    first_name: profile.firstName || null,
    last_name: profile.lastName || null,
    phone: profile.phone || null,
    avatar_type: profile.avatar.type,
    avatar_value: profile.avatar.value,
    avatar_gradient_id: profile.avatar.gradientId,
    primary_address: profile.primaryAddress,
    awarded_badges: profile.awardedBadges,
    identity_verified: profile.identityVerified ?? false,
    identity_verified_at: profile.identityVerifiedAt || null,
    notification_orders: profile.notificationOrders ?? true,
    notification_promos: profile.notificationPromos ?? false,
    notification_whatsapp: profile.notificationWhatsapp ?? true,
    preferred_payment_method: profile.preferredPaymentMethod || "cash",
  };
}

export async function fetchUserProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "user_id, display_name, first_name, last_name, phone, avatar_type, avatar_value, avatar_gradient_id, primary_address, awarded_badges, identity_verified, identity_verified_at, notification_orders, notification_promos, notification_whatsapp, preferred_payment_method",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export async function saveUserProfile(profile: UserProfile) {
  if (profile.id === "guest") return;
  const supabase = createClient();
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: profile.id,
      ...profileToRow(profile),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
