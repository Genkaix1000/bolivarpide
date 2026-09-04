import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import type { ParsedWhatsAppWebhook } from "./types";

/**
 * Verifies the Meta webhook signature (`X-Hub-Signature-256`) against the
 * app secret. Meta signs the raw request body with HMAC-SHA256:
 *   sha256=hex(hmac_sha256(app_secret, body))
 * Returns the parsed body on success, null on invalid signature.
 */
export async function verifyAndParseMetaWebhook(
  request: Request,
  appSecret: string | undefined,
): Promise<ParsedWhatsAppWebhook | null> {
  const signature = request.headers.get("x-hub-signature-256");
  if (!appSecret || !signature) return null;

  const raw = await request.text();
  const expected = "sha256=" + createHmac("sha256", appSecret).update(raw).digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(raw) as ParsedWhatsAppWebhook;
  } catch {
    return null;
  }
}