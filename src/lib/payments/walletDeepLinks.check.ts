import assert from "node:assert/strict";
import { mercadoPagoPayUrl, modoPayUrl } from "@/lib/payments/walletDeepLinks";

const sample = "00020101021243650016COM.MERCADOLIBRE02013063638f1192a";

assert.match(modoPayUrl(sample), /^https:\/\/www\.modo\.com\.ar\/pagar\/\?qr=/);
assert.match(mercadoPagoPayUrl(sample), /^https:\/\/www\.mercadopago\.com\.ar\/pagar\/\?qr=/);

console.log("walletDeepLinks.check ok");
