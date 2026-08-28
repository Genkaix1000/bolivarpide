/**
 * Run: node --experimental-strip-types src/lib/userProfileDb.check.ts
 */
import assert from "node:assert/strict";

function normalizeAvatarType(type: string) {
  if (type === "symbol" || type === "emoji" || type === "initials") return type;
  return "initials";
}

assert.equal(normalizeAvatarType("character"), "initials");
assert.equal(normalizeAvatarType("emoji"), "emoji");

console.log("userProfileDb.check.ts: ok");
