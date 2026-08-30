import { createServiceClient } from "@/lib/supabase/service";
import { requireBusinessAccess } from "@/lib/business/queries";
import {
  isKitchenEligible,
  mapKitchenTicket,
  type KitchenOrderTicket,
} from "@/lib/orders/lifecycle";

const KITCHEN_FIELDS =
  "id, order_number, status, customer_user_id, customer_name, customer_phone, fulfillment_type, payment_method, payment_status, total_cents, notes, created_at, rejection_reason, delivery_address";

type ProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  identity_verified: boolean | null;
  phone: string | null;
};

export function customerDisplayName(
  profile: ProfileRow | undefined,
  fallback: string | null,
): string {
  const first = profile?.first_name?.trim();
  const last = profile?.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  if (fallback?.trim()) return fallback.trim();
  return "Cliente";
}

export function customerPhone(profile: ProfileRow | undefined, orderPhone: string | null): string | null {
  const p = profile?.phone?.trim() || orderPhone?.trim();
  return p || null;
}

export function whatsAppUrl(phone: string, message?: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith("54")) digits = `54${digits}`;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export async function listKitchenOrders(businessId: string): Promise<{
  tickets: KitchenOrderTicket[];
  whatsappConnected: boolean;
}> {
  await requireBusinessAccess(businessId);
  const svc = createServiceClient();

  const [{ data, error }, waRes] = await Promise.all([
    svc
      .from("orders")
      .select(`${KITCHEN_FIELDS}, order_items(name, quantity, unit_price_cents, note)`)
      .eq("business_id", businessId)
      .order("created_at", { ascending: true })
      .limit(100),
    svc
      .from("business_whatsapp")
      .select("status, is_active")
      .eq("business_id", businessId)
      .maybeSingle(),
  ]);

  if (error) throw error;

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((r) => r.customer_user_id).filter(Boolean))] as string[];

  let profiles = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const { data: profs } = await svc
      .from("user_profiles")
      .select("user_id, first_name, last_name, display_name, identity_verified, phone")
      .in("user_id", userIds);
    for (const p of profs ?? []) profiles.set(p.user_id, p as ProfileRow);
  }

  const whatsappConnected = waRes.data?.status === "connected" && waRes.data?.is_active === true;

  const tickets = rows
    .map((row) => {
      const base = mapKitchenTicket(row as never);
      if (!base) return null;
      const prof = row.customer_user_id ? profiles.get(row.customer_user_id) : undefined;
      const phone = customerPhone(prof, row.customer_phone);
      return {
        ...base,
        customerName: customerDisplayName(prof, row.customer_name),
        customerVerified: !!prof?.identity_verified,
        customerPhone: phone,
        whatsappUrl:
          whatsappConnected && phone
            ? whatsAppUrl(phone, `Hola, te escribo por tu pedido #${base.orderNumber} en BolivarPide.`)
            : null,
      } satisfies KitchenOrderTicket;
    })
    .filter((t): t is KitchenOrderTicket => t != null);

  return { tickets, whatsappConnected };
}

export async function countOperationalPending(businessId: string): Promise<number> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("orders")
    .select("id, status, payment_status, payment_method")
    .eq("business_id", businessId)
    .eq("status", "pending");
  if (error) throw error;
  return (data ?? []).filter((o) => isKitchenEligible(o)).length;
}
