// Run: npx tsx src/lib/orders/comandaImage.check.ts
import assert from "node:assert/strict";
import { UNSUPPORTED_CAPTURE_COLOR } from "./comandaImage";

assert.equal(UNSUPPORTED_CAPTURE_COLOR.test("oklch(0.145 0 0)"), true);
assert.equal(UNSUPPORTED_CAPTURE_COLOR.test("lab(10 20 30)"), true);
assert.equal(UNSUPPORTED_CAPTURE_COLOR.test("#292524"), false);
assert.equal(UNSUPPORTED_CAPTURE_COLOR.test("rgb(41, 37, 36)"), false);

console.log("comandaImage.check.ts OK");
