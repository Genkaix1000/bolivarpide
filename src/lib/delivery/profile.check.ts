import assert from "node:assert/strict";
import {
  cuilValidate,
  requiredDocsForVehicle,
  type DeliveryVehicleType,
} from "./profile";

// ---------------------------------------------------------------------------
// cuilValidate (módulo 11)
// ---------------------------------------------------------------------------

assert.equal(cuilValidate("20271234563"), true, "CUIL 20-27123456-3 válido");
assert.equal(cuilValidate("27392188741"), true, "CUIL 27-39218874-1 válido");
assert.equal(cuilValidate("20-27123456-3"), true, "acepta guiones");
assert.equal(cuilValidate(" 20271234563 "), true, "acepta espacios");

assert.equal(cuilValidate("20271234564"), false, "dígito verificador incorrecto");
assert.equal(cuilValidate("12345678901"), false, "prefijo inválido");
assert.equal(cuilValidate("2027123456"), false, "10 dígitos");
assert.equal(cuilValidate("2027123456312"), false, "13 dígitos");
assert.equal(cuilValidate(""), false, "vacío");
assert.equal(cuilValidate("abcdefghijk"), false, "no numérico");

// ---------------------------------------------------------------------------
// requiredDocsForVehicle
// ---------------------------------------------------------------------------

assert.deepEqual(requiredDocsForVehicle("bicycle"), ["dni_front", "dni_back"]);
assert.deepEqual(requiredDocsForVehicle("on_foot"), ["dni_front", "dni_back"]);
assert.deepEqual(requiredDocsForVehicle("motorcycle"), [
  "dni_front",
  "dni_back",
  "license",
]);
assert.deepEqual(requiredDocsForVehicle("car"), ["dni_front", "dni_back", "license"]);

// Tipado: switch exhaustivo sobre DeliveryVehicleType (bandera de TS).
const all: DeliveryVehicleType[] = [
  "bicycle",
  "motorcycle",
  "car",
  "on_foot",
];
assert.equal(all.length, 4);

console.log("delivery/profile.check.ts OK");