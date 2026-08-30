import assert from "node:assert/strict";
import { packOrderItemNote, resolveItemOptions, unpackOrderItemNote } from "./itemOptionsNote";

const packed = packOrderItemNote("sin cebolla", [
  { label: "Bacon", priceCents: 80000 },
  { label: "A punto", priceCents: 0 },
]);
assert.ok(packed?.includes("__opts__:"));

const parsed = unpackOrderItemNote(packed);
assert.equal(parsed.note, "sin cebolla");
assert.equal(parsed.optionsDetail.length, 2);
assert.equal(parsed.optionsDetail[0].priceCents, 80000);

const plain = resolveItemOptions("solo nota");
assert.equal(plain.note, "solo nota");
assert.equal(plain.optionsDetail.length, 0);

console.log("itemOptionsNote.check: ok");
