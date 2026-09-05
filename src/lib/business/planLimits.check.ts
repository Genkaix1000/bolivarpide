import assert from "node:assert/strict";
import { FREE_PLAN_MAX_PRODUCTS, FREE_PLAN_MAX_CATEGORIES, isFreePlan } from "./planLimits";

assert.equal(FREE_PLAN_MAX_PRODUCTS, 25);
assert.equal(FREE_PLAN_MAX_CATEGORIES, 5);
assert.equal(isFreePlan("free"), true);
assert.equal(isFreePlan(""), true);
assert.equal(isFreePlan("tier2"), false);

console.log("planLimits.check.ts OK");