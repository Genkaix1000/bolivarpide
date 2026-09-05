"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatListPane, type ListFilter } from "./ChatListPane";
import { ChatConversationPane } from "./ChatConversationPane";
import { ChatContextPane } from "./ChatContextPane";
import { ComandaBuilder } from "./ComandaBuilder";
import { LinkOrderModal } from "./LinkOrderModal";
import {
  CHAT_ORDER_STATUS_LABEL,
  type ChatSummary,
  type Conversation,
} from "@/lib/business/chatTypes";
import type { OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import {
  sendWhatsAppText,
  createWhatsAppOrder,
  linkOrderToChat,
  markChatRead,
} from "@/lib/whatsapp/actions";
import { advanceOrderStatus } from "@/lib/orders/actions";
import { flashToast } from "@/components/FlashToast";
import { createClient } from "@/lib/supabase/client";
import { MaterialSymbol } from "@/components/ui/material-symbol";

type ChatProduct = {
  id: string;
  name: string;
  price_cents: number;
  available: boolean | null;
  description?: string | null;
};

interface WhatsAppChatViewProps {
  businessId: string;
  businessName: string;
  initialSummaries: ChatSummary[];
  initialConversation: Conversation | null;
  initialCursor: string | null;
  products: ChatProduct[];
  whatsappConnected: boolean;
}

async function fetchSummaries(businessId: string): Promise<ChatSummary[]> {
  const res = await fetch(
    `/api/whatsapp/conversations?businessId=${encodeURIComponent(businessId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const j = (await res.json()) as { conversations?: ChatSummary[] };
  return j.conversations ?? [];
}

async function fetchChatDetail(
  businessId: string,
  chatId: string,
  before?: string,
): Promise<{ conversation: Conversation | null; nextCursor: string | null }> {
  const params = new URLSearchParams({ businessId, chatId });
  if (before) params.set("before", before);
  const res = await fetch(`/api/whatsapp/messages?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return { conversation: null, nextCursor: null };
  return (await res.json()) as {
    conversation: Conversation | null;
    nextCursor: string | null;
  };
}


export function WhatsAppChatView({
  businessId,
  businessName,
  initialSummaries,
  initialConversation,
  initialCursor,
  products,
  whatsappConnected,
}: WhatsAppChatViewProps) {
  const [summaries, setSummaries] = useState<ChatSummary[]>(initialSummaries);
  const [selectedId, setSelectedId] = useState<string>(initialSummaries[0]?.id ?? "");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    initialConversation,
  );
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ListFilter>("all");
  const [showContextPane, setShowContextPane] = useState(false);
  const [mobileScreen, setMobileScreen] = useState<"list" | "chat">("list");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [comandaOpen, setComandaOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  // El realtime puede disparar en ráfaga (un lote de webhooks de Meta llega
  // como varios eventos). `selectedIdRef` evita re-suscribir el canal en cada
  // cambio de chat, que reabría la conexión cada vez.
  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshSummaries = useCallback(async () => {
    const next = await fetchSummaries(businessId);
    setSummaries(next);
  }, [businessId]);

  /** Recarga la página más nueva del chat abierto (una consulta acotada). */
  const reloadOpenChat = useCallback(async () => {
    const chatId = selectedIdRef.current;
    if (!chatId) return;
    const { conversation, nextCursor } = await fetchChatDetail(businessId, chatId);
    if (selectedIdRef.current !== chatId) return; // cambiaron de chat mientras tanto
    setSelectedConversation(conversation);
    setCursor(nextCursor);
  }, [businessId]);

  // Realtime acotado: antes CUALQUIER evento de `whatsapp_messages` u `orders`
  // del negocio recargaba el historial completo de todos los chats. Ahora sólo
  // se refresca la lista (una agregación) y, si el evento es del chat abierto,
  // su última página.
  useEffect(() => {
    const supabase = createClient();

    const onChange = (affectedChatId?: string | null) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void refreshSummaries();
        if (!affectedChatId || affectedChatId === selectedIdRef.current) {
          void reloadOpenChat();
        }
      }, 250);
    };

    const channel = supabase
      .channel(`whatsapp-chat-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_messages",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { chat_id?: string } | null;
          onChange(row?.chat_id ?? null);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { wa_chat_id?: string } | null;
          // Un pedido sin chat no afecta a ninguna conversación abierta.
          onChange(row?.wa_chat_id ?? null);
        },
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [businessId, refreshSummaries, reloadOpenChat]);

  const openChat = useCallback(
    async (id: string) => {
      setSelectedId(id);
      // Se escribe acá (event handler, no render) para que el guard de
      // "cambiaron de chat mientras cargaba" valga ya en este mismo tick.
      selectedIdRef.current = id;
      setSelectedConversation(null);
      setCursor(null);
      const { conversation, nextCursor } = await fetchChatDetail(businessId, id);
      if (selectedIdRef.current !== id) return;
      setSelectedConversation(conversation);
      setCursor(nextCursor);
    },
    [businessId],
  );

  async function handleLoadOlder() {
    if (!selectedConversation || !cursor || loadingOlder) return;
    setLoadingOlder(true);
    const { conversation, nextCursor } = await fetchChatDetail(
      businessId,
      selectedConversation.id,
      cursor,
    );
    if (conversation) {
      setSelectedConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...conversation.messages, ...prev.messages],
              hasMoreMessages: conversation.hasMoreMessages,
            }
          : prev,
      );
      setCursor(nextCursor);
    }
    setLoadingOlder(false);
  }

  function handleSelectConversation(id: string) {
    setMobileScreen("chat");
    void openChat(id);
    void markChatRead(businessId, id);
    setSummaries((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );
  }

  async function handleSendMessage(text: string) {
    if (!selectedConversation || sending) return;
    setSending(true);
    const res = await sendWhatsAppText(businessId, selectedConversation.id, text);
    if (!res.ok) {
      flashToast(`No se pudo enviar: ${res.error}`);
    } else {
      flashToast("Mensaje enviado");
      void refreshSummaries();
      void reloadOpenChat();
    }
    setSending(false);
  }

  async function handleUpdateOrderStatus(orderId: string, newStatus: OrderLifecycleStatus) {
    if (!selectedConversation || statusBusy) return;
    setStatusBusy(true);
    const res = await advanceOrderStatus({
      businessId,
      orderId,
      targetStatus: newStatus,
    });
    if (!res.ok) flashToast(res.error);
    else {
      flashToast(`Comanda actualizada a "${CHAT_ORDER_STATUS_LABEL[newStatus]}"`);
      void refreshSummaries();
      void reloadOpenChat();
    }
    setStatusBusy(false);
  }

  async function handleCreateComanda(items: { productId: string; name: string; quantity: number; unitPriceCents: number }[]) {
    if (!selectedConversation) return;
    const res = await createWhatsAppOrder(businessId, selectedConversation.id, items, selectedConversation.customer.name);
    if ("error" in res) {
      flashToast(`No se pudo crear: ${res.error}`);
      return;
    }
    flashToast("Comanda creada — revisá la comandera");
    setComandaOpen(false);
    void refreshSummaries();
    void reloadOpenChat();
  }

  async function handleLinkOrder(orderId: string) {
    if (!selectedConversation) return;
    const res = await linkOrderToChat(businessId, selectedConversation.id, orderId);
    if (!res.ok) {
      flashToast(res.error);
      return;
    }
    flashToast("Pedido vinculado a este chat");
    setLinkOpen(false);
    void refreshSummaries();
    void reloadOpenChat();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f3efe8] dark:bg-[#1c1917]">
      <div className="hidden min-h-0 flex-1 lg:flex">
        <div className="flex h-full w-[300px] shrink-0 flex-col border-r border-[#e8e0d6] bg-[#fdfcfb] dark:border-[#2a2623] dark:bg-[#161413]">
          <ChatListPane
            summaries={summaries}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        <div className="relative min-h-0 min-w-0 flex-1">
          {selectedConversation ? (
            <ChatConversationPane
              conversation={selectedConversation}
              businessName={businessName}
              onSendMessage={handleSendMessage}
              sending={sending}
              onOpenContext={() => setShowContextPane(true)}
              showContextPane={showContextPane}
              onToggleContextPane={() => setShowContextPane((s) => !s)}
              onNewComanda={() => setComandaOpen(true)}
              onLinkOrder={() => setLinkOpen(true)}
              onLoadOlder={handleLoadOlder}
              loadingOlder={loadingOlder}
            />
          ) : (
            <EmptyChat whatsappConnected={whatsappConnected} />
          )}

          <AnimatePresence>
            {showContextPane && selectedConversation ? (
              <motion.div
                key="context-desktop"
                initial={{ x: 24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 24, opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute inset-y-0 right-0 z-20 w-[min(100%,340px)] border-l border-[#e8e0d6] bg-[#fdfcfb] shadow-[-12px_0_32px_-18px_rgba(61,43,31,0.35)] dark:border-[#2a2623] dark:bg-[#161413]"
              >
                <ChatContextPane
                  conversation={selectedConversation}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onNewComanda={() => { setShowContextPane(false); setComandaOpen(true); }}
                  onLinkOrder={() => { setShowContextPane(false); setLinkOpen(true); }}
                  onClose={() => setShowContextPane(false)}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden lg:hidden">
        {mobileScreen === "list" ? (
          <div className="h-full w-full bg-[#fdfcfb] dark:bg-[#161413]">
            <ChatListPane
              summaries={summaries}
              selectedId={selectedId}
              onSelect={handleSelectConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </div>
        ) : (
          <div className="relative h-full w-full">
            {selectedConversation ? (
              <>
                <ChatConversationPane
                  conversation={selectedConversation}
                  businessName={businessName}
                  onSendMessage={handleSendMessage}
                  sending={sending}
                  onOpenContext={() => setMobileDrawerOpen(true)}
                  onBackMobile={() => setMobileScreen("list")}
                  showContextPane={mobileDrawerOpen}
                  onToggleContextPane={() => setMobileDrawerOpen((o) => !o)}
                  onNewComanda={() => setComandaOpen(true)}
                  onLinkOrder={() => setLinkOpen(true)}
                  onLoadOlder={handleLoadOlder}
                  loadingOlder={loadingOlder}
                />
                <AnimatePresence>
                  {mobileDrawerOpen ? (
                    <motion.div
                      key="context-mobile"
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", damping: 28, stiffness: 280 }}
                      className="absolute inset-y-0 right-0 z-50 w-[min(92vw,360px)] bg-[#fdfcfb] shadow-2xl dark:bg-[#161413]"
                    >
                      <ChatContextPane
                        conversation={selectedConversation}
                        onUpdateOrderStatus={handleUpdateOrderStatus}
                        onNewComanda={() => { setMobileDrawerOpen(false); setComandaOpen(true); }}
                        onLinkOrder={() => { setMobileDrawerOpen(false); setLinkOpen(true); }}
                        onClose={() => setMobileDrawerOpen(false)}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </>
            ) : (
              <EmptyChat whatsappConnected={whatsappConnected} />
            )}
          </div>
        )}
      </div>

      {comandaOpen && selectedConversation ? (
        <ComandaBuilder
          products={products.filter((p) => p.available !== false)}
          businessName={businessName}
          onClose={() => setComandaOpen(false)}
          onConfirm={handleCreateComanda}
        />
      ) : null}

      {linkOpen && selectedConversation ? (
        <LinkOrderModal
          businessId={businessId}
          businessName={businessName}
          onClose={() => setLinkOpen(false)}
          onConfirm={handleLinkOrder}
        />
      ) : null}
    </div>
  );
}

function EmptyChat({ whatsappConnected }: { whatsappConnected: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
        <MaterialSymbol icon="chat" size={30} className="text-emerald-600 dark:text-emerald-400" />
      </span>
      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Bandeja de WhatsApp</p>
      <p className="max-w-xs text-[12px] text-gray-500 dark:text-gray-400">
        {whatsappConnected
          ? "Las conversaciones de los clientes van a aparecer acá en tiempo real."
          : "Conectá tu número de WhatsApp Business desde Configuración → Canales para empezar a chatear."}
      </p>
    </div>
  );
}