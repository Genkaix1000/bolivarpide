import assert from "node:assert/strict";
import { statusIcon } from "./active";

assert.equal(statusIcon("pending"), "Receipt");
assert.equal(statusIcon("preparing"), "CookingPot");
assert.equal(statusIcon("delivering"), "Moped");
assert.equal(statusIcon("delivered"), "CheckCircle");
assert.equal(statusIcon("rejected"), "XCircle");
assert.equal(statusIcon("cancelled"), "XCircle");

console.log("orders/active statusIcon: ok");
