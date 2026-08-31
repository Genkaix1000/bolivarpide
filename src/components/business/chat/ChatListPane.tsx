"use client";

import React from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import type { Conversation, ChatOrderStatus } from "@/lib/business/mockChatData";

type FilterTab = "all" | "preparing" | "delivering" | "ready" | "inquiry";

interface ChatListPaneProps {
  conversations: Conversation[];
  selectedId: string;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: FilterTab;
  onFilterChange: (f: FilterTab) => void;
  className?: string;
}

const FILTER_TABS: { id: FilterTab; label: string; icon?: string }[] = [
  { id: "all", label: "Todos" },
  { id: "preparing", label: "En cocina", icon: "skillet" },
  { id: "delivering", label: "En camino", icon: "delivery_dining" },
  { id: "ready", label: "Listos", icon: "check_circle" },
  { id: "inquiry", label: "Consultas", icon: "help_outline" },
];

function statusColor(status?: ChatOrderStatus) {
  switch (status) {
    case "preparing":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20";
    case "delivering":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/20";
    case "ready":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    case "delivered":
      return "bg-gray-100 text-gray-600 dark:bg-stone-800 dark:text-gray-400 border-gray-200 dark:border-stone-700";
    default:
      return "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700";
  }
}

export function ChatListPane({
  conversations,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  className,
}: ChatListPaneProps) {
  const filtered = conversations.filter((c) => {
    // Search query filter
    const matchesSearch =
      searchQuery.trim() === "" ||
      c.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer.phone.includes(searchQuery) ||
      (c.activeOrder && c.activeOrder.orderNumber.toString().includes(searchQuery));

    if (!matchesSearch) return false;

    // Tab filter
    if (activeFilter === "all") return true;
    if (activeFilter === "preparing") return c.activeOrder?.status === "preparing";
    if (activeFilter === "delivering") return c.activeOrder?.status === "delivering";
    if (activeFilter === "ready") return c.activeOrder?.status === "ready";
    if (activeFilter === "inquiry") return !c.activeOrder || c.activeOrder.status === "delivered";

    return true;
  });

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-[#fdfcfb] dark:bg-[#161413] border-r border-[#e8e0d6] dark:border-[#2a2623] select-none",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 pb-3 border-b border-[#eee7de] dark:border-[#24201d]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#25d366]/15 flex items-center justify-center text-[#25d366]">
              <MaterialSymbol icon="chat" size={18} fill />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                WhatsApp
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Atención & Comandas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MaterialSymbol
            icon="search"
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por cliente, tel o #pedido..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-[12px] bg-[#f0ebe3] dark:bg-[#201d1a] border border-transparent focus:border-[#9a0002]/30 dark:focus:border-[#9a0002]/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <MaterialSymbol icon="close" size={15} />
            </button>
          )}
        </div>

        {/* State Filter Tabs */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-0.5">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-1",
                  isActive
                    ? "bg-[#9a0002] text-white shadow-sm font-semibold"
                    : "bg-[#f0ebe3]/80 hover:bg-[#eae3d8] dark:bg-[#221e1b] dark:hover:bg-[#2a2623] text-gray-600 dark:text-gray-300"
                )}
              >
                {tab.icon && <MaterialSymbol icon={tab.icon} size={12} />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#f0ebe3]/60 dark:divide-[#221e1b]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <MaterialSymbol icon="chat_bubble_outline" size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-[13px] font-medium">No hay conversaciones</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Probá cambiando el filtro o la búsqueda</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = conv.id === selectedId;
            const hasActiveOrder = Boolean(conv.activeOrder && conv.activeOrder.status !== "delivered" && conv.activeOrder.status !== "cancelled");
            return (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(conv.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(conv.id);
                  }
                }}
                className={cn(
                  "w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer relative",
                  isSelected
                    ? "bg-[#9a0002]/8 dark:bg-[#9a0002]/15 border-l-4 border-[#9a0002]"
                    : "hover:bg-[#f5efe7]/70 dark:hover:bg-[#1f1b19]"
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0 mt-0.5">
                  {conv.customer.avatarUrl ? (
                    <img
                      src={conv.customer.avatarUrl}
                      alt={conv.customer.name}
                      className="w-11 h-11 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#e8e0d6] dark:bg-[#2b2521] text-gray-700 dark:text-gray-200 flex items-center justify-center font-bold text-sm">
                      {conv.customer.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  {hasActiveOrder && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#9a0002] border-2 border-white dark:border-[#161413] flex items-center justify-center text-[7px] font-black text-white">
                      ●
                    </span>
                  )}
                </div>

                {/* Info & Message Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1 mb-0.5">
                    <span
                      className={cn(
                        "text-[13px] truncate",
                        isSelected
                          ? "font-bold text-[#9a0002] dark:text-red-400"
                          : "font-semibold text-gray-900 dark:text-gray-100"
                      )}
                    >
                      {conv.customer.name}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                      {conv.lastMessage.timestamp}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "text-[12px] line-clamp-1 mb-1.5",
                      conv.unreadCount > 0
                        ? "font-semibold text-gray-900 dark:text-gray-100"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {conv.lastMessage.sender === "business" && (
                      <span className="text-gray-400 font-normal">Vos: </span>
                    )}
                    {conv.lastMessage.text}
                  </p>

                  {/* Active Order Pill or Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {conv.activeOrder && conv.activeOrder.status !== "delivered" ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border",
                          statusColor(conv.activeOrder.status)
                        )}
                      >
                        <span className="font-bold">#{conv.activeOrder.orderNumber}</span>
                        <span>·</span>
                        <span>{conv.activeOrder.statusLabel}</span>
                      </span>
                    ) : (
                      conv.customer.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-[#ebe4db] dark:bg-[#25201d] text-gray-600 dark:text-gray-400"
                        >
                          {tag}
                        </span>
                      ))
                    )}

                    {conv.unreadCount > 0 && (
                      <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[#25d366] px-1 text-[9px] font-black text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
