import type { OrderLifecycleStatus } from "@/lib/orders/lifecycle";

/** Pedido para la consola del repartidor. */
export type DeliveryOrderView = {
  id: string;
  orderNumber: number;
  status: OrderLifecycleStatus;
  fulfillmentType: "delivery";
  customerName: string;
  customerVerified: boolean;
  customerPhone: string | null;
  whatsappUrl: string | null;
  deliveryAddress: string | null;
  itemsSummary: string;
  notes: string | null;
  paymentMethod: string | null;
  paymentStatus: string;
  totalCents: number;
  createdAt: string;
  elapsedMinutes: number;
  deliveryDriverId: string | null;
  assignedToMe: boolean;
  canClaim: boolean;
  rejectionReason: string | null;
};

/** Fila para la vista de gestión owner/staff. */
export type DispatchOrderView = {
  id: string;
  orderNumber: number;
  status: OrderLifecycleStatus;
  customerName: string;
  deliveryAddress: string | null;
  itemsSummary: string;
  totalCents: number;
  elapsedMinutes: number;
  createdAt: string;
  driverId: string | null;
  driverName: string | null;
  assignedAt: string | null;
};

export type ActiveDriver = {
  userId: string;
  displayName: string;
  initials: string;
  activeDeliveriesCount: number;
};

export type DriverBoard = {
  enCamino: DeliveryOrderView[];
  disponibles: DeliveryOrderView[];
  porSalir: DeliveryOrderView[];
  historial: DeliveryOrderView[];
};

export type DispatchQueue = {
  enCocina: DispatchOrderView[];
  enReparto: DispatchOrderView[];
  drivers: ActiveDriver[];
};

/** Fila cruda de `orders` + order_items para mapear (patrón de kitchen/active). */
export type DeliveryOrderRow = {
  id: string;
  order_number: number | null;
  status: string;
  customer_user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  fulfillment_type: string | null;
  payment_method: string | null;
  payment_status: string;
  total_cents: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
  delivery_address: string | null;
  delivery_driver_id: string | null;
  assigned_at: string | null;
  order_items?:
    | {
        name: string;
        quantity: number;
        unit_price_cents: number;
        note?: string | null;
      }[]
    | null;
};

/**
 * A qué tab del DriverBoard pertenece un pedido mapeado.
 * Contract puro entre las consultas y la UI (testeable sin cliente).
 */
export type DriverTab = "enCamino" | "disponibles" | "porSalir" | "historial";