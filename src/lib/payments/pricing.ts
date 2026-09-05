/** Recargo pago rápido vs descuento QR (referencia MP checkout vs QR presencial). */
export const FAST_PAY_SURCHARGE_BPS = 450;
export const QR_DISCOUNT_BPS = 350;

export const MP_COSTS_HELP_URL = "https://www.mercadopago.com.ar/ayuda/220";

export type PayChannel = "fast_pay" | "qr" | "cash";

export function fastPaySurchargeCents(baseCents: number): number {
  return Math.round((baseCents * FAST_PAY_SURCHARGE_BPS) / 10_000);
}

export function qrDiscountCents(baseCents: number): number {
  return Math.round((baseCents * QR_DISCOUNT_BPS) / 10_000);
}

export function checkoutAmountCents(
  baseCents: number,
  channel?: PayChannel,
  _absorbFastPayFee?: boolean,
): number {
  if (channel === "qr") return Math.max(0, baseCents - qrDiscountCents(baseCents));
  return baseCents;
}
