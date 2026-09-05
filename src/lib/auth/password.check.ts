import assert from "node:assert/strict";
import { passwordIsValid, PASSWORD_RULES } from "./password";

assert.equal(passwordIsValid("short"), false);
assert.equal(passwordIsValid("alllowercase1!"), false);
assert.equal(passwordIsValid("ALLUPPERCASE1!"), false);
assert.equal(passwordIsValid("NoDigits!!"), false);
assert.equal(passwordIsValid("NoSymbol12"), false);
assert.equal(passwordIsValid("GoodPass1!"), true);
assert.ok(PASSWORD_RULES.some((r) => r.short === "8+"));

console.log("password.check.ts: ok");