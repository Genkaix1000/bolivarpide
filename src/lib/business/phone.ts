/** AR mobile local part (after +54 9): 4-digit area + subscriber, max 10 digits. */

export function formatLocalMobile(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

export function toStoredPhone(localFormatted: string) {
  const digits = localFormatted.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `+549${digits}`;
}
