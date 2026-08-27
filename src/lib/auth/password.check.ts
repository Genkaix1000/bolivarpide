/**
 * Run: node --experimental-strip-types src/lib/auth/password.check.ts
 */
import assert from "node:assert/strict";

const PASSWORD_RULES = [
  { id: "len", label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { id: "lower", label: "Una minúscula (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { id: "upper", label: "Una mayúscula (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { id: "digit", label: "Un número (0-9)", test: (p: string) => /\d/.test(p) },
  {
    id: "symbol",
    label: "Un símbolo (!@#$…)",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
] as const;

function unmetPasswordRules(password: string) {
  return PASSWORD_RULES.filter((r) => !r.test(password));
}

function passwordIsValid(password: string) {
  return unmetPasswordRules(password).length === 0;
}

assert.equal(passwordIsValid("short"), false);
assert.equal(passwordIsValid("alllowercase1!"), false);
assert.equal(passwordIsValid("ALLUPPERCASE1!"), false);
assert.equal(passwordIsValid("NoDigits!!"), false);
assert.equal(passwordIsValid("NoSymbol12"), false);
assert.equal(passwordIsValid("GoodPass1!"), true);
console.log("password.check.ts: ok");
