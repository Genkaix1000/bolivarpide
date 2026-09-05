import assert from "node:assert/strict";
import {
  canBackward,
  canForward,
  isKitchenEligible,
  normalizeLifecycleStatus,
  shouldAlertBusiness,
  stepperStep,
  stubLabel,
  timestampPatch,
} from "./lifecycle";

assert.equal(canForward("pending", "preparing"), true);
assert.equal(canForward("pending", "delivering"), false);
assert.equal(canForward("preparing", "delivering"), true);
assert.equal(canForward("delivering", "delivered"), true);
assert.equal(canForward("delivered", "rejected"), false);
assert.equal(canForward("pending", "rejected"), true);
assert.equal(canForward("pending", "cancelled"), true);
assert.equal(canForward("preparing", "cancelled"), false);
assert.equal(canForward("cancelled", "rejected"), false);

assert.equal(canBackward("preparing"), "pending");
assert.equal(canBackward("delivering"), "preparing");
assert.equal(canBackward("delivered"), null);

// Legacy ya migrado: accepted/ready ya no se escriben; cancelled es estado real.
assert.equal(normalizeLifecycleStatus("accepted"), null);
assert.equal(normalizeLifecycleStatus("ready"), null);
assert.equal(normalizeLifecycleStatus("cancelled"), "cancelled");
assert.equal(normalizeLifecycleStatus("preparing"), "preparing");

assert.equal(
  shouldAlertBusiness({ status: "pending", payment_status: "paid", payment_method: "mercadopago_qr" }),
  true,
);
assert.equal(
  shouldAlertBusiness({ status: "pending", payment_status: "awaiting_payment", payment_method: "mercadopago_qr" }),
  false,
);
assert.equal(
  shouldAlertBusiness({ status: "pending", payment_status: "awaiting_payment", payment_method: "cash" }),
  true,
);

assert.equal(
  isKitchenEligible({ status: "pending", payment_status: "awaiting_payment", payment_method: "cash" }),
  true,
);
assert.equal(
  isKitchenEligible({ status: "cancelled", payment_status: "failed", payment_method: "cash" }),
  false,
);

assert.equal(stubLabel("pending"), "A cocina");
assert.equal(stepperStep("delivering"), 2);
assert.equal(stepperStep("cancelled"), 0);
assert.equal(timestampPatch("delivering", "delivered", "2026-01-01T00:00:00Z").delivery_pin, null);
assert.equal(timestampPatch("pending", "cancelled", "2026-01-01T00:00:00Z").cancelled_at, "2026-01-01T00:00:00Z");

console.log("lifecycle.check.ts OK");
