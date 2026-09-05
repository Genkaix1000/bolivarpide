import assert from "node:assert/strict";
import { getPlatformRole, isPlatformAdmin, isPlatformSuperadmin } from "./platform";
import type { User } from "@supabase/supabase-js";

function fake(meta: Record<string, unknown>): User {
  return { id: "u1", app_metadata: meta, user_metadata: {}, aud: "a", created_at: "" } as User;
}

assert.equal(getPlatformRole(null), null);
assert.equal(getPlatformRole(fake({})), null);
assert.equal(getPlatformRole(fake({ role: "admin" })), "superadmin");
assert.equal(getPlatformRole(fake({ role: "admin", platform_role: "soporte" })), "soporte");
assert.equal(getPlatformRole(fake({ role: "admin", platform_role: "superadmin" })), "superadmin");
assert.equal(isPlatformAdmin(fake({ role: "admin", platform_role: "soporte" })), true);
assert.equal(isPlatformSuperadmin(fake({ role: "admin", platform_role: "soporte" })), false);
assert.equal(isPlatformSuperadmin(fake({ role: "admin" })), true);

console.log("platform.check.ts: ok");

