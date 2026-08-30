export const BUSINESS_PLANS = [
  {
    id: "free" as const,
    name: "Plan Inicial",
    priceLabel: "$0 / mes",
    commission: "7%",
    badge: "Recomendado",
    highlights: [
      "Cero costo fijo",
      "Hasta 25 productos y 5 categorías",
      "Menú digital QR",
    ],
    available: true,
  },
  {
    id: "impulso" as const,
    name: "Plan Impulso",
    priceLabel: "$45.000 / mes",
    commission: "3,5%",
    badge: "Automatización",
    highlights: [
      "Bot de WhatsApp con IA",
      "Catálogo ilimitado",
      "Tiempos de cocina en 1 toque",
    ],
    available: false,
  },
  {
    id: "lider" as const,
    name: "Plan Líder",
    priceLabel: "$95.000 / mes",
    commission: "0%",
    badge: "VIP",
    highlights: [
      "Sin comisión por venta",
      "Destacado en portada",
      "Cuentas de equipo",
    ],
    available: false,
  },
] as const;

export type BusinessPlanId = (typeof BUSINESS_PLANS)[number]["id"];
