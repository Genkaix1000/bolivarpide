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

assert.equal(canBackward("preparing"), "pending");
assert.equal(canBackward("delivering"), "preparing");
assert.equal(canBackward("delivered"), null);

assert.equal(normalizeLifecycleStatus("accepted"), "preparing");
assert.equal(normalizeLifecycleStatus("cancelled"), "rejected");

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
assert.equal(timestampPatch("delivering", "delivered", "2026-01-01T00:00:00Z").delivery_pin, null);

console.log("lifecycle.check.ts OK");
