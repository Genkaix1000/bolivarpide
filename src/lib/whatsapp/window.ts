/**
 * WhatsApp 24h customer-service window helpers (pure).
 *
 * Meta allows free-form (non-template) messages to a customer only within
 * 24 hours of the customer's last inbound interaction. Outside the window a
 * business reply requires an approved template; the app surfaces a wa.me
 * escape hatch instead.
 */

export const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isWithinReplayWindow(lastInbound: string | Date | null | undefined, now: Date = new Date()): boolean {
  if (!lastInbound) return false;
  const t = new Date(lastInbound).getTime();
  if (Number.isNaN(t)) return false;
  return now.getTime() - t <= WHATSAPP_WINDOW_MS;
}

export function windowExpiresIn(lastInbound: string | Date | null | undefined, now: Date = new Date()): number | null {
  if (!lastInbound) return null;
  const t = new Date(lastInbound).getTime();
  if (Number.isNaN(t)) return null;
  const remaining = t + WHATSAPP_WINDOW_MS - now.getTime();
  return remaining > 0 ? remaining : 0;
}