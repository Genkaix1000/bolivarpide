import assert from "node:assert/strict";
import {
  checkoutAmountCents,
  fastPaySurchargeCents,
  qrDiscountCents,
} from "@/lib/payments/pricing";

assert.equal(fastPaySurchargeCents(3_000_000), 135_000);
assert.equal(qrDiscountCents(3_000_000), 105_000);
assert.equal(checkoutAmountCents(3_000_000, "fast_pay", false), 3_135_000);
assert.equal(checkoutAmountCents(3_000_000, "fast_pay", true), 3_000_000);
assert.equal(checkoutAmountCents(3_000_000, "qr", false), 2_895_000);

console.log("pricing.check ok");
