import assert from "node:assert/strict";
import type { PendingCustomerOrder } from "@/lib/orders/pending";

const sample: PendingCustomerOrder = {
  orderId: "ord-1",
  businessSlug: "pisa-loca",
  businessName: "Pisa Loca",
  amountCents: 9650,
  paymentMethod: "mercadopago_qr",
  channel: "qr_dynamic",
  qrData: "000201",
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};

assert.equal(sample.paymentMethod, "mercadopago_qr");
assert.ok(sample.qrData);
console.log("pending.check ok");
