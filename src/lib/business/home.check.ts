import assert from "node:assert/strict";
import { toFeaturedChain } from "./home";

const mapped = toFeaturedChain({
  id: "1",
  slug: "don-luis",
  name: "Don Luis",
  tagline: null,
  logo_path: null,
  banner_path: null,
  rating: 4.5,
  reviews_count: 3,
  prep_time_minutes: 30,
  is_open: true,
  address: "Mitre 100",
});

assert.equal(mapped.id, "don-luis");
assert.equal(mapped.name, "Don Luis");
assert.equal(mapped.bannerText, "Abierto");
assert.equal(mapped.timeEstimate, "30 min");
assert.equal(mapped.rating, 4.5);
assert.equal(mapped.isOpen, true);
assert.equal(mapped.address, "Mitre 100");

console.log("home.check.ts: ok");