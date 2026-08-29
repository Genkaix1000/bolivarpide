import { decryptMpToken, encryptMpToken } from "@/lib/mercadopago/crypto";

const secret = "test-secret-for-roundtrip-only";
const plain = "APP_USR-test-token-12345";
const blob = encryptMpToken(plain, secret);
const back = decryptMpToken(blob, secret);
if (back !== plain) {
  throw new Error(`mp crypto roundtrip failed: ${back}`);
}
console.log("mercadopago crypto.check ok");
