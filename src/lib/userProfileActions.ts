"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/userProfile";
import { profileToRow } from "@/lib/userProfileDb";

function assertDni(dni: string) {
  const digits = dni.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 8) {
    throw new Error("El DNI escaneado no es válido.");
  }
  return digits;
}

export async function saveUserProfileAction(profile: UserProfile) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== profile.id) {
    throw new Error("No autorizado");
  }

  const { data: current } = await supabase
    .from("user_profiles")
    .select("identity_verified, identity_verified_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const row = profileToRow(profile);
  // ponytail: identity only via verifyIdentityAction — clients cannot self-verify
  row.identity_verified = current?.identity_verified ?? false;
  row.identity_verified_at = current?.identity_verified_at ?? null;

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      ...row,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}

export type VerifyIdentityInput = {
  firstName: string;
  lastName: string;
  dniNumber: string;
};

export async function verifyIdentityAction(input: VerifyIdentityInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Tenés que iniciar sesión");

  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();
  const dni = assertDni(input.dniNumber);

  if (!firstName || !lastName) {
    throw new Error("Nombre y apellido del documento requeridos.");
  }

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("identity_verified")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing?.identity_verified) {
    return { alreadyVerified: true };
  }

  const now = new Date().toISOString();
  const displayName = `${firstName} ${lastName}`.trim();
  const dniHash = createHash("sha256").update(`${user.id}:${dni}`).digest("hex");

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
      identity_verified: true,
      identity_verified_at: now,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);

  // ponytail: dni_hash column when we add it; hash computed for future audit trail
  void dniHash;

  revalidatePath("/");
  return { verified: true, displayName };
}

export async function requestBusinessVerificationAction(businessId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Tenés que iniciar sesión");

  const { data: membership } = await supabase
    .from("business_members")
    .select("id, role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership || membership.role !== "owner") {
    throw new Error("Solo el dueño del local puede solicitar verificación.");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("identity_verified")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.identity_verified) {
    throw new Error("Primero verificá tu identidad con DNI en Mi perfil.");
  }

  const { data: biz } = await supabase
    .from("businesses")
    .select("verification_status, published")
    .eq("id", businessId)
    .single();
  if (!biz) throw new Error("Negocio no encontrado");
  if (biz.verification_status === "verified") {
    return { status: "verified" as const };
  }
  if (biz.verification_status === "pending_review") {
    return { status: "pending_review" as const };
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      verification_status: "pending_review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);
  if (error) throw new Error(error.message);

  revalidatePath(`/negocio/${businessId}/dashboard`);
  return { status: "pending_review" as const };
}
