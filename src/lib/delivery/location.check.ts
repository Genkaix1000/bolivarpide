import assert from "node:assert/strict";
import { isLocationFresh, isValidLatLng, LOCATION_MAX_AGE_MS, shouldSaveLocation } from "./location";

// -- Throttle de persistencia
assert.equal(shouldSaveLocation(0, null), true, "primera vez => guardar siempre");
assert.equal(shouldSaveLocation(0, 0, 10_000), false, "recién guardado => no repetir");
assert.equal(shouldSaveLocation(9_999, 0, 10_000), false, "antes de la ventana => no");
assert.equal(shouldSaveLocation(10_000, 0, 10_000), true, "en el límite de la ventana => sí");
assert.equal(shouldSaveLocation(15_000, 0, 10_000), true, "pasada la ventana => sí");

// -- Vigencia de la posición
assert.equal(isLocationFresh(0, LOCATION_MAX_AGE_MS, LOCATION_MAX_AGE_MS), true, "en el límite => fresca");
assert.equal(isLocationFresh(0, LOCATION_MAX_AGE_MS + 1, LOCATION_MAX_AGE_MS), false, "stale => no fresca");
assert.equal(isLocationFresh(1_000, 1_000, LOCATION_MAX_AGE_MS), true, "mismo instante => fresca");

// -- Validación de coordenadas
assert.equal(isValidLatLng(0, 0), true);
assert.equal(isValidLatLng(-90, -180), true, "esquinas válidas mínimas");
assert.equal(isValidLatLng(90, 180), true, "esquinas válidas máximas");
assert.equal(isValidLatLng(90.1, 0), false, "latitud fuera de rango");
assert.equal(isValidLatLng(0, 180.5), false, "longitud fuera de rango");
assert.equal(isValidLatLng(NaN, 0), false, "NaN no es válido");
assert.equal(isValidLatLng(Infinity, 0), false, "Infinity no es válido");
assert.equal(isValidLatLng(0, NaN), false, "NaN en lng no es válido");

console.log("delivery/location.check.ts OK");
