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

export type Conversation = {
  id: string; // chat_id
  customer: CustomerProfile;
  activeOrder?: ChatActiveOrder | null;
  pastOrders: PastOrder[];
  sharedMedia: { id: string; url: string; label: string; date: string }[];
  unreadCount: number;
  lastMessage: {
    text: string;
    timestamp: string;
    sender: "customer" | "business";
  };
  messages: ChatMessage[];
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

export function isLiveOrder(order: ChatActiveOrder | null | undefined): boolean {
  return Boolean(order && order.status !== "delivered" && order.status !== "rejected");
}