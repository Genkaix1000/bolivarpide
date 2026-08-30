export type OrderLifecycleStatus =
  | "pending"
  | "preparing"
  | "delivering"
  | "delivered"
  | "rejected";

export const LIFECYCLE_STATUSES: OrderLifecycleStatus[] = [
  "pending",
  "preparing",
  "delivering",
  "delivered",
  "rejected",
];

export type OrderItemDetail = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  note?: string | null;
};

export type KitchenOrderTicket = {
  id: string;
  orderNumber: number;
  status: OrderLifecycleStatus;
  customerName: string;
  customerVerified: boolean;
  customerPhone: string | null;
  whatsappUrl: string | null;
  fulfillmentType: "delivery" | "pickup";
  deliveryAddress: string | null;
  items: OrderItemDetail[];
  paymentMethod: string | null;
  paymentStatus: string;
  totalCents: number;
  notes?: string | null;
  createdAt: string;
  elapsedMinutes: number;
  rejectionReason?: string | null;
};

export type OrderTrackingMapView = {
  showMap: boolean;
  fulfillmentType: "delivery" | "pickup";
  business: { lat: number; lng: number; label: string };
  destination: { lat: number; lng: number; label: string } | null;
};

export type OrderTrackingView = {
  id: string;
  orderNumber: number;
  status: OrderLifecycleStatus;
  businessName: string;
  businessLogoUrl?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessRating?: number;
  businessReviewsCount?: number;
  totalCents?: number;
  paymentMethod?: string | null;
  paymentStatus?: string;
  notes?: string | null;
  createdAt?: string;
  items?: OrderItemDetail[];
  estimatedDeliveryAt?: string;
  deliveryPin?: string;
  rejectionReason?: string;
  stepperStep: 0 | 1 | 2 | 3;
  statusTitle: string;
  statusSubtitle: string;
  map?: OrderTrackingMapView | null;
};

export const FORWARD: Record<OrderLifecycleStatus, OrderLifecycleStatus | null> = {
  pending: "preparing",
  preparing: "delivering",
  delivering: "delivered",
  delivered: null,
  rejected: null,
};

export const BACKWARD: Record<OrderLifecycleStatus, OrderLifecycleStatus | null> = {
  pending: null,
  preparing: "pending",
  delivering: "preparing",
  delivered: null,
  rejected: null,
};

const TERMINAL = new Set<OrderLifecycleStatus>(["delivered", "rejected"]);

export function normalizeLifecycleStatus(raw: string): OrderLifecycleStatus | null {
  if (raw === "accepted" || raw === "ready") return "preparing";
  if (raw === "cancelled") return "rejected";
  if (LIFECYCLE_STATUSES.includes(raw as OrderLifecycleStatus)) {
    return raw as OrderLifecycleStatus;
  }
  return null;
}

export function isTerminalStatus(status: OrderLifecycleStatus): boolean {
  return TERMINAL.has(status);
}

export function canForward(from: OrderLifecycleStatus, to: OrderLifecycleStatus): boolean {
  if (to === "rejected") return !isTerminalStatus(from);
  return FORWARD[from] === to;
}

export function canBackward(from: OrderLifecycleStatus): OrderLifecycleStatus | null {
  return BACKWARD[from];
}

export function stubLabel(status: OrderLifecycleStatus): string {
  switch (status) {
    case "pending":
      return "A cocina";
    case "preparing":
      return "A reparto";
    case "delivering":
      return "Entregado";
    default:
      return "";
  }
}

export function stepperStep(
  status: OrderLifecycleStatus,
  fulfillmentType: "delivery" | "pickup" = "delivery",
): 0 | 1 | 2 | 3 {
  if (fulfillmentType === "pickup") {
    switch (status) {
      case "pending":
        return 0;
      case "preparing":
        return 1;
      case "delivering":
      case "delivered":
        return 2;
      case "rejected":
        return 0;
    }
  }
  switch (status) {
    case "pending":
      return 0;
    case "preparing":
      return 1;
    case "delivering":
      return 2;
    case "delivered":
      return 3;
    case "rejected":
      return 0;
  }
}

