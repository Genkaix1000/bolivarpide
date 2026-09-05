import assert from "node:assert/strict";
import {
  BP_GUEST_MODE_KEY,
  BP_REMEMBERED_ACCOUNT_KEY,
  clearRememberedAccount,
  readGuestMode,
  readRememberedAccount,
  setGuestMode,
  writeRememberedAccount,
} from "./rememberedAccount";

// jsdom-less: only pure helpers that don't need window for key constants
assert.equal(BP_GUEST_MODE_KEY, "bp_guest_mode");
assert.equal(BP_REMEMBERED_ACCOUNT_KEY, "bp_remembered_account");

// Node 22+ has localStorage in recent versions; skip if absent
if (typeof localStorage !== "undefined") {
  clearRememberedAccount();
  assert.equal(readGuestMode(), false);
  assert.equal(readRememberedAccount(), null);

  writeRememberedAccount({
    name: "Matías",
    email: "m@test.com",
    avatar: { type: "initials", value: "MA", gradientId: "cherry" },
  });
  setGuestMode(true);
  assert.equal(readGuestMode(), true);
  assert.equal(readRememberedAccount()?.email, "m@test.com");

  clearRememberedAccount();
  assert.equal(readGuestMode(), false);
  assert.equal(readRememberedAccount(), null);
}

console.log("auth/rememberedAccount: ok");
