import assert from "node:assert/strict";
import {
  generateDeliveryPin,
  isPinLocked,
  nextPinLock,
  verifyDeliveryPin,
} from "./deliveryPin";

for (let i = 0; i < 20; i++) {
  const pin = generateDeliveryPin();
  assert.match(pin, /^\d{4}$/);
  assert.ok(Number(pin) >= 1000 && Number(pin) <= 9999);
}

assert.equal(verifyDeliveryPin("4829", "4829"), true);
assert.equal(verifyDeliveryPin("0000", "4829"), false);

const lock = nextPinLock(5, Date.parse("2026-01-01T00:00:00Z"));
assert.ok(lock && isPinLocked(lock, Date.parse("2026-01-01T00:05:00Z")));

console.log("deliveryPin.check.ts OK");
