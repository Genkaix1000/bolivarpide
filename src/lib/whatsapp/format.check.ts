// Run: npx tsx src/lib/whatsapp/format.check.ts
import assert from "node:assert/strict";
import {
  localDigitsFromWaId,
  storedPhoneFromWaId,
} from "@/lib/whatsapp/format";

// BA mobile with the "9" present (most common from Meta)
assert.equal(localDigitsFromWaId("5491144257654"), "1144257654");
assert.equal(storedPhoneFromWaId("5491144257654"), "+5491144257654");

// Interior mobile (Bolívar) with the "9"
assert.equal(localDigitsFromWaId("5492314443322"), "2314443322");
assert.equal(storedPhoneFromWaId("5492314443322"), "+5492314443322");

// BA mobile reported without the "9" (some carriers)
assert.equal(localDigitsFromWaId("541144257654"), "1144257654");
assert.equal(storedPhoneFromWaId("541144257654"), "+5491144257654");

// Non-AR numbers are rejected
assert.equal(localDigitsFromWaId("59899123456"), null);
assert.equal(storedPhoneFromWaId("59899123456"), null);

// Already-normalized stored format is idempotent
assert.equal(storedPhoneFromWaId("+5492314443322"), "+5492314443322");

// Garbage
assert.equal(localDigitsFromWaId(""), null);
assert.equal(localDigitsFromWaId("hola"), null);
assert.equal(storedPhoneFromWaId("12345"), null);

console.log("whatsapp format checks OK");