/**
 * Run: node --experimental-strip-types src/lib/images/optimizeImage.check.ts
 */
import assert from "node:assert/strict";
import { fitDimensions } from "./optimizeImage.ts";

assert.deepEqual(fitDimensions(2000, 1000, 1200, 1200), { width: 1200, height: 600 });
assert.deepEqual(fitDimensions(400, 400, 512, 512), { width: 400, height: 400 });
assert.deepEqual(fitDimensions(800, 600, 400, 300), { width: 400, height: 300 });
console.log("optimizeImage.check.ts: ok");
