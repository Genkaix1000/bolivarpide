import { createHmac, timingSafeEqual } from "node:crypto";

export function buildWebhookManifest(
  dataId: string | undefined,
  xRequestId: string | undefined,
  ts: string | undefined,
): string {
  const parts: string[] = [];
  if (dataId) parts.push(`id:${dataId.toLowerCase()}`);
  if (xRequestId) parts.push(`request-id:${xRequestId}`);
  if (ts) parts.push(`ts:${ts}`);
  return parts.join(" ");
}

function parsePart(header: string, key: string): string | undefined {
  for (const part of header.split(",")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === key && rest.length) return rest.join("=");
  }
  return undefined;
}

export function validateWebhookSignature(
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string | undefined,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  if (!xSignature || !secret) return false;
  const ts = parsePart(xSignature, "ts");
  const hash = parsePart(xSignature, "v1");
  if (!ts || !hash) return false;
  const tsMs = ts.length >= 12 ? Number(ts) : Number(ts) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > toleranceSeconds * 1000) return false;

  const computed = createHmac("sha256", secret)
    .update(buildWebhookManifest(dataId, xRequestId, ts))
    .digest("hex");
  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(hash, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
