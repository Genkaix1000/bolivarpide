/**
 * Run: node --experimental-strip-types src/lib/business/categories.check.ts
 */
import assert from "node:assert/strict";
import { resolveCategory, suggestCategories } from "./categories";
import { CreateBusinessOnboardingSchema } from "./onboardingSchemas";
import { formatLocalMobile, toStoredPhone } from "./phone";

assert.deepEqual(resolveCategory("pizzeria"), {
  category: "pizzeria",
  customCategoryInput: null,
});

assert.deepEqual(resolveCategory("otros", "Cafetería"), {
  category: "cafeteria",
  customCategoryInput: null,
});

assert.deepEqual(resolveCategory("otros", "Chocolatería artesanal"), {
  category: "variados",
  customCategoryInput: "Chocolatería artesanal",
});

assert.ok(suggestCategories("caf").length === 0);
assert.ok(suggestCategories("cafet").some((c) => c.id === "cafeteria"));

const valid = CreateBusinessOnboardingSchema.safeParse({
  name: "Pizzería Los Amigos",
  categorySelection: "pizzeria",
  phone: "+54 9 2314 554433",
  address: "Av. Brown 250",
  plan: "free",
});
assert.equal(valid.success, true);

assert.equal(formatLocalMobile("2314443322"), "2314 443322");
assert.equal(toStoredPhone("2314 443322"), "+5492314443322");

console.log("categories.check.ts: ok");
