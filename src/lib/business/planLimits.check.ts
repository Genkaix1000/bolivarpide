/**
 * Run: node --experimental-strip-types src/lib/business/planLimits.check.ts
 */
import assert from "node:assert/strict";

const FREE_PLAN_MAX_PRODUCTS = 25;
const FREE_PLAN_MAX_CATEGORIES = 5;

function freePlanLimitsLabel(products: number, categories: number) {
  return `${products}/${FREE_PLAN_MAX_PRODUCTS} productos · ${categories}/${FREE_PLAN_MAX_CATEGORIES} categorías`;
}

assert.equal(FREE_PLAN_MAX_PRODUCTS, 25);
assert.equal(FREE_PLAN_MAX_CATEGORIES, 5);
assert.equal(freePlanLimitsLabel(3, 2), "3/25 productos · 2/5 categorías");
console.log("planLimits.check.ts: ok");
