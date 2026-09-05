import assert from "node:assert/strict";
import { isWithinBolivar, localityLooksLikeBolivar } from "./bolivar";
import { BOLIVAR_CENTER, BOLIVAR_RADIUS_KM } from "./constants";
import { formatAddressLabel } from "./display";

assert.equal(BOLIVAR_RADIUS_KM, 15);
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