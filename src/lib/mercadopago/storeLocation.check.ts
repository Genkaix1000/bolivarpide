import assert from "node:assert/strict";
import { resolveMpStoreLocation, sanitizeMpPlaceName } from "@/lib/mercadopago/storeLocation";

assert.equal(sanitizeMpPlaceName("Av. San Martín"), "Av San Martin");
assert.equal(sanitizeMpPlaceName("San Carlos de Bolívar"), "San Carlos de Bolivar");

(async () => {
  const loc = await resolveMpStoreLocation({ address: "Av. San Martín 150" });
  assert.equal(loc.cityName, "Bolívar");
  assert.equal(loc.stateName, "Buenos Aires");
  assert.equal(loc.streetName, "Av San Martin");
  assert.equal(loc.streetNumber, "150");
  assert.ok(loc.latitude < 0 && loc.longitude < 0);
  console.log("storeLocation.check ok", loc.cityName, loc.streetName);
})();
