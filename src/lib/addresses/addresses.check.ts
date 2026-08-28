/**
 * Run: node --experimental-strip-types src/lib/addresses/addresses.check.ts
 */
import assert from "node:assert/strict";
import { formatAddressLabel } from "./display";

const BOLIVAR_CENTER = { lat: -36.2307, lng: -61.1189 };
const BOLIVAR_RADIUS_KM = 15;

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

function isWithinBolivar(lat: number, lng: number) {
  return haversineKm(lat, lng, BOLIVAR_CENTER.lat, BOLIVAR_CENTER.lng) <= BOLIVAR_RADIUS_KM;
}

function localityLooksLikeBolivar(locality: string | undefined) {
  if (!locality) return false;
  return /bol[ií]var/i.test(locality);
}

assert.equal(isWithinBolivar(BOLIVAR_CENTER.lat, BOLIVAR_CENTER.lng), true);
assert.equal(isWithinBolivar(-34.6037, -58.3816), false);
assert.equal(localityLooksLikeBolivar("San Carlos de Bolívar"), true);
assert.equal(
  formatAddressLabel({ street: "Av. San Martín", streetNumber: "450", noNumber: false }),
  "Av. San Martín 450",
);
assert.equal(
  formatAddressLabel({ street: "Av. San Martín", streetNumber: null, noNumber: true }),
  "Av. San Martín",
);

console.log("addresses.check.ts ok");
