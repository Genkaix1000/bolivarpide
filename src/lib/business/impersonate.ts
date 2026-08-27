import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

const COOKIE = "impersonate_business_id";

export async function startImpersonation(businessId: string) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") throw new Error("Forbidden");

  const jar = await cookies();
  jar.set(COOKIE, businessId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });

  const service = createServiceClient();
  await service.from("admin_audit_log").insert({
    actor_user_id: user.id,
    action: "impersonate_start",
    target_type: "business",
    target_id: businessId,
  });
}

export async function endImpersonation() {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const jar = await cookies();
  const businessId = jar.get(COOKIE)?.value;
  jar.delete(COOKIE);
  if (user && businessId) {
    const service = createServiceClient();
    await service.from("admin_audit_log").insert({
      actor_user_id: user.id,
      action: "impersonate_end",
      target_type: "business",
      target_id: businessId,
    });
  }
}

export async function getImpersonationBusinessId() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}
