import { createServiceClient } from "@/lib/supabase/service";
import { requireBusinessAccess } from "@/lib/business/queries";
import { normalizeLifecycleStatus } from "@/lib/orders/lifecycle";
import { isWithinReplayWindow } from "@/lib/whatsapp/window";
import { storedPhoneFromWaId } from "@/lib/whatsapp/format";
import {
  CHAT_ORDER_STATUS_LABEL,
  isLiveOrder,
  type ChatActiveOrder,
  type ChatContactCard,
  type ChatLocation,
  type ChatMessage,
  type ChatOrderBadge,
  type ChatSummary,
  type Conversation,
  type MessageType,
  type PastOrder,
} from "@/lib/business/chatTypes";

/** Cuántos mensajes trae una página del chat abierto. */
export const CHAT_PAGE_SIZE = 50;

const MESSAGE_FIELDS =
  "id, business_id, chat_id, direction, type, text_body, media_json, wa_message_id, status, customer_name, read_at, created_at, error_code, error_title";

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
    file_name?: string | null;
    location?: ChatLocation | null;
    contacts?: ChatContactCard[] | null;
  } | null;
  wa_message_id: string | null;
  status: string;
  customer_name: string | null;
  read_at: string | null;
  created_at: string;
  error_code: number | null;
  error_title: string | null;
};

const ORDER_FIELDS =
  "id, order_number, status, customer_name, wa_chat_id, total_cents, payment_method, payment_status, notes, delivery_address, created_at, order_items(name, quantity, unit_price_cents, note)";

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
  delivery_address: string | null;
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
    case "location":
    case "contacts":
      return type;
    default:
      return "unknown";
  }
}

