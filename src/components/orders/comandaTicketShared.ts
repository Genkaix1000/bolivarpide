import type { OrderLifecycleStatus } from "@/lib/orders/lifecycle";

export const STATUS_LABEL: Record<OrderLifecycleStatus, string> = {
  pending: "Pendiente",
  preparing: "En cocina",
  delivering: "En reparto",
  delivered: "Entregado",
  rejected: "Rechazado",
};

export const STUB_ACCENT: Record<OrderLifecycleStatus, string> = {
  pending: "bg-[#9a0002]",
  preparing: "bg-amber-600",
  delivering: "bg-[#1a1210]",
  delivered: "bg-stone-400",
  rejected: "bg-stone-500",
};

export const BADGE_ACCENT: Record<OrderLifecycleStatus, string> = {
  pending: "bg-[#9a0002]/10 text-[#9a0002]",
  preparing: "bg-amber-100 text-amber-800",
  delivering: "bg-stone-800/10 text-stone-800 dark:bg-stone-200/10 dark:text-stone-200",
  delivered: "bg-stone-100 text-stone-600",
  rejected: "bg-red-100 text-red-700",
};

export const SCALLOP =
  "radial-gradient(circle at 0 50%, transparent 5px, #000 5px) repeat-y left / 10px 14px";

export function paymentLabel(method: string | null) {
  if (method === "cash") return "Efectivo";
  if (method === "mercadopago_fast") return "Mercado Pago";
  if (method === "mercadopago_qr") return "QR MP";
  return "—";
}

export function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}
