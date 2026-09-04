import { createServiceClient } from "@/lib/supabase/service";
import { getActiveWhatsAppConnection, readWhatsAppToken } from "@/lib/whatsapp/connection";
import { isWithinReplayWindow } from "@/lib/whatsapp/window";
import { trackingCopy, type OrderLifecycleStatus } from "@/lib/orders/lifecycle";

type ShipUpdateRow = {
  id: string;
  order_number: number;
  source: string;
  wa_chat_id: string | null;
  customer_phone: string | null;
  status: string;
  rejection_reason: string | null;
  fulfillment_type: string | null;
  business_id: string;
};

/**
 * Sends an approved Meta template (order status) to a customer chat and
 * persists the outbound message. Only meaningful OUTSIDE the 24h window.
 */
export async function sendOrderStatusTemplate(
  businessId: string,
  chatId: string,
  row: ShipUpdateRow,
): Promise<{ ok: boolean; error?: string }> {
  const conn = await getActiveWhatsAppConnection(businessId);
  if (!conn) return { ok: false, error: "WhatsApp Business no está conectado" };
  if (!conn.notify_status || !conn.template_order_status_name) {
    return { ok: false, error: "Notificación de estado no configurada" };
  }

  const token = await readWhatsAppToken(conn.vault_token_ref);
  if (!token) return { ok: false, error: "Token de WhatsApp no disponible" };

  const status = row.status as OrderLifecycleStatus;
  const copy = trackingCopy(status, undefined, row.fulfillment_type === "pickup" ? "pickup" : "delivery");
  const templateName = conn.template_order_status_name;
  const language = conn.template_order_status_language ?? "es_AR";

  const graphBase = process.env.META_GRAPH_VERSION
    ? `https://graph.facebook.com/${process.env.META_GRAPH_VERSION}`
    : "https://graph.facebook.com/v21.0";

  // shipping_update template components (Meta's sample app template):
  //   1: order# 2: shipping method 3: estimated delivery window
  const body = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: chatId,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: `#${row.order_number}` },
            { type: "text", text: copy.title },
            { type: "text", text: copy.subtitle },
          ],
        },
      ],
    },
  });

  const res = await fetch(`${graphBase}/${conn.phone_number_id}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  });
  const json = (await res.json().catch(() => null)) as {
    messages?: Array<{ id: string }>;
    error?: { message?: string } | null;
  } | null;

  if (!res.ok || !json?.messages?.[0]?.id) {
    const detail = json?.error?.message ?? `HTTP ${res.status}`;
    return { ok: false, error: detail };
  }

  // Persist as outbound so it shows in the integrated chat.
  const svc = createServiceClient();
  await svc.from("whatsapp_messages").insert({
    business_id: businessId,
    chat_id: chatId,
    direction: "outbound",
    type: "text",
    text_body: `${copy.title} — ${copy.subtitle} (template: ${templateName})`,
    wa_message_id: json.messages[0].id,
    status: "sent",
    customer_name: null,
  });

  return { ok: true };
}

/**
 * Sends an order-status update to the WhatsApp customer:
 * - inside the 24h window  -> free text (allowed);
 * - outside the window     -> approved template (required by Meta), only if
 *   the business enabled notify_status and configured a template.
 * No-op for non-WhatsApp orders (source = web / no wa_chat_id).
 */
export async function notifyOrderStatusByWhatsApp(
  orderId: string,
  status: OrderLifecycleStatus,
): Promise<void> {
  const svc = createServiceClient();
  const { data: row } = await svc
    .from("orders")
    .select(
      "id, order_number, source, wa_chat_id, customer_phone, status, rejection_reason, fulfillment_type, business_id",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!row) return;
  const order = row as ShipUpdateRow;
  if (order.source !== "whatsapp" || !order.wa_chat_id) return;

  // Last inbound interaction determines the 24h window for this chat.
  const { data: lastInbound } = await svc
    .from("whatsapp_messages")
    .select("created_at")
    .eq("business_id", order.business_id)
    .eq("chat_id", order.wa_chat_id)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (isWithinReplayWindow(lastInbound?.created_at)) {
    const { sendWhatsAppText } = await import("@/lib/whatsapp/actions");
    const copy = trackingCopy(status, undefined, order.fulfillment_type === "pickup" ? "pickup" : "delivery");
    let text = `${copy.title}\n${copy.subtitle}`;
    if (status === "rejected" && order.rejection_reason) {
      text = `${text}\nMotivo: ${order.rejection_reason}`;
    }
    const res = await sendWhatsAppText(order.business_id, order.wa_chat_id!, text);
    if (!res.ok) console.warn("notifyOrderStatusByWhatsApp free-text failed:", res.error);
    return;
  }

  await sendOrderStatusTemplate(order.business_id, order.wa_chat_id!, order);
}