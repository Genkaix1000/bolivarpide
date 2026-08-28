"use server";

import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/userProfile";
import { profileToRow } from "@/lib/userProfileDb";

export async function saveUserProfileAction(profile: UserProfile) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== profile.id) {
    throw new Error("No autorizado");
  }

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      ...profileToRow(profile),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}
