import { requireUser } from "@/lib/business/queries";
import { resolveItemOptions } from "@/lib/orders/itemOptionsNote";
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
      fulfillment_type, delivery_address, business_id, total_cents, notes, created_at,
      payment_method, payment_status, paid_at, dispatched_at,
      order_items(name, quantity, unit_price_cents, note),
      businesses!inner(id, name, logo_path, prep_time_minutes, phone, address, rating, reviews_count)
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
    rating?: number;
    reviews_count?: number;
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
    orderId: row.id,
  });

  const items = ((row.order_items as unknown[]) ?? []).map((raw) => {
    const r = raw as {
      name: string;
      quantity: number;
      unit_price_cents: number;
      note?: string | null;
      options_detail?: unknown;
    };
    const parsed = resolveItemOptions(r.note);
    return {
      name: r.name,
      quantity: r.quantity,
      unitPriceCents: r.unit_price_cents,
      note: parsed.note,
      optionsDetail: parsed.optionsDetail,
    };
  });

  return {
    id: row.id,
    orderNumber: row.order_number ?? 0,
    status,
    businessName: business.name,
    businessLogoUrl: business.logo_path ?? undefined,
    businessPhone: business.phone ?? undefined,
    businessAddress: business.address ?? undefined,
    businessRating: Number(business.rating) || 4.8,
    businessReviewsCount: Number(business.reviews_count) || 0,
    totalCents: row.total_cents,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    notes: row.notes,
    createdAt: row.created_at,
    items,
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
