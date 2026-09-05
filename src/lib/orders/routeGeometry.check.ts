import assert from "node:assert/strict";
import { demoRouteProgress, pointOnPolyline, polylineLengthKm } from "./routeGeometry";

const route = [
  { lat: -36.23, lng: -61.12 },
  { lat: -36.235, lng: -61.115 },
  { lat: -36.24, lng: -61.11 },
];

assert.ok(polylineLengthKm(route) > 0);
assert.equal(pointOnPolyline(route, 0).lat, route[0].lat);
assert.equal(pointOnPolyline(route, 1).lat, route[2].lat);
assert.deepEqual(pointOnPolyline([], 0.5), { lat: 0, lng: 0 });

assert.equal(demoRouteProgress("preparing", 0, 1000), 0);
assert.ok(demoRouteProgress("delivering", 0, 90_000) > 0.4);
assert.ok(demoRouteProgress("delivering", 0, 240_000) <= 0.94);

console.log("routeGeometry.check.ts OK");