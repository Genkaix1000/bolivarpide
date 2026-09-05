import assert from "node:assert/strict";
import { isPublicNegocio, safeNextPath } from "./paths";

assert.equal(isPublicNegocio("/negocio/login"), true);
assert.equal(isPublicNegocio("/negocio/registro"), true);
assert.equal(isPublicNegocio("/negocio/dashboard"), false);
assert.equal(isPublicNegocio("/negocio"), false);
assert.equal(safeNextPath("/negocio", "http://localhost:3000"), "/negocio");
assert.equal(safeNextPath("https://evil.com", "http://localhost:3000"), "/");
assert.equal(safeNextPath("//evil.com", "http://localhost:3000"), "/");
assert.equal(safeNextPath("/admin?x=1", "http://localhost:3000"), "/admin?x=1");

console.log("guards.check.ts: ok");