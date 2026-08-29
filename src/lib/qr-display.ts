/** EMVCo / URL → src para <img> (sin dependencia QR). */
export function qrDisplaySrc(payload: string | null | undefined): string | null {
  if (!payload?.trim()) return null;
  const value = payload.trim();
  if (/^(https?:|data:)/i.test(value)) return value;
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(value)}`;
}
