"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/paths";

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(String(formData.get("next") || "/"));
  const supabase = await createClient();
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error || !data.url) {
    throw new Error(error?.message ?? "No se pudo iniciar OAuth");
  }

  redirect(data.url);
}

export async function signOut(formData: FormData) {
  const next = safeNextPath(String(formData.get("next") || "/"));
  const supabase = await createClient();
  await supabase.auth.signOut();
  const sep = next.includes("?") ? "&" : "?";
  redirect(`${next}${sep}toast=logout`);
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const next = safeNextPath(String(formData.get("next") || "/"));
  const supabase = await createClient();
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const changePath = `/auth/nueva-password?next=${encodeURIComponent(next)}`;
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(changePath)}`;
  const base = `/auth/olvide-pass?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    redirect(`${base}&error=${encodeURIComponent(error.message)}`);
  }
  redirect(`${base}&enviado=1&email=${encodeURIComponent(email)}`);
}
