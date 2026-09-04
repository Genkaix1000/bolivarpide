import { requireBusinessAccess, requireUser } from "@/lib/business/queries";
import { createServiceClient } from "@/lib/supabase/service";

export type WhatsAppConnection = {
  id: string;
  business_id: string;
  phone_number_id: string;
  display_phone_number: string | null;
  waba_id: string | null;
  status: "unverified" | "connected" | "error";
  is_active: boolean;
  notify_status: boolean;
  template_order_status_name: string | null;
  template_order_status_language: string;
  created_at: string;
  updated_at: string;
};

export type WhatsAppConnectionAdmin = WhatsAppConnection & {
  businesses: { name: string; slug: string } | null;
};

/** Business panel: the WhatsApp connection of a business (or null). */
export async function getWhatsAppConnection(
  businessId: string,
): Promise<WhatsAppConnection | null> {
  const { supabase } = await requireBusinessAccess(businessId);
  const { data } = await supabase
    .from("business_whatsapp")
    .select(
      "id, business_id, phone_number_id, display_phone_number, waba_id, status, is_active, notify_status, template_order_status_name, template_order_status_language, created_at, updated_at",
    )
    .eq("business_id", businessId)
    .maybeSingle();
  return (data ?? null) as WhatsAppConnection | null;
}

/** Admin: list all WhatsApp connections with their business name. */
export async function listWhatsAppConnectionsAdmin(): Promise<
  WhatsAppConnectionAdmin[]
> {
  const { user } = await requireUser();
  if (user.app_metadata?.role !== "admin") throw new Error("Forbidden");
  const service = createServiceClient();
  const { data } = await service
    .from("business_whatsapp")
    .select(
      "id, business_id, phone_number_id, display_phone_number, waba_id, status, is_active, notify_status, template_order_status_name, template_order_status_language, created_at, updated_at, businesses(name, slug)",
    )
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as WhatsAppConnectionAdmin[];
}