/**
 * Run: node --experimental-strip-types src/lib/auth/guards.check.ts
 * (ponytail: one assert file for path helpers used by proxy/callback)
 */
import assert from "node:assert/strict";

function isPublicNegocio(pathname: string) {
  return (
    pathname === "/negocio/login" ||
    pathname.startsWith("/negocio/login/") ||
    pathname === "/negocio/registro" ||
    pathname.startsWith("/negocio/registro/") ||
    pathname.startsWith("/negocio/onboarding")
  );
}

function safeNextPath(next: string | null | undefined, origin?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  if (!origin) return next;
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return "/";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}

assert.equal(isPublicNegocio("/negocio/login"), true);
assert.equal(isPublicNegocio("/negocio/registro"), true);
assert.equal(isPublicNegocio("/negocio/dashboard"), false);
assert.equal(isPublicNegocio("/negocio"), false);
assert.equal(safeNextPath("/negocio", "http://localhost:3000"), "/negocio");
assert.equal(safeNextPath("https://evil.com", "http://localhost:3000"), "/");
assert.equal(safeNextPath("//evil.com", "http://localhost:3000"), "/");
assert.equal(safeNextPath("/admin?x=1", "http://localhost:3000"), "/admin?x=1");

console.log("guards.check.ts: ok");
