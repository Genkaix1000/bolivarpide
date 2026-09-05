import assert from "node:assert/strict";
import { normalizeAvatarType } from "./userProfileDb";

assert.equal(normalizeAvatarType("character"), "initials");
assert.equal(normalizeAvatarType("emoji"), "emoji");
assert.equal(normalizeAvatarType("symbol"), "symbol");

console.log("userProfileDb.check.ts: ok");