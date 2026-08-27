/**
 * Runnable check for cart pure logic.
 * Run: npx tsx src/lib/cart.check.ts
 */
import assert from "node:assert/strict";
import {
  addLine,
  addNeedsSwitch,
  amountToMinOrder,
  canCheckout,
  clearCart,
  lineKey,
  requiredOptionsMissing,
  unitPrice,
  type CartState,
} from "./cart";
import type { TrendingItem } from "./mockData";

const plain: TrendingItem = {
  id: "fries",
  name: "Fries",
  storeName: "Boz",
  chainId: "burgerboz",
  price: 4500,
  emoji: "🍟",
};

const withReq: TrendingItem = {
  ...plain,
  id: "burger",
  options: [
    {
      id: "punto",
      name: "Punto",
      required: true,
      choices: [
        { id: "medio", label: "A punto" },
        { id: "jugoso", label: "Jugoso", priceDelta: 0 },
      ],
    },
    {
      id: "extra",
      name: "Extra",
      required: false,
      choices: [{ id: "bacon", label: "Bacon", priceDelta: 800 }],
    },
  ],
};

const empty: CartState = { chainId: null, lines: [] };

assert.equal(requiredOptionsMissing(withReq), true);
assert.equal(requiredOptionsMissing(withReq, { punto: "medio" }), false);
assert.equal(unitPrice(withReq, { punto: "medio", extra: "bacon" }), 5300);

let cart = addLine(empty, plain, 1);
assert.equal(cart.chainId, "burgerboz");
assert.equal(cart.lines[0].qty, 1);
assert.equal(addNeedsSwitch(cart, "burgerboz"), false);
assert.equal(addNeedsSwitch(cart, "pizzastore"), true);

cart = addLine(cart, plain, 2);
assert.equal(cart.lines.length, 1);
assert.equal(cart.lines[0].qty, 3);

assert.equal(canCheckout(7000, 8000), false);
assert.equal(amountToMinOrder(7000, 8000), 1000);
assert.equal(canCheckout(8000, 8000), true);

const switched = addLine(clearCart(), { ...plain, chainId: "pizzastore", id: "pizza" }, 1);
assert.equal(switched.chainId, "pizzastore");
assert.notEqual(lineKey("a", { x: "1" }), lineKey("a", { x: "2" }));

console.log("cart.check: ok");
