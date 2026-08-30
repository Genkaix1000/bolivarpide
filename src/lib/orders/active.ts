import {
  normalizeLifecycleStatus,
  type OrderLifecycleStatus,
} from "@/lib/orders/lifecycle";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";
import { createServiceClient } from "@/lib/supabase/service";

export type ActiveCustomerOrder = {
  orderId: string;
  orderNumber: number;
  businessSlug: string;
  businessName: string;
  businessLogoUrl?: string;
  status: OrderLifecycleStatus;
  totalCents: number;
  createdAt: string;
  paymentMethod: "mercadopago_qr" | "mercadopago_fast" | "cash" | null;
};

export function statusIcon(status: OrderLifecycleStatus): string {
  switch (status) {
    case "pending":
      return "receipt_long";
    case "preparing":
      return "skillet";
    case "delivering":
      return "moped";
    default:
      return "receipt_long";
  }
}

export function statusShortLabel(status: OrderLifecycleStatus): string {
  switch (status) {
    case "pending":
      return "Pedido recibido";
    case "preparing":
      return "En cocina";
    case "delivering":
      return "En camino";
    default:
      return "Pedido en curso";
  }
}

export async function getActiveCustomerOrder(userId: string): Promise<ActiveCustomerOrder | null> {
  const svc = createServiceClient();
  const { data: order, error } = await svc
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      payment_method,
      payment_status,
      total_cents,
      created_at,
      businesses!inner(slug, name, logo_path)
    `,
    )
    .eq("customer_user_id", userId)
    .in("status", ["pending", "preparing", "delivering"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!order) return null;

  const paid = order.payment_status === "paid";
  const cashOk =
    order.payment_method === "cash" &&
    order.payment_status !== "failed" &&
    order.payment_status !== "expired";
  if (!paid && !cashOk) return null;

  const status = normalizeLifecycleStatus(order.status);
  if (!status || status === "delivered" || status === "rejected") return null;

  const business = (Array.isArray(order.businesses) ? order.businesses[0] : order.businesses) as {
    slug: string;
    name: string;
    logo_path: string | null;
  };

  return {
    orderId: order.id,
    orderNumber: order.order_number ?? 0,
    businessSlug: business.slug,
    businessName: business.name,
    businessLogoUrl: resolveBusinessAssetUrl(business.logo_path),
    status,
    totalCents: order.total_cents ?? 0,
    createdAt: order.created_at,
    paymentMethod: order.payment_method as ActiveCustomerOrder["paymentMethod"],
  };
}
