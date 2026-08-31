"use client";

import React, { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatListPane } from "./ChatListPane";
import { ChatConversationPane } from "./ChatConversationPane";
import { ChatContextPane } from "./ChatContextPane";
import {
  MOCK_CONVERSATIONS,
  type Conversation,
  type ChatOrderStatus,
  type ChatMessage,
} from "@/lib/business/mockChatData";
import { flashToast } from "@/components/FlashToast";
import { cn } from "@/lib/utils";

interface WhatsAppChatViewProps {
  businessId: string;
}

export function WhatsAppChatView({ businessId }: WhatsAppChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string>(MOCK_CONVERSATIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "preparing" | "delivering" | "ready" | "inquiry">("all");
  const [showContextPane, setShowContextPane] = useState(true);
  const [mobileScreen, setMobileScreen] = useState<"list" | "chat">("list");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedId) || conversations[0];
  }, [conversations, selectedId]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setMobileScreen("chat");
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleSendMessage = (text: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

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
          lastMessage: {
            text,
            timestamp: timeStr,
            sender: "business",
          },
          messages: [...conv.messages, newMsg],
        };
      })
    );
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: ChatOrderStatus) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

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
      })
    );

    flashToast(`Comanda actualizada a "${newLabel}"`);
  };

  return (
    <div className="w-full h-[calc(100dvh-6.5rem)] min-h-[560px] max-h-[880px] bg-white dark:bg-[#161413] rounded-2xl border border-black/5 dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.14)] overflow-hidden flex relative">
      {/* DESKTOP LAYOUT (3 Columns) */}
      <div className="hidden lg:grid h-full w-full grid-cols-[330px_1fr_auto] min-w-0">
        {/* Column 1: Chat List */}
        <ChatListPane
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelectConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Column 2: Active Conversation */}
        <ChatConversationPane
          conversation={selectedConversation}
          onSendMessage={handleSendMessage}
          onOpenContext={() => setShowContextPane((s) => !s)}
          showContextPane={showContextPane}
          onToggleContextPane={() => setShowContextPane((s) => !s)}
        />

        {/* Column 3: Context & Comanda */}
        {showContextPane && (
          <div className="w-[340px] xl:w-[360px] h-full shrink-0">
            <ChatContextPane
              conversation={selectedConversation}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          </div>
        )}
      </div>

      {/* MOBILE / TABLET TELEGRAM-STYLE LAYOUT */}
      <div className="lg:hidden flex h-full w-full relative overflow-hidden">
        {mobileScreen === "list" ? (
          <div className="w-full h-full">
            <ChatListPane
              conversations={conversations}
              selectedId={selectedId}
              onSelect={handleSelectConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              className="border-r-0 w-full"
            />
          </div>
        ) : (
          <div className="w-full h-full relative">
            <ChatConversationPane
              conversation={selectedConversation}
              onSendMessage={handleSendMessage}
              onOpenContext={() => setMobileDrawerOpen(true)}
              onBackMobile={() => setMobileScreen("list")}
              showContextPane={mobileDrawerOpen}
              onToggleContextPane={() => setMobileDrawerOpen((o) => !o)}
            />

            {/* Mobile Bottom Drawer / Slide-Over for Context & Comanda */}
            <AnimatePresence>
              {mobileDrawerOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="absolute inset-0 bg-black/50 backdrop-blur-xs z-40"
                  />
                  <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="absolute top-0 right-0 bottom-0 w-[85%] max-w-[360px] bg-white dark:bg-[#161413] z-50 shadow-2xl"
                  >
                    <ChatContextPane
                      conversation={selectedConversation}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                      onClose={() => setMobileDrawerOpen(false)}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
