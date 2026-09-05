import {
  normalizeLifecycleStatus,
  type OrderLifecycleStatus,
} from "@/lib/orders/lifecycle";
import { resolveItemOptions } from "@/lib/orders/itemOptionsNote";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";
import { createServiceClient } from "@/lib/supabase/service";

const REJECTED_VISIBLE_MS = 48 * 60 * 60 * 1000;

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
  itemsSummary: string;
  rejectionReason?: string | null;
};

export function statusIcon(status: OrderLifecycleStatus): string {
  switch (status) {
    case "pending":
      return "receipt_long";
    case "preparing":
      return "skillet";
    case "delivering":
      return "moped";
    case "rejected":
      return "cancel";
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
    case "delivered":
      return "Entregado";
    case "rejected":
      return "Pedido cancelado";
    case "cancelled":
      return "Pedido cancelado";
    default:
      return "Pedido recibido";
  }
}

export function formatOrderItemsSummary(
  items: { name: string; quantity: number; note?: string | null }[],
): string {
  if (items.length === 0) return "";
  const parts = items.slice(0, 2).map((item) => {
    const { optionsDetail } = resolveItemOptions(item.note);
    const extras = optionsDetail.filter((o) => o.priceCents > 0).map((o) => o.label);
    const base = `${item.quantity}× ${item.name}`;
    return extras.length ? `${base} (+${extras.join(", ")})` : base;
  });
  const more = items.length > 2 ? ` · +${items.length - 2}` : "";
  return parts.join(" · ") + more;
}

type OrderRow = {
  id: string;
  order_number: number | null;
  status: string;
  payment_method: string | null;
  payment_status: string;
  total_cents: number | null;
  created_at: string;
  rejection_reason: string | null;
  rejected_at: string | null;
  businesses: { slug: string; name: string; logo_path: string | null } | { slug: string; name: string; logo_path: string | null }[];
  order_items?: { name: string; quantity: number; note?: string | null }[] | null;
};

function mapActiveOrder(order: OrderRow): ActiveCustomerOrder | null {
  const paid = order.payment_status === "paid";
  const cashOk =
    order.payment_method === "cash" &&
    order.payment_status !== "failed" &&
    order.payment_status !== "expired";
  if (!paid && !cashOk) return null;

  const status = normalizeLifecycleStatus(order.status);
  if (!status || status === "delivered") return null;

  if (status === "rejected") {
    const when = order.rejected_at ?? order.created_at;
    if (Date.now() - new Date(when).getTime() > REJECTED_VISIBLE_MS) return null;
  }

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
    itemsSummary: formatOrderItemsSummary(order.order_items ?? []),
    rejectionReason: status === "rejected" ? order.rejection_reason : null,
  };
}

const ORDER_SELECT = `
  id,
  order_number,
  status,
  payment_method,
  payment_status,
  total_cents,
  created_at,
  rejection_reason,
  rejected_at,
  businesses!inner(slug, name, logo_path),
  order_items(name, quantity, note)
`;

export async function getActiveCustomerOrder(userId: string): Promise<ActiveCustomerOrder | null> {
  const svc = createServiceClient();

  const { data: inProgress, error } = await svc
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_user_id", userId)
    .in("status", ["pending", "preparing", "delivering"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (inProgress) {
    const mapped = mapActiveOrder(inProgress as unknown as OrderRow);
    if (mapped) return mapped;
  }

  const since = new Date(Date.now() - REJECTED_VISIBLE_MS).toISOString();
  const { data: rejected, error: rejectedErr } = await svc
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_user_id", userId)
    .eq("status", "rejected")
    .gte("rejected_at", since)
    .order("rejected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rejectedErr) throw rejectedErr;
  if (!rejected) return null;
  return mapActiveOrder(rejected as unknown as OrderRow);
}
