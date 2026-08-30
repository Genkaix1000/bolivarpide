import assert from "node:assert/strict";
import { refundWithDeps } from "./refund";

async function main() {
  let calls = 0;

  const ok = await refundWithDeps(
    {
      id: "o1",
      payment_method: "mercadopago_qr",
      payment_status: "paid",
      mp_payment_id: "pay-1",
    },
    {
      fetchRefund: async () => {
        calls++;
        return { id: "ref-1" };
      },
      markRefunded: async () => {},
      markPending: async () => {},
    },
  );
  assert.equal(ok.ok, true);
  assert.equal(calls, 1);

  const cash = await refundWithDeps(
    { id: "o2", payment_method: "cash", payment_status: "paid", mp_payment_id: null },
    {
      fetchRefund: async () => {
        throw new Error("no");
      },
      markRefunded: async () => {},
      markPending: async () => {},
    },
  );
  assert.equal(cash.ok, true);

  let pending = false;
  const fail = await refundWithDeps(
    {
      id: "o3",
      payment_method: "mercadopago_fast",
      payment_status: "paid",
      mp_payment_id: "pay-2",
    },
    {
      fetchRefund: async () => {
        throw new Error("MP down");
      },
      markRefunded: async () => {},
      markPending: async () => {
        pending = true;
      },
    },
  );
  assert.equal(fail.ok, false);
  assert.equal(pending, true);

  console.log("refund.check.ts OK");
}

void main();
