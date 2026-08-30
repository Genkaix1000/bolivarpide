import assert from "node:assert/strict";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function polylineLengthKm(points: { lat: number; lng: number }[]) {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += haversineKm(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng,
    );
  }
  return sum;
}

function pointOnPolyline(points: { lat: number; lng: number }[], t: number) {
  if (t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];
  const total = polylineLengthKm(points);
  const target = total * t;
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const seg = haversineKm(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng,
    );
    if (walked + seg >= target) {
      const f = seg > 0 ? (target - walked) / seg : 0;
      return {
        lat: points[i - 1].lat + (points[i].lat - points[i - 1].lat) * f,
        lng: points[i - 1].lng + (points[i].lng - points[i - 1].lng) * f,
      };
    }
    walked += seg;
  }
  return points[points.length - 1];
}

const route = [
  { lat: -36.23, lng: -61.12 },
  { lat: -36.235, lng: -61.115 },
  { lat: -36.24, lng: -61.11 },
];

assert.ok(polylineLengthKm(route) > 0);
assert.equal(pointOnPolyline(route, 0).lat, route[0].lat);
assert.equal(pointOnPolyline(route, 1).lat, route[2].lat);

console.log("routeGeometry.check.ts OK");
