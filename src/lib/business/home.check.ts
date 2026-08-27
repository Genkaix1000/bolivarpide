/**
 * Run: node --experimental-strip-types src/lib/business/home.check.ts
 */
import assert from "node:assert/strict";

function toFeaturedChain(b: {
  id: string;
  name: string;
  tagline: string | null;
  logo_path: string | null;
  rating: number;
  prep_time_minutes: number;
  is_open: boolean;
  address: string | null;
}) {
  return {
    id: b.id,
    name: b.name,
    bannerText: b.tagline ?? (b.is_open ? "Abierto" : "Cerrado"),
    timeEstimate: `${b.prep_time_minutes} min`,
    rating: Number(b.rating) || 0,
  };
}

const mapped = toFeaturedChain({
  id: "1",
  name: "Don Luis",
  tagline: null,
  logo_path: null,
  rating: 4.5,
  prep_time_minutes: 30,
  is_open: true,
  address: "Mitre 100",
});
assert.equal(mapped.bannerText, "Abierto");
assert.equal(mapped.timeEstimate, "30 min");
console.log("home.check.ts: ok");