export function trackingCopy(
  status: OrderLifecycleStatus,
  eta?: string,
  fulfillmentType: "delivery" | "pickup" = "delivery",
): { title: string; subtitle: string } {
  if (fulfillmentType === "pickup") {
    switch (status) {
      case "pending":
        return {
          title: "Pedido confirmado",
          subtitle: "El local recibió tu pedido y lo va a preparar.",
        };
      case "preparing":
        return {
          title: "Preparando tu pedido",
          subtitle: eta ? `Estimado listo ${eta}` : "Tu pedido está en cocina.",
        };
      case "delivering":
        return {
          title: "¡Listo para retirar!",
          subtitle: "Pasá por el local a buscar tu pedido.",
        };
      case "delivered":
        return {
          title: "¡Pedido retirado!",
          subtitle: "Gracias por tu compra.",
        };
      case "rejected":
        return {
          title: "Pedido rechazado",
          subtitle: "El local no pudo completar tu pedido.",
        };
    }
  }
  switch (status) {
    case "pending":
      return {
        title: "Pedido confirmado",
        subtitle: "El local recibió tu pedido y lo va a preparar.",
      };
    case "preparing":
      return {
        title: "Preparando tu pedido",
        subtitle: eta ? `Llega aprox. ${eta}` : "Tu pedido está en cocina.",
      };
    case "delivering":
      return {
        title: eta ? `Llega aprox. ${eta}` : "Tu pedido ya está en camino",
        subtitle: "Decile el PIN al repartidor para confirmar la entrega.",
      };
    case "delivered":
      return {
        title: "¡Pedido entregado!",
        subtitle: "Gracias por tu compra.",
      };
    case "rejected":
      return {
        title: "Pedido rechazado",
        subtitle: "El local no pudo completar tu pedido.",
      };
  }
}

/** Alerta comercio: pagado o efectivo, operativo pending */
export function shouldAlertBusiness(order: {
  status: string;
  payment_status: string;
  payment_method: string | null;
}): boolean {
  const status = normalizeLifecycleStatus(order.status);
  if (status !== "pending") return false;
  if (order.payment_status === "paid") return true;
  if (order.payment_method === "cash") return true;
  return false;
}

/** Visible en comandera */
export function isKitchenEligible(order: {
  status: string;
  payment_status: string;
  payment_method: string | null;
}): boolean {
  if (order.status === "cancelled") return false;
  if (order.payment_status === "paid") return true;
  if (order.payment_method === "cash" && order.payment_status !== "failed") return true;
  return false;
}

export function elapsedMinutes(createdAt: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60_000));
}

export function mapKitchenTicket(row: {
  id: string;
  order_number: number | null;
  status: string;
  customer_name: string | null;
  fulfillment_type: string | null;
  payment_method: string | null;
  payment_status: string;
  total_cents: number;
  notes: string | null;
  created_at: string;
  rejection_reason: string | null;
  delivery_address: string | null;
  order_items?: {
    name: string;
    quantity: number;
    unit_price_cents: number;
    note?: string | null;
  }[];
}): KitchenOrderTicket | null {
  const status = normalizeLifecycleStatus(row.status);
  if (!status) return null;
  if (!isKitchenEligible(row)) return null;

  const items: OrderItemDetail[] = (row.order_items ?? []).map((i) => ({
    name: i.name,
    quantity: i.quantity,
    unitPriceCents: i.unit_price_cents,
    note: i.note,
  }));

  return {
    id: row.id,
    orderNumber: row.order_number ?? 0,
    status,
    customerName: row.customer_name ?? "Cliente",
    customerVerified: false,
    customerPhone: null,
    whatsappUrl: null,
    fulfillmentType: row.fulfillment_type === "pickup" ? "pickup" : "delivery",
    deliveryAddress: row.delivery_address,
    items,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    totalCents: row.total_cents,
    notes: row.notes,
    createdAt: row.created_at,
    elapsedMinutes: elapsedMinutes(row.created_at),
    rejectionReason: row.rejection_reason,
  };
}

export function timestampPatch(
  from: OrderLifecycleStatus,
  to: OrderLifecycleStatus,
  now: string,
): Record<string, string | null> {
  const patch: Record<string, string | null> = {};
  if (to === "preparing") patch.accepted_at = now;
  if (to === "delivering") patch.dispatched_at = now;
  if (to === "delivered") {
    patch.delivered_at = now;
    patch.delivery_pin = null;
    patch.pin_locked_until = null;
  }
  if (to === "rejected") patch.rejected_at = now;
  if (to === "pending" && from === "preparing") patch.accepted_at = null;
  if (to === "preparing" && from === "delivering") patch.dispatched_at = null;
  return patch;
}
