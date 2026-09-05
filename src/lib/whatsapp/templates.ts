import { createServiceClient } from "@/lib/supabase/service";
import { getActiveWhatsAppConnection } from "@/lib/whatsapp/connection";
import { readConnectionToken } from "@/lib/whatsapp/oauth";
import {
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
} from "@/lib/whatsapp/send";
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

type NotifyResult = { ok: boolean; error?: string };

function copyFor(row: Pick<ShipUpdateRow, "fulfillment_type">, status: OrderLifecycleStatus) {
  return trackingCopy(
    status,
    undefined,
    row.fulfillment_type === "pickup" ? "pickup" : "delivery",
  );
}

/**
 * Sends an approved Meta template (order status) to a customer chat and
 * persists the outbound message. Only meaningful OUTSIDE the 24h window.
 */
export async function sendOrderStatusTemplate(
  businessId: string,
  chatId: string,
  row: ShipUpdateRow,
): Promise<NotifyResult> {
  const conn = await getActiveWhatsAppConnection(businessId);
  if (!conn) return { ok: false, error: "WhatsApp Business no está conectado" };
  if (!conn.notify_status || !conn.template_order_status_name) {
    return { ok: false, error: "Notificación de estado no configurada" };
  }

  // Mismo chequeo de vencimiento que el envío de texto: antes usaba
  // `readWhatsAppToken` directo y salía a pegarle a Meta con un token vencido.
  const token = await readConnectionToken({
    vault_token_ref: conn.vault_token_ref,
    token_expires_at: conn.token_expires_at,
  });
  if (!token) {
    return { ok: false, error: "Token de WhatsApp vencido o no disponible" };
  }

  const copy = copyFor(row, row.status as OrderLifecycleStatus);
  const templateName = conn.template_order_status_name;

  // Parámetros del componente `body`, en el orden de la template de ejemplo
  // `shipping_update`: 1) pedido 2) título 3) subtítulo.
  const res = await sendWhatsAppTemplateMessage({
    businessId,
    phoneNumberId: conn.phone_number_id,
    token,
    chatId,
    templateName,
    language: conn.template_order_status_language ?? "es_AR",
    bodyParams: [`#${row.order_number}`, copy.title, copy.subtitle],
    transcript: `${copy.title} — ${copy.subtitle} (template: ${templateName})`,
  });

  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

/**
 * Sends an order-status update to the WhatsApp customer:
 * - inside the 24h window  -> free text (allowed);
 * - outside the window     -> approved template (required by Meta), only if
 *   the business enabled notify_status and configured a template.
 * No-op for non-WhatsApp orders (source = web / no wa_chat_id).
 *
 * La dispara el sistema desde `advanceOrderStatus`, así que NO puede depender
 * de la sesión del request: usa los primitivos de `send.ts`, no el server
 * action `sendWhatsAppText`.
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
  const chatId = order.wa_chat_id;

  // Last inbound interaction determines the 24h window for this chat.
  const { data: lastInbound } = await svc
    .from("whatsapp_messages")
    .select("created_at")
    .eq("business_id", order.business_id)
    .eq("chat_id", chatId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!isWithinReplayWindow(lastInbound?.created_at)) {
    const res = await sendOrderStatusTemplate(order.business_id, chatId, order);
    if (!res.ok) {
      console.warn("notifyOrderStatusByWhatsApp template no enviada:", res.error);
    }
    return;
  }

  const conn = await getActiveWhatsAppConnection(order.business_id);
  if (!conn) return;
  const token = await readConnectionToken({
    vault_token_ref: conn.vault_token_ref,
    token_expires_at: conn.token_expires_at,
  });
  if (!token) {
    console.warn("notifyOrderStatusByWhatsApp: token vencido o no disponible");
    return;
  }

  const copy = copyFor(order, status);
  let text = `${copy.title}\n${copy.subtitle}`;
  if (status === "rejected" && order.rejection_reason) {
    text = `${text}\nMotivo: ${order.rejection_reason}`;
  }

  const res = await sendWhatsAppTextMessage({
    businessId: order.business_id,
    phoneNumberId: conn.phone_number_id,
    token,
    chatId,
    body: text,
  });
  if (!res.ok) {
    console.warn("notifyOrderStatusByWhatsApp texto libre falló:", res.error);
  }
}
