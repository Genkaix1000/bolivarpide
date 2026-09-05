import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type PlatformRole = "superadmin" | "soporte";

/** Resolve platform role from JWT. Legacy admin without platform_role → superadmin. */
export function getPlatformRole(user: User | null | undefined): PlatformRole | null {
  if (!user || user.app_metadata?.role !== "admin") return null;
  const pr = user.app_metadata?.platform_role;
  if (pr === "soporte") return "soporte";
  if (pr === "superadmin" || pr == null || pr === "") return "superadmin";
  return null;
}

/**
 * JWT first; if missing (sesión previa al seed SQL), mira `platform_users`.
 * No escribe claims acá — eso es teamActions / migración.
 */
export async function resolvePlatformRole(
  user: User | null | undefined,
): Promise<PlatformRole | null> {
  const fromJwt = getPlatformRole(user);
  if (fromJwt) return fromJwt;
  if (!user) return null;
  try {
    const service = createServiceClient();
    const { data } = await service
      .from("platform_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.role === "superadmin" || data?.role === "soporte") {
      return data.role;
    }
  } catch {
    // service key missing in some envs
  }
  return null;
}

export function isPlatformAdmin(user: User | null | undefined): boolean {
  return getPlatformRole(user) != null;
}

export function isPlatformSuperadmin(user: User | null | undefined): boolean {
  return getPlatformRole(user) === "superadmin";
}

export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const role = await resolvePlatformRole(user);
  if (!role) redirect("/admin/login?error=forbidden");
  return { supabase, user, platformRole: role, service: createServiceClient() };
}

export async function requirePlatformSuperadmin() {
  const ctx = await requirePlatformAdmin();
  if (ctx.platformRole !== "superadmin") redirect("/admin?error=forbidden");
  return ctx;
}
