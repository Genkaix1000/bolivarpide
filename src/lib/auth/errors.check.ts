/**
 * Run: node --experimental-strip-types src/lib/auth/errors.check.ts
 */
import assert from "node:assert/strict";
import { authErrorEs } from "./errors";

assert.equal(
  authErrorEs({ message: "email rate limit exceeded" }),
  "Superaste el límite de emails. Esperá un rato e intentá de nuevo.",
);
assert.equal(
  authErrorEs({ code: "invalid_credentials", message: "Invalid login credentials" }),
  "Email o contraseña incorrectos.",
);
assert.equal(
  authErrorEs({ message: "Email signups are disabled" }),
  "El registro por email está deshabilitado.",
);
assert.equal(authErrorEs(null), "Error inesperado.");
console.log("errors.check.ts: ok");
