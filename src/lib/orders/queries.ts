import { requireBusinessAccess, requireUser } from "@/lib/business/queries";
import {
  normalizeLifecycleStatus,
  stepperStep,
  trackingCopy,
  type OrderTrackingView,
} from "@/lib/orders/lifecycle";
import { resolveOrderTrackingMap } from "@/lib/orders/trackingMap";

export async function getOrderTracking(orderId: string): Promise<OrderTrackingView | null> {
  const { supabase, user } = await requireUser();
  const { data: row, error } = await supabase
    .from("orders")
    .select(
      `
      id, order_number, status, customer_user_id, rejection_reason, delivery_pin,
      fulfillment_type, delivery_address, business_id,
      paid_at, dispatched_at,
      businesses!inner(id, name, logo_path, prep_time_minutes, phone, address)
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !row) return null;
  if (row.customer_user_id !== user.id) return null;

  const status = normalizeLifecycleStatus(row.status);
  if (!status) return null;

  const business = (Array.isArray(row.businesses) ? row.businesses[0] : row.businesses) as {
    id: string;
    name: string;
    logo_path: string | null;
    prep_time_minutes: number;
    phone: string | null;
    address: string | null;
  };

  let eta: string | undefined;
  const base = row.dispatched_at ?? row.paid_at;
  if (base && business.prep_time_minutes) {
    const etaDate = new Date(new Date(base).getTime() + business.prep_time_minutes * 60_000);
    eta = etaDate.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    });
  }

  const fulfillmentType = row.fulfillment_type === "pickup" ? "pickup" : "delivery";
  const copy = trackingCopy(status, eta, fulfillmentType);

  const map = await resolveOrderTrackingMap({
    businessId: business.id,
    businessName: business.name,
    businessAddress: business.address,
    fulfillmentType: row.fulfillment_type,
    deliveryAddress: row.delivery_address,
    customerUserId: row.customer_user_id!,
    status,
  });

  return {
    id: row.id,
    orderNumber: row.order_number ?? 0,
    status,
    businessName: business.name,
    businessLogoUrl: business.logo_path ?? undefined,
    businessPhone: business.phone ?? undefined,
    estimatedDeliveryAt: eta,
    deliveryPin:
      fulfillmentType === "delivery" && status === "delivering"
        ? (row.delivery_pin ?? undefined)
        : undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    stepperStep: stepperStep(status, fulfillmentType),
    statusTitle: copy.title,
    statusSubtitle:
      status === "rejected" && row.rejection_reason
        ? row.rejection_reason
        : copy.subtitle,
    map,
  };
}
