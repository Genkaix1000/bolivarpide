import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/** Contrato v1 — compatible con WebCrypto en Edge si hace falta después. */
export const MP_TOKEN_INFO = "bolivarpide/mp-token/v1";

const VERSION = "v1";
const SALT_BYTES = 16;
const IV_BYTES = 12;
const TAG_BYTES = 16;

function deriveKey(ikm: string, salt: Buffer): Buffer {
  return Buffer.from(hkdfSync("sha256", Buffer.from(ikm, "utf8"), salt, MP_TOKEN_INFO, 32));
}

export function encryptMpToken(plaintext: string, secret: string): string {
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = deriveKey(secret, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}.${salt.toString("base64url")}.${iv.toString("base64url")}.${Buffer.concat([ciphertext, tag]).toString("base64url")}`;
}

export function decryptMpToken(blob: string, secret: string): string {
  const parts = blob.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error("Token cifrado inválido");
  const salt = Buffer.from(parts[1], "base64url");
  const iv = Buffer.from(parts[2], "base64url");
  const data = Buffer.from(parts[3], "base64url");
  const key = deriveKey(secret, salt);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(data.subarray(data.length - TAG_BYTES));
  return Buffer.concat([
    decipher.update(data.subarray(0, data.length - TAG_BYTES)),
    decipher.final(),
  ]).toString("utf8");
}
