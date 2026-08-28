import type { UserAvatar, UserAwardBadge, UserProfile } from "@/lib/userProfile";
import { DEFAULT_USER_PROFILE } from "@/lib/userProfile";
import { createClient } from "@/lib/supabase/client";

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  avatar_type: string;
  avatar_value: string;
  avatar_gradient_id: string;
  primary_address: string;
  awarded_badges: UserAwardBadge[] | null;
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
    email: fallback.email,
    avatar: {
      type: normalizeAvatarType(row.avatar_type),
      value: row.avatar_value || "?",
      gradientId: row.avatar_gradient_id || DEFAULT_USER_PROFILE.avatar.gradientId,
    },
    primaryAddress: row.primary_address || "",
    awardedBadges: row.awarded_badges ?? [],
  };
}

export function profileToRow(profile: UserProfile): Omit<ProfileRow, "user_id"> {
  return {
    display_name: profile.name || null,
    avatar_type: profile.avatar.type,
    avatar_value: profile.avatar.value,
    avatar_gradient_id: profile.avatar.gradientId,
    primary_address: profile.primaryAddress,
    awarded_badges: profile.awardedBadges,
  };
}

export async function fetchUserProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "user_id, display_name, avatar_type, avatar_value, avatar_gradient_id, primary_address, awarded_badges",
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
