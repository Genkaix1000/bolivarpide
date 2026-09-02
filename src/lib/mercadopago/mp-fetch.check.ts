import assert from "node:assert/strict";
import { parseMpError } from "@/lib/mercadopago/mp-fetch";

const ordersErr = parseMpError(
  {
    errors: [
      {
        code: "pos_not_found",
        message: "External POS id not found",
        details: ["$.config.qr.external_pos_id X was not found"],
      },
    ],
  },
  404,
);
assert.equal(ordersErr.code, "pos_not_found");
assert.match(ordersErr.message, /External POS id not found/);
assert.match(ordersErr.message, /was not found/);

const legacy = parseMpError(
  { message: "invalid", causes: [{ description: "point_of_sale already exists" }] },
  400,
);
assert.match(legacy.message, /point_of_sale/);
assert.equal(legacy.code, "point_of_sale_exists");

const empty = parseMpError({}, 400);
assert.equal(empty.message, "Error Mercado Pago");

console.log("mp-fetch.check: ok");
