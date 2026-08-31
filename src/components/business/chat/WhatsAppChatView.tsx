"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatListPane, type ListFilter } from "./ChatListPane";
import { ChatConversationPane } from "./ChatConversationPane";
import { ChatContextPane } from "./ChatContextPane";
import {
  MOCK_CONVERSATIONS,
  type Conversation,
  type ChatOrderStatus,
  type ChatMessage,
} from "@/lib/business/mockChatData";
import { flashToast } from "@/components/FlashToast";

export function WhatsAppChatView({ businessId: _businessId }: { businessId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string>(MOCK_CONVERSATIONS[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ListFilter>("all");
  const [showContextPane, setShowContextPane] = useState(true);
  const [mobileScreen, setMobileScreen] = useState<"list" | "chat">("list");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? conversations[0],
    [conversations, selectedId],
  );

  function handleSelectConversation(id: string) {
    setSelectedId(id);
    setMobileScreen("chat");
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );
  }

  function handleSendMessage(text: string) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "business",
      type: "text",
      text,
      timestamp: timeStr,
      status: "delivered",
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== selectedId) return conv;
        return {
          ...conv,
          lastMessage: { text, timestamp: timeStr, sender: "business" },
          messages: [...conv.messages, newMsg],
        };
      }),
    );
  }

  function handleUpdateOrderStatus(orderId: string, newStatus: ChatOrderStatus) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const statusLabels: Record<ChatOrderStatus, string> = {
      pending: "Nuevo",
      preparing: "En Cocina",
      ready: "Listo para retirar",
      delivering: "En Camino",
      delivered: "Entregado",
      cancelled: "Cancelado",
    };

    const newLabel = statusLabels[newStatus];
    const systemEventMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: "business",
      type: "system_order_event",
      systemEvent: {
        title: `Estado actualizado: ${newLabel}`,
        description: `La comanda fue marcada como ${newLabel.toLowerCase()} a las ${timeStr}`,
        status: newStatus,
      },
      timestamp: timeStr,
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.activeOrder?.id !== orderId) return conv;
        return {
          ...conv,
          activeOrder: {
            ...conv.activeOrder,
            status: newStatus,
            statusLabel: newLabel,
          },
          messages: [...conv.messages, systemEventMsg],
        };
      }),
    );

    flashToast(`Comanda actualizada a "${newLabel}"`);
  }

  if (!selectedConversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-stone-500">
        Sin conversaciones
      </div>
    );
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
          <ChatConversationPane
            conversation={selectedConversation}
            onSendMessage={handleSendMessage}
            onOpenContext={() => setShowContextPane(true)}
            showContextPane={showContextPane}
            onToggleContextPane={() => setShowContextPane((s) => !s)}
          />

          <AnimatePresence>
            {showContextPane ? (
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
            <ChatConversationPane
              conversation={selectedConversation}
              onSendMessage={handleSendMessage}
              onOpenContext={() => setMobileDrawerOpen(true)}
              onBackMobile={() => setMobileScreen("list")}
              showContextPane={mobileDrawerOpen}
              onToggleContextPane={() => setMobileDrawerOpen((o) => !o)}
            />

            <AnimatePresence>
              {mobileDrawerOpen ? (
                <>
                  <motion.button
                    type="button"
                    aria-label="Cerrar detalles"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="absolute inset-0 z-40 bg-black/45"
                  />
                  <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 280 }}
                    className="absolute inset-y-0 right-0 z-50 w-[min(92vw,360px)] bg-[#fdfcfb] shadow-2xl dark:bg-[#161413]"
                  >
                    <ChatContextPane
                      conversation={selectedConversation}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                      onClose={() => setMobileDrawerOpen(false)}
                    />
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
