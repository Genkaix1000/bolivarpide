"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessAccess } from "@/lib/business/queries";
import { createServiceClient } from "@/lib/supabase/service";
import { getActiveWhatsAppConnection } from "@/lib/whatsapp/connection";
import { readConnectionToken } from "@/lib/whatsapp/oauth";
import { isWithinReplayWindow } from "@/lib/whatsapp/window";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp/send";
import { storedPhoneFromWaId } from "@/lib/whatsapp/format";

type SendResult = { ok: true } | { ok: false; error: string };

/** Sends a free text message from the business to a customer chat (24h window only). */
export async function sendWhatsAppText(
  businessId: string,
  chatId: string,
  text: string,
): Promise<SendResult> {
  const body = text.trim();
  if (!body) return { ok: false, error: "Mensaje vacío" };
  if (body.length > 4096) return { ok: false, error: "Mensaje muy largo" };

  await requireBusinessAccess(businessId);
  const conn = await getActiveWhatsAppConnection(businessId);
  if (!conn) return { ok: false, error: "WhatsApp Business no está conectado" };

  const token = await readConnectionToken({
    vault_token_ref: conn.vault_token_ref,
    token_expires_at: conn.token_expires_at,
  });
  if (!token) {
    return {
      ok: false,
      error:
        "Token de WhatsApp vencido o no disponible. Reconectá desde Configuración → Canales.",
    };
  }

  // 24h window: last inbound interaction for this chat.
  const svc = createServiceClient();
  const { data: lastInbound } = await svc
    .from("whatsapp_messages")
    .select("created_at")
    .eq("business_id", businessId)
    .eq("chat_id", chatId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!isWithinReplayWindow(lastInbound?.created_at)) {
    return { ok: false, error: "Ventana de 24 h vencida" };
  }

  // El envío y la persistencia (incluida la fila `failed` con el código de
  // Meta) viven en el primitivo; acá solo queda la autorización y la caché.
  const res = await sendWhatsAppTextMessage({
    businessId,
    phoneNumberId: conn.phone_number_id,
    token,
    chatId,
    body,
  });

  revalidatePath(`/negocio/${businessId}/whatsapp`);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

type ChatOrderItemInput = {
  productId?: string | null;
  name: string;
  quantity: number;
  unitPriceCents: number;
};

/**
 * "Mandar a comanda": creates a WhatsApp order visible in the kitchen board
 * and linked to the chat. Runs with service_role through the create_order RPC
 * (which validates unit prices against products of that business).
 */
export async function createWhatsAppOrder(
  businessId: string,
  chatId: string,
  items: ChatOrderItemInput[],
  customerName?: string,
): Promise<{ orderId: string } | { error: string }> {
  await requireBusinessAccess(businessId);

  const clean = items
    .map((i) => ({
      product_id: i.productId || null,
      name: i.name.trim(),
      quantity: i.quantity,
      unit_price_cents: i.unitPriceCents,
    }))
    .filter((i) => i.name && i.quantity > 0);

  if (clean.length === 0) return { error: "No hay ítems" };

  const svc = createServiceClient();
  const { data, error } = await svc.rpc("create_order", {
    p_business_id: businessId,
    p_customer_name: customerName?.trim() || null,
    p_customer_phone: storedPhoneFromWaId(chatId) ?? chatId,
    p_source: "whatsapp",
    p_wa_chat_id: chatId,
    p_delivery_address: null,
    p_notes: null,
    p_items: clean,
  });

  if (error) return { error: error.message };

  revalidatePath(`/negocio/${businessId}/whatsapp`);
  revalidatePath(`/negocio/${businessId}/pedidos`);
  return { orderId: data as string };
}

/** Links an existing kitchen order to a chat (orders.wa_chat_id). */
export async function linkOrderToChat(
  businessId: string,
  chatId: string,
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await requireBusinessAccess(businessId);

  const { data: order } = await supabase
    .from("orders")
    .select("id, business_id, wa_chat_id")
    .eq("id", orderId)
    .single();

  if (!order) return { ok: false, error: "Pedido no encontrado" };
  if (order.business_id !== businessId) {
    return { ok: false, error: "Pedido no pertenece a este negocio" };
  }

  const { error } = await supabase
    .from("orders")
    .update({ wa_chat_id: chatId, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/negocio/${businessId}/whatsapp`);
  revalidatePath(`/negocio/${businessId}/pedidos`);
  return { ok: true };
}

/** Marks a chat's inbound messages as read by the business. */
export async function markChatRead(businessId: string, chatId: string): Promise<void> {
  await requireBusinessAccess(businessId);
  const svc = createServiceClient();
  await svc
    .from("whatsapp_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .eq("chat_id", chatId)
    .eq("direction", "inbound")
    .is("read_at", null);
}