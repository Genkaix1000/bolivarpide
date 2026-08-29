/**
 * WhatsApp number normalization helpers (pure, no I/O).
 *
 * Meta sends the sender id in `message.from`/`wa_id` as an international
 * E.164 digit string WITHOUT the leading `+`, e.g. "5492314443322".
 * It normally includes the Argentine mobile "9" (549...) but some carriers
 * report the "9" omitted (5411...). We normalize both to the app's stored
 * format "+549" + 10 local digits (area + subscriber), matching
 * `toStoredPhone` in lib/business/phone.ts.
 */

export function localDigitsFromWaId(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!/^54\d{10,12}$/.test(digits)) return null;

  const national = digits.startsWith("549")
    ? digits.slice(3) // 9 + area + subscriber
    : digits.slice(2); // area + subscriber (9 omitted)

  const local = national.replace(/^9(?=\d{10}$)/, "").slice(-10);
  if (local.length !== 10) return null;
  return local;
}

export function storedPhoneFromWaId(raw: string): string | null {
  const local = localDigitsFromWaId(raw);
  if (!local) return null;
  return `+549${local}`;
}