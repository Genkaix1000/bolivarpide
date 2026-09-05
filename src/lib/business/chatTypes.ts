import type { OrderLifecycleStatus } from "@/lib/orders/lifecycle";

/**
 * Chat data model derived from the real DB (whatsapp_messages + orders).
 * Statuses follow the actual order lifecycle (pending/preparing/delivering/
 * delivered/rejected) — no mock-only states like `ready`/`cancelled`.
 */

export type ChatOrderStatus = OrderLifecycleStatus;

export type ChatOrderItem = {
  name: string;
  quantity: number;
  priceCents: number;
  options?: string[];
  notes?: string;
};

export type ChatActiveOrder = {
  id: string;
  orderNumber: number;
  status: ChatOrderStatus;
  statusLabel: string;
  createdAt: string;
  totalCents: number;
  paymentMethod: string | null;
  paymentStatus: string;
  items: ChatOrderItem[];
  notes?: string | null;
};

export type PastOrder = {
  id: string;
  orderNumber: number;
  date: string;
  totalCents: number;
  status: "delivered" | "rejected";
  itemsSummary: string;
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string | null;
  address: string | null;
  notes?: string | null;
  totalOrdersCount: number;
  isFavorite?: boolean;
};

export type MessageType = "text" | "audio" | "image" | "video" | "sticker" | "document" | "unknown";

export type ChatMessage = {
  id: string;
  sender: "customer" | "business";
  type: MessageType;
  text?: string | null;
  audioDuration?: string | null;
  imageUrl?: string | null;
  media?: {
    mimeType: string | null;
    storageUrl: string | null;
    caption: string | null;
  } | null;
  timestamp: string;
  status?: "sent" | "delivered" | "read" | "failed";
  /** Motivo del fallo reportado por Meta (solo cuando status === "failed"). */
  errorTitle?: string | null;
};

export type LastMessagePreview = {
  text: string;
  timestamp: string;
  sender: "customer" | "business";
};

/** Badge de pedido en la lista: lo mínimo para el filtro y el subtítulo. */
export type ChatOrderBadge = {
  id: string;
  orderNumber: number;
  status: ChatOrderStatus;
  statusLabel: string;
};

/**
 * Fila de la lista de chats. Se arma con una agregación en la base
 * (`whatsapp_chat_summaries`), sin traer un solo mensaje: el historial completo
 * sólo se carga para el chat abierto.
 */
export type ChatSummary = {
  id: string; // chat_id
  customer: { id: string; name: string; phone: string; avatarUrl?: string | null };
  activeOrder: ChatOrderBadge | null;
  unreadCount: number;
  lastMessage: LastMessagePreview;
  /** Whether the free-form reply window (24h) is still open. */
  canReply: boolean;
};

export type Conversation = {
  id: string; // chat_id
  customer: CustomerProfile;
  activeOrder?: ChatActiveOrder | null;
  pastOrders: PastOrder[];
  sharedMedia: { id: string; url: string; label: string; date: string }[];
  unreadCount: number;
  lastMessage: LastMessagePreview;
  /** Página de mensajes, del más viejo al más nuevo. */
  messages: ChatMessage[];
  /** Hay mensajes más viejos para traer hacia atrás. */
  hasMoreMessages: boolean;
  /** Whether the free-form reply window (24h) is still open. */
  canReply: boolean;
};

export const QUICK_RESPONSES = [
  { id: "qr-1", label: "👨‍🍳 En cocina", text: "¡Hola! Tu pedido ya está en preparación en la cocina. Te avisamos ni bien salga con el repartidor." },
  { id: "qr-2", label: "🛵 En camino", text: "¡Buenas noticias! Tu pedido acaba de salir con el repartidor. Llegará en aproximadamente 15-20 minutos." },
  { id: "qr-3", label: "⏳ Demora", text: "Hola, te contamos que tenemos una demora extra de 15 minutos por alta demanda en cocina. ¡Ya estamos acelerando tu comanda!" },
  { id: "qr-4", label: "💳 Alias / CBU", text: "Podés abonar por transferencia al alias: bolivarpide.mp (Titular: Comercio). Por favor envianos el comprobante." },
  { id: "qr-5", label: "📋 Carta digital", text: "¡Hola! Podés ver nuestra carta completa y promociones actualizadas ingresando a nuestro catálogo online." },
  { id: "qr-6", label: "📍 Confirmar dirección", text: "Por favor, ¿nos confirmás entre qué calles se encuentra el domicilio y si hay algún timbre o referencia?" },
];

const TERMINAL_ORDER_STATUS: ChatOrderStatus[] = ["delivered", "rejected", "cancelled"];

/** `cancelled` es terminal: antes faltaba y un pedido cancelado seguía "vivo". */
export function isLiveOrder(
  order: { status: ChatOrderStatus } | null | undefined,
): boolean {
  return Boolean(order && !TERMINAL_ORDER_STATUS.includes(order.status));
}

export const CHAT_ORDER_STATUS_LABEL: Record<ChatOrderStatus, string> = {
  pending: "Nuevo",
  preparing: "En Cocina",
  delivering: "En Camino",
  delivered: "Entregado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};