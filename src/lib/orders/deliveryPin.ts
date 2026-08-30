import { randomInt, timingSafeEqual } from "node:crypto";

const MIN = 1000;
const MAX = 9999;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export function generateDeliveryPin(): string {
  return String(randomInt(MIN, MAX + 1));
}

export function verifyDeliveryPin(input: string, stored: string | null | undefined): boolean {
  if (!stored || input.length !== 4) return false;
  const a = Buffer.from(input.padStart(4, "0"));
  const b = Buffer.from(stored.padStart(4, "0"));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isPinLocked(pinLockedUntil: string | null | undefined, now = Date.now()): boolean {
  if (!pinLockedUntil) return false;
  return new Date(pinLockedUntil).getTime() > now;
}

export function nextPinLock(attempts: number, now = Date.now()): string | null {
  if (attempts >= MAX_ATTEMPTS) return new Date(now + LOCK_MS).toISOString();
  return null;
}

export { MAX_ATTEMPTS as PIN_MAX_ATTEMPTS };
