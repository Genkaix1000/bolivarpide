import { createServiceClient } from "@/lib/supabase/service";
import { requireBusinessAccess } from "@/lib/business/queries";
import { normalizeLifecycleStatus } from "@/lib/orders/lifecycle";
import { isWithinReplayWindow } from "@/lib/whatsapp/window";
import { storedPhoneFromWaId } from "@/lib/whatsapp/format";
import type {
  ChatActiveOrder,
  ChatMessage,
  Conversation,
  MessageType,
  PastOrder,
} from "@/lib/business/chatTypes";

const MESSAGE_FIELDS =
  "id, business_id, chat_id, direction, type, text_body, media_json, wa_message_id, status, customer_name, read_at, created_at";

type MessageRow = {
  id: string;
  business_id: string;
  chat_id: string;
  direction: "inbound" | "outbound";
  type: string;
  text_body: string | null;
  media_json: {
    mime_type?: string;
    storage_path?: string | null;
    storage_url?: string | null;
    caption?: string | null;
    duration_ms?: number | null;
  } | null;
  wa_message_id: string | null;
  status: string;
  customer_name: string | null;
  read_at: string | null;
  created_at: string;
};

const ORDER_FIELDS =
  "id, order_number, status, customer_name, wa_chat_id, total_cents, payment_method, payment_status, notes, created_at, order_items(name, quantity, unit_price_cents, note)";

type OrderRow = {
  id: string;
  order_number: number;
  status: string;
  customer_name: string | null;
  wa_chat_id: string | null;
  total_cents: number;
  payment_method: string | null;
  payment_status: string;
  notes: string | null;
  created_at: string;
  order_items: Array<{
    name: string;
    quantity: number;
    unit_price_cents: number;
    note?: string | null;
  }>;
};

function mapMessageType(type: string): MessageType {
  switch (type) {
    case "text":
    case "audio":
    case "image":
    case "video":
    case "sticker":
    case "document":
      return type;
    default:
      return "unknown";
  }
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function messageToChatMessage(row: MessageRow): ChatMessage {
  const isInbound = row.direction === "inbound";
  const media = row.media_json;

  let text = row.text_body;
  let imageUrl: string | null = null;
  let audioDuration: string | null = null;
  let type = mapMessageType(row.type);

  if (media?.storage_url) {
    if (media.mime_type?.startsWith("image/")) {
      imageUrl = media.storage_url;
      text = text ?? media.caption ?? "📷 Imagen";
    } else if (media.mime_type?.startsWith("audio/")) {
      type = "audio";
      audioDuration = media.duration_ms
        ? `${Math.round(media.duration_ms / 1000)}:${String(media.duration_ms % 1000 / 10).padStart(2, "0")}`
        : null;
      text = text ?? "🎤 Audio";
    }
  }

  return {
    id: row.id,
    sender: isInbound ? "customer" : "business",
    type,
    text,
    audioDuration,
    imageUrl,
    media: media
      ? {
          mimeType: media.mime_type ?? null,
          storageUrl: media.storage_url ?? null,
          caption: media.caption ?? null,
        }
      : null,
    timestamp: fmtTime(row.created_at),
    status: row.status === "delivered" || row.status === "read" ? row.status : undefined,
  };
}

function mapOrder(row: OrderRow): ChatActiveOrder | null {
  const status = normalizeLifecycleStatus(row.status);
  if (!status) return null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    status,
    statusLabel: STATUS_LABEL[status],
    createdAt: fmtDate(row.created_at),
    totalCents: row.total_cents,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    notes: row.notes,
    items: (row.order_items ?? []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      priceCents: i.unit_price_cents,
      notes: i.note ?? undefined,
    })),
  };
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Nuevo",
  preparing: "En Cocina",
  delivering: "En Camino",
  delivered: "Entregado",
  rejected: "Rechazado",
};

/**
 * Loads the WhatsApp conversations of a business grouped by chat_id,
 * joined with their linked orders (wa_chat_id). Sorted by last message desc.
 */