/** Texto corto para la lista de chats cuando el mensaje no es texto. */
function previewForType(type: string, hasMedia: boolean): string {
  switch (type) {
    case "image":
      return "📷 Imagen";
    case "audio":
      return "🎤 Audio";
    case "video":
      return "🎥 Video";
    case "sticker":
      return "🎨 Sticker";
    case "document":
      return "📄 Documento";
    case "location":
      return "📍 Ubicación";
    case "contacts":
      return "👤 Contacto";
    default:
      return hasMedia ? "📎 Adjunto" : "";
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

function statusLabel(raw: string): string {
  const status = normalizeLifecycleStatus(raw);
  return status ? CHAT_ORDER_STATUS_LABEL[status] : "Nuevo";
}

/** Cuánto vive una URL firmada de media. Alcanza para una sesión de panel. */
const MEDIA_URL_TTL_S = 60 * 60;

/**
 * Firma en lote las URLs de la media de una página de mensajes.
 *
 * El bucket `whatsapp-media` es privado: lo que mandan los clientes
 * (comprobantes, fotos con la dirección) no puede quedar accesible por URL.
 * La firma va por `storage_path`; `storage_url` era la URL pública vieja.
 */
async function signMediaUrls(
  svc: ReturnType<typeof createServiceClient>,
  rows: MessageRow[],
): Promise<Map<string, string>> {
  const paths = [
    ...new Set(
      rows
        .map((r) => r.media_json?.storage_path)
        .filter((p): p is string => Boolean(p)),
    ),
  ];
  if (paths.length === 0) return new Map();

  const { data, error } = await svc.storage
    .from("whatsapp-media")
    .createSignedUrls(paths, MEDIA_URL_TTL_S);
  if (error) {
    console.error("chatQueries: no se pudieron firmar las URLs de media", error);
    return new Map();
  }

  const signed = new Map<string, string>();
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
  }
  return signed;
}

function messageToChatMessage(
  row: MessageRow,
  signedUrls: Map<string, string>,
): ChatMessage {
  const isInbound = row.direction === "inbound";
  const media = row.media_json;
  const mediaUrl = media?.storage_path
    ? (signedUrls.get(media.storage_path) ?? null)
    : (media?.storage_url ?? null);

  let text = row.text_body;
  let imageUrl: string | null = null;
  let audioDuration: string | null = null;
  let type = mapMessageType(row.type);

  if (mediaUrl) {
    if (media?.mime_type?.startsWith("image/")) {
      imageUrl = mediaUrl;
      text = text ?? media.caption ?? null;
    } else if (media?.mime_type?.startsWith("audio/")) {
      type = "audio";
      // Meta no manda `duration` en el webhook: la muestra el reproductor.
      audioDuration = null;
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
          storageUrl: mediaUrl,
          caption: media.caption ?? null,
          fileName: media.file_name ?? null,
        }
      : null,
    location: media?.location ?? null,
    contacts: media?.contacts ?? null,
    timestamp: fmtTime(row.created_at),
    status:
      row.status === "delivered" || row.status === "read" || row.status === "failed"
        ? row.status
        : undefined,
    errorTitle: row.status === "failed" ? row.error_title : null,
  };
}

function mapOrder(row: OrderRow): ChatActiveOrder | null {
  const status = normalizeLifecycleStatus(row.status);
  if (!status) return null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    status,
    statusLabel: CHAT_ORDER_STATUS_LABEL[status],
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

type SummaryRow = {
  chat_id: string;
  customer_name: string | null;
  last_text: string | null;
  last_type: string;
  last_direction: "inbound" | "outbound";
  last_has_media: boolean;
  last_at: string;
  last_inbound_at: string | null;
  unread_count: number;
};

/**
 * Lista de conversaciones del negocio, ordenada por último mensaje.
 *
 * La agregación por chat corre en la base (`whatsapp_chat_summaries`): antes
 * esto traía el historial completo de mensajes del negocio para después
 * reducirlo en JS.
 */
export async function listChatSummaries(businessId: string): Promise<ChatSummary[]> {
  await requireBusinessAccess(businessId);
  const svc = createServiceClient();

  const [{ data: summaryRows, error: summaryErr }, { data: orderRows, error: orderErr }] =
    await Promise.all([
      svc.rpc("whatsapp_chat_summaries", { p_business_id: businessId }),
      // Sólo pedidos vivos: es lo único que la lista muestra, y así el límite
      // no puede dejar afuera el pedido activo de un chat (antes traía los 200
      // pedidos MÁS VIEJOS, porque ordenaba ascendente).
      svc
        .from("orders")
        .select("id, order_number, status, wa_chat_id, created_at")
        .eq("business_id", businessId)
        .not("wa_chat_id", "is", null)
        .in("status", ["pending", "preparing", "delivering"])
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  if (summaryErr) throw summaryErr;
  if (orderErr) throw orderErr;

  // El primero de cada chat es el más reciente (vienen ordenados desc).
  const activeByChat = new Map<string, ChatOrderBadge>();
  for (const o of (orderRows ?? []) as Array<{
    id: string;
    order_number: number;
    status: string;
    wa_chat_id: string | null;
  }>) {
    const chat = o.wa_chat_id;
    if (!chat || activeByChat.has(chat)) continue;
    const status = normalizeLifecycleStatus(o.status);
    if (!status || !isLiveOrder({ status })) continue;
    activeByChat.set(chat, {
      id: o.id,
      orderNumber: o.order_number,
      status,
      statusLabel: CHAT_ORDER_STATUS_LABEL[status],
    });
  }

  return ((summaryRows ?? []) as SummaryRow[]).map((row) => {
    const phone = storedPhoneFromWaId(row.chat_id) ?? row.chat_id;
    return {
      id: row.chat_id,
      customer: {
        id: row.chat_id,
        name: row.customer_name?.trim() || phone,
        phone,
      },
      activeOrder: activeByChat.get(row.chat_id) ?? null,
      unreadCount: row.unread_count ?? 0,
      lastMessage: {
        text: row.last_text ?? previewForType(row.last_type, row.last_has_media),
        timestamp: fmtTime(row.last_at),
        sender: row.last_direction === "inbound" ? "customer" : "business",
      },
      canReply: isWithinReplayWindow(row.last_inbound_at),
    };
  });
}

export type ChatDetailPage = {
  conversation: Conversation;
  /** Cursor para pedir la página anterior (created_at del mensaje más viejo). */
  nextCursor: string | null;
};

/**
 * Detalle del chat abierto: una página de mensajes (los más nuevos) + pedidos.
 *
 * `before` pagina hacia atrás con keyset sobre `created_at`, que es el orden
 * del índice `idx_whatsapp_messages_chat`.
 */
export async function getChatDetail(
  businessId: string,
  chatId: string,
  before?: string,
): Promise<ChatDetailPage | null> {
  await requireBusinessAccess(businessId);
  const svc = createServiceClient();

  let messageQuery = svc
    .from("whatsapp_messages")
    .select(MESSAGE_FIELDS)
    .eq("business_id", businessId)
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(CHAT_PAGE_SIZE + 1);
  if (before) messageQuery = messageQuery.lt("created_at", before);

  const [
    { data: msgRows, error: msgErr },
    { data: orderRows, error: orderErr },
    { count: totalOrders },
    { data: lastInboundRow },
  ] = await Promise.all([
    messageQuery,
    svc
      .from("orders")
      .select(ORDER_FIELDS)
      .eq("business_id", businessId)
      .eq("wa_chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(20),
    svc
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("wa_chat_id", chatId),
    // La ventana de 24 h se calcula sobre TODO el historial, no sobre la
    // página: si los últimos 50 mensajes son salientes, el último inbound
    // queda fuera de la página y `canReply` daría falso negativo.
    svc
      .from("whatsapp_messages")
      .select("created_at")
      .eq("business_id", businessId)
      .eq("chat_id", chatId)
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (msgErr) throw msgErr;
  if (orderErr) throw orderErr;

  const desc = (msgRows ?? []) as MessageRow[];
  const hasMoreMessages = desc.length > CHAT_PAGE_SIZE;
  const page = hasMoreMessages ? desc.slice(0, CHAT_PAGE_SIZE) : desc;
  // La UI los pinta del más viejo al más nuevo.
  const rows = [...page].reverse();
  const signedUrls = await signMediaUrls(svc, rows);
  const messages = rows.map((row) => messageToChatMessage(row, signedUrls));

  const orders = (orderRows ?? []) as OrderRow[]; // ya vienen desc
  const activeRow = orders.find((o) => {
    const status = normalizeLifecycleStatus(o.status);
    return status ? isLiveOrder({ status }) : false;
  });
  const doneRows = orders.filter((o) => {
    const status = normalizeLifecycleStatus(o.status);
    return status ? !isLiveOrder({ status }) : false;
  });

  const pastOrders: PastOrder[] = doneRows.slice(0, 5).map((o) => {
    const status = normalizeLifecycleStatus(o.status);
    return {
      id: o.id,
      orderNumber: o.order_number,
      date: fmtDate(o.created_at),
      totalCents: o.total_cents,
      status: status === "delivered" ? "delivered" : "rejected",
      itemsSummary: (o.order_items ?? [])
        .map((i) => `${i.quantity}× ${i.name}`)
        .join(" · "),
    };
  });

  const lastRow = rows[rows.length - 1];
  const lastMessage = messages[messages.length - 1];
  const phone = storedPhoneFromWaId(chatId) ?? chatId;
  // El nombre de perfil más reciente que haya reportado Meta.
  const name =
    [...rows].reverse().find((m) => m.customer_name)?.customer_name?.trim() || phone;

  return {
    conversation: {
      id: chatId,
      customer: {
        id: chatId,
        name,
        phone,
        // Antes acá iba `orders.notes`, que es el comentario del pedido.
        address: activeRow?.delivery_address ?? orders[0]?.delivery_address ?? null,
        totalOrdersCount: totalOrders ?? orders.length,
      },
      activeOrder: activeRow ? mapOrder(activeRow) : null,
      pastOrders,
      sharedMedia: rows
        .map((m) => {
          const path = m.media_json?.storage_path;
          const url = path ? signedUrls.get(path) : undefined;
          return url
            ? {
                id: m.id,
                url,
                label: m.media_json?.caption ?? "Archivo",
                date: fmtDate(m.created_at),
              }
            : null;
        })
        .filter((m): m is NonNullable<typeof m> => m !== null)
        .slice(-20),
      unreadCount: rows.filter((m) => m.direction === "inbound" && !m.read_at).length,
      lastMessage: lastMessage
        ? {
            text:
              lastMessage.text ??
              previewForType(lastRow?.type ?? "", Boolean(lastRow?.media_json)),
            timestamp: lastMessage.timestamp,
            sender: lastMessage.sender,
          }
        : { text: "", timestamp: "", sender: "customer" },
      messages,
      hasMoreMessages,
      canReply: isWithinReplayWindow(lastInboundRow?.created_at ?? null),
    },
    nextCursor: hasMoreMessages ? page[page.length - 1]?.created_at ?? null : null,
  };
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
    statusLabel: statusLabel(o.status),
    totalCents: o.total_cents,
    customerName: o.customer_name,
    createdAt: fmtDate(o.created_at),
  }));
}
