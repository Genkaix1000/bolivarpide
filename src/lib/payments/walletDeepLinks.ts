/** Deep links para pagar un qr_data EMVCo sin Checkout Pro (best-effort). */

export type WalletTarget = "mercadopago" | "modo" | "display";

export function modoPayUrl(qrData: string): string {
  return `https://www.modo.com.ar/pagar/?qr=${encodeURIComponent(qrData.trim())}`;
}

/** ponytail: MP no documenta deep link para qr_data dinámico; probamos URL universal conocida. */
export function mercadoPagoPayUrl(qrData: string): string {
  return `https://www.mercadopago.com.ar/pagar/?qr=${encodeURIComponent(qrData.trim())}`;
}

export function walletPayUrl(target: WalletTarget, qrData: string): string | null {
  if (target === "modo") return modoPayUrl(qrData);
  if (target === "mercadopago") return mercadoPagoPayUrl(qrData);
  return null;
}

export function openWalletPay(target: WalletTarget, qrData: string): boolean {
  const url = walletPayUrl(target, qrData);
  if (!url) return false;
  window.location.assign(url);
  return true;
}