export async function listChatConversations(businessId: string): Promise<Conversation[]> {
  await requireBusinessAccess(businessId);
  const svc = createServiceClient();

  const [{ data: msgRows, error: msgErr }, { data: orderRows, error: orderErr }] = await Promise.all([
    svc.from("whatsapp_messages").select(MESSAGE_FIELDS).eq("business_id", businessId).order("created_at", { ascending: true }),
    svc
      .from("orders")
      .select(ORDER_FIELDS)
      .eq("business_id", businessId)
      .not("wa_chat_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);
  if (msgErr) throw msgErr;
  if (orderErr) throw orderErr;

  const messages = (msgRows ?? []) as MessageRow[];
  const orders = (orderRows ?? []) as OrderRow[];

  // Group messages by chat_id (preserving chronological order).
  const byChat = new Map<string, MessageRow[]>();
  for (const m of messages) {
    const list = byChat.get(m.chat_id) ?? [];
    list.push(m);
    byChat.set(m.chat_id, list);
  }

  // Read window epoch: last inbound timestamp per chat.
  const lastInboundAt = new Map<string, string>();
  for (const m of messages) {
    if (m.direction !== "inbound") continue;
    const cur = lastInboundAt.get(m.chat_id);
    if (!cur || m.created_at > cur) lastInboundAt.set(m.chat_id, m.created_at);
  }

  // Orders per chat: newest => activeOrder, older done => pastOrders.
  const ordersByChat = new Map<string, OrderRow[]>();
  for (const o of orders) {
    const chat = o.wa_chat_id!;
    const list = ordersByChat.get(chat) ?? [];
    list.push(o);
    ordersByChat.set(chat, list);
  }

  const conversations: Conversation[] = [];
  for (const [chatId, msgs] of byChat) {
    // Customer identity: prefer the contact name Meta reports.
    let name = (msgs.find((m) => m.customer_name)?.customer_name ?? "").trim();
    if (!name) {
      const storePhone = storedPhoneFromWaId(chatId);
      name = storePhone ?? chatId;
    }

    const chatOrders = (ordersByChat.get(chatId) ?? []).sort(
      (a, b) => a.created_at.localeCompare(b.created_at),
    );
    const active = chatOrders.filter((o) => !["delivered", "rejected"].includes(o.status));
    const done = chatOrders.filter((o) => ["delivered", "rejected"].includes(o.status));

    const activeOrderRow = active[active.length - 1];
    const activeOrder = activeOrderRow ? mapOrder(activeOrderRow) : null;

    const pastOrders: PastOrder[] = done.slice(-5).reverse().map((o) => {
      const status = normalizeLifecycleStatus(o.status);
      return {
        id: o.id,
        orderNumber: o.order_number,
        date: fmtDate(o.created_at),
        totalCents: o.total_cents,
        status: status === "rejected" ? "rejected" : "delivered",
        itemsSummary: (o.order_items ?? [])
          .map((i) => `${i.quantity}× ${i.name}`)
          .join(" · "),
      };
    });

    const last = msgs[msgs.length - 1];
    const unreadCount = msgs.filter((m) => m.direction === "inbound" && !m.read_at).length;

    conversations.push({
      id: chatId,
      customer: {
        id: chatId,
        name,
        phone: storedPhoneFromWaId(chatId) ?? chatId,
        address: activeOrderRow?.notes ?? null,
        totalOrdersCount: chatOrders.length,
      },
      activeOrder,
      pastOrders,
      sharedMedia: msgs
        .filter((m) => m.media_json?.storage_url)
        .slice(-20)
        .map((m) => ({
          id: m.id,
          url: m.media_json!.storage_url!,
          label: m.media_json!.caption ?? "Archivo",
          date: fmtDate(m.created_at),
        })),
      unreadCount,
      lastMessage: {
        text: last.text_body ?? (last.media_json ? "📎 adjunto" : ""),
        timestamp: fmtTime(last.created_at),
        sender: last.direction === "inbound" ? "customer" : "business",
      },
      messages: msgs.map(messageToChatMessage),
      canReply: isWithinReplayWindow(lastInboundAt.get(chatId) ?? null),
    });
  }

  conversations.sort((a, b) => {
    const lastA = byChat.get(a.id)?.at(-1)?.created_at ?? "";
    const lastB = byChat.get(b.id)?.at(-1)?.created_at ?? "";
    return lastB.localeCompare(lastA);
  });

  return conversations;
}

export type LinkableOrder = {
  id: string;
  orderNumber: number;
  statusLabel: string;
  totalCents: number;
  customerName: string | null;
  createdAt: string;
};

/** Orders of the business (pending/preparing/delivering) to link into a chat. */
export async function listLinkableOrders(businessId: string): Promise<LinkableOrder[]> {
  await requireBusinessAccess(businessId);
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("orders")
    .select("id, order_number, status, total_cents, customer_name, created_at")
    .eq("business_id", businessId)
    .in("status", ["pending", "preparing", "delivering"])
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;

  return (data ?? []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    statusLabel: STATUS_LABEL[normalizeLifecycleStatus(o.status) ?? "pending"] ?? "Nuevo",
    totalCents: o.total_cents,
    customerName: o.customer_name,
    createdAt: fmtDate(o.created_at),
  }));
}