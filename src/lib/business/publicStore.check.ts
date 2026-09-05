/**
 * Runnable check: photo/icon stay distinct on TrendingItem.
 * Run: npx tsx src/lib/business/publicStore.check.ts
 */
import assert from "node:assert/strict";
import { productToTrendingItem } from "./publicStore";

const biz = { slug: "boz", name: "Burger Boz" };

const both = productToTrendingItem(biz, {
  id: "1",
  name: "Doble",
  description: null,
  price_cents: 5000,
  image_path: "biz/photo.jpg",
  icon_path: "biz/icon.png",
  category_id: null,
  category: "Burgers",
});

assert.equal(both.photoImage?.includes("photo.jpg"), true);
assert.equal(both.iconImage?.includes("icon.png"), true);
assert.notEqual(both.photoImage, both.iconImage);

const onlyIcon = productToTrendingItem(biz, {
  id: "2",
  name: "Fries",
  description: null,
  price_cents: 2000,
  image_path: null,
  icon_path: "biz/fries.png",
  category_id: null,
  category: null,
});

assert.equal(onlyIcon.photoImage, undefined);
assert.equal(onlyIcon.iconImage?.includes("fries.png"), true);

const onlyPhoto = productToTrendingItem(biz, {
  id: "3",
  name: "Shake",
  description: null,
  price_cents: 3000,
  image_path: "biz/shake.jpg",
  icon_path: null,
  category_id: null,
  category: null,
});

assert.equal(onlyPhoto.photoImage?.includes("shake.jpg"), true);
assert.equal(onlyPhoto.iconImage, undefined);

console.log("publicStore.check.ts: ok");
