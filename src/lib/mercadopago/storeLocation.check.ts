import assert from "node:assert/strict";
import { resolveMpStoreLocation, sanitizeMpPlaceName } from "@/lib/mercadopago/storeLocation";

assert.equal(sanitizeMpPlaceName("Av. San Martín"), "Av San Martin");
assert.equal(sanitizeMpPlaceName("San Carlos de Bolívar"), "San Carlos de Bolivar");

(async () => {
  // Hermetic: reemplazamos fetch global por un stub determinístico estilo
  // Nominatim. run-checks.mjs ejecuta cada check en SU PROPIO proceso → el
  // swap no se filtra a otros checks ni necesita tocar el código de prod.
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify([{ lat: "-36.2307", lon: "-61.1189" }]),
      { status: 200, headers: { "content-type": "application/json" } },
    )) as typeof fetch;

  try {
    const loc = await resolveMpStoreLocation({ address: "Av. San Martín 150" });
    assert.equal(loc.cityName, "Bolívar");
    assert.equal(loc.stateName, "Buenos Aires");
    assert.equal(loc.streetName, "Av San Martin");
    assert.equal(loc.streetNumber, "150");
    assert.ok(loc.latitude < 0 && loc.longitude < 0);
    console.log("storeLocation.check ok", loc.cityName, loc.streetName);
  } finally {
    globalThis.fetch = realFetch;
  }
})();
