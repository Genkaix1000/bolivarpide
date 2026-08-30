/**
 * Run: node --experimental-strip-types src/lib/business/menuOptionTypes.check.ts
 */
import assert from "node:assert/strict";
import {
  extrasGroupFromRows,
  normalizeMenuOptionGroup,
  parseMenuOptionGroups,
  splitExtrasFromOptions,
} from "./menuOptionTypes.ts";

const group = normalizeMenuOptionGroup({
  title: "Extras",
  kind: "extras",
  choices: [
    { label: "Bacon", price_cents: 80000 },
    "Huevo",
  ],
});
assert.equal(group?.kind, "extras");
assert.equal(group?.choices[0].price_cents, 80000);
assert.equal(group?.choices[1].label, "Huevo");

const parsed = parseMenuOptionGroups([
  { title: "Punto", choices: ["Jugoso", "A punto"] },
  extrasGroupFromRows([{ label: "Bacon", pricePesos: 800 }])!,
]);
assert.equal(parsed.length, 2);
const { extrasGroup, optionGroups } = splitExtrasFromOptions(parsed);
assert.equal(extrasGroup?.choices[0].label, "Bacon");
assert.equal(optionGroups.length, 1);

console.log("menuOptionTypes.check.ts: ok");
