"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperadmin } from "@/lib/admin/platform";
import { writeAdminAudit } from "@/lib/admin/audit";

const COOKIE = "impersonate_business_id";
const TTL_S = 3600;

function secret() {
  return (
    process.env.IMPERSONATE_COOKIE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-insecure-impersonate"
  );
}

function sign(payload: string) {
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verify(token: string): { businessId: string; actorId: string; exp: number } | null {
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const [businessId, actorId, expStr] = payload.split(":");
  const exp = Number(expStr);
  if (!businessId || !actorId || !Number.isFinite(exp) || exp < Date.now() / 1000) return null;
  return { businessId, actorId, exp };
}

export async function startImpersonation(businessId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformSuperadmin(user)) throw new Error("Forbidden");

  const exp = Math.floor(Date.now() / 1000) + TTL_S;
  const token = sign(`${businessId}:${user.id}:${exp}`);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_S,
    secure: process.env.NODE_ENV === "production",
  });

  const service = createServiceClient();
  const { data: biz } = await service.from("businesses").select("name").eq("id", businessId).maybeSingle();
  await writeAdminAudit({
    actorUserId: user.id,
    action: "impersonate_start",
    targetType: "business",
    targetId: businessId,
    meta: { business_name: biz?.name ?? null },
  });
}

export async function endImpersonation() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  const parsed = raw ? verify(raw) : null;
  jar.delete(COOKIE);
  if (user && parsed) {
    await writeAdminAudit({
      actorUserId: user.id,
      action: "impersonate_end",
      targetType: "business",
      targetId: parsed.businessId,
      meta: { duration_s: Math.max(0, Math.floor(TTL_S - (parsed.exp - Date.now() / 1000))) },
    });
  }
}

/** Valid impersonation target for the current superadmin, or null. */
export async function getImpersonationBusinessId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformSuperadmin(user)) return null;
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const parsed = verify(raw);
  if (!parsed || parsed.actorId !== user.id) return null;
  return parsed.businessId;
}
