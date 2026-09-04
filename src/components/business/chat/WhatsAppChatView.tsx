"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatListPane, type ListFilter } from "./ChatListPane";
import { ChatConversationPane } from "./ChatConversationPane";
import { ChatContextPane } from "./ChatContextPane";
import { ComandaBuilder } from "./ComandaBuilder";
import { LinkOrderModal } from "./LinkOrderModal";
import type { Conversation } from "@/lib/business/chatTypes";
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
  initialConversations: Conversation[];
  products: ChatProduct[];
  whatsappConnected: boolean;
}

async function fetchConversations(businessId: string): Promise<Conversation[]> {
  const res = await fetch(
  `/api/whatsapp/conversations?businessId=${encodeURIComponent(businessId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const j = (await res.json()) as { conversations?: Conversation[] };
  return j.conversations ?? [];
}

const STATUS_LABEL: Record<OrderLifecycleStatus, string> = {
  pending: "Nuevo",
  preparing: "En Cocina",
  delivering: "En Camino",
  delivered: "Entregado",
  rejected: "Rechazado",
};

export function WhatsAppChatView({
  businessId,
  businessName,
  initialConversations,
  products,
  whatsappConnected,
}: WhatsAppChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string>(initialConversations[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ListFilter>("all");
  const [showContextPane, setShowContextPane] = useState(false);
  const [mobileScreen, setMobileScreen] = useState<"list" | "chat">("list");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [comandaOpen, setComandaOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const refresh = useCallback(async () => {
    const next = await fetchConversations(businessId);
    setConversations(next);
    setSelectedId((cur) => (cur && next.some((c) => c.id === cur) ? cur : next[0]?.id ?? ""));
  }, [businessId]);

  // Realtime: new messages => refresh list; orders => refresh linked comandas.
  useEffect(() => {
    const supabase = createClient();
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
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`,
        },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [businessId, refresh]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? conversations[0] ?? null,
    [conversations, selectedId],
  );

  function handleSelectConversation(id: string) {
    setSelectedId(id);
    setMobileScreen("chat");
    void markChatRead(businessId, id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0, messages: c.messages.map((m) => (m.sender === "customer" ? { ...m, status: "read" as const } : m)) } : c)),
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
      void refresh();
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
      flashToast(`Comanda actualizada a "${STATUS_LABEL[newStatus]}"`);
      void refresh();
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
    void refresh();
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
    void refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f3efe8] dark:bg-[#1c1917]">
      <div className="hidden min-h-0 flex-1 lg:flex">
        <div className="flex h-full w-[300px] shrink-0 flex-col border-r border-[#e8e0d6] bg-[#fdfcfb] dark:border-[#2a2623] dark:bg-[#161413]">
          <ChatListPane
            conversations={conversations}
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
              conversations={conversations}
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