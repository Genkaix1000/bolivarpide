"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { isLiveOrder, type Conversation } from "@/lib/business/chatTypes";

export type ListFilter = "all" | "orders" | "inquiry";

interface ChatListPaneProps {
  conversations: Conversation[];
  selectedId: string;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: ListFilter;
  onFilterChange: (f: ListFilter) => void;
  className?: string;
}

const FILTER_TABS: { id: ListFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "orders", label: "Con pedido" },
  { id: "inquiry", label: "Consultas" },
];

function hasLiveOrder(c: Conversation) {
  return isLiveOrder(c.activeOrder);
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
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.customer.name.toLowerCase().includes(q) ||
      c.customer.phone.includes(searchQuery) ||
      (c.activeOrder && String(c.activeOrder.orderNumber).includes(searchQuery));

    if (!matchesSearch) return false;
    if (activeFilter === "orders") return hasLiveOrder(c);
    if (activeFilter === "inquiry") return !hasLiveOrder(c);
    return true;
  });

  return (
    <aside className={cn("flex h-full min-h-0 flex-col select-none", className)}>
      <div className="shrink-0 border-b border-[#eee7de] px-3 pb-3 pt-3 dark:border-[#24201d]">
        <div className="mb-3 px-0.5">
          <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Chats
          </h2>
        </div>

        <div className="relative">
          <MagnifyingGlass
            weight="regular"
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar chat…"
            className="w-full rounded-md border border-transparent bg-[#f0ebe3] py-2 pl-9 pr-8 text-[12px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-[#9a0002]/25 dark:bg-[#201d1a] dark:text-stone-100"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              aria-label="Limpiar búsqueda"
            >
              <X weight="bold" size={15} />
            </button>
          ) : null}
        </div>

        <div className="mt-2.5 flex gap-1">
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-[#9a0002]/10 text-[#9a0002]"
                    : "bg-[#f0ebe3] text-stone-600 hover:bg-[#eae3d8] dark:bg-[#221e1b] dark:text-stone-300",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-stone-400">
            <p className="text-[13px] font-medium">No hay conversaciones</p>
            <p className="mt-0.5 text-[11px] text-stone-500">Probá otro filtro o búsqueda</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const selected = conv.id === selectedId;
            const live = hasLiveOrder(conv);
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "relative flex w-full items-center gap-3 overflow-hidden px-3 py-2.5 text-left transition-colors duration-150",
                  selected
                    ? "text-[#9a0002]"
                    : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
                )}
              >
                {selected && (
                  <>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.14),rgba(154,0,2,0.05)_42%,transparent_72%)] dark:bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.28),rgba(154,0,2,0.1)_45%,transparent_75%)]"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 z-[1] w-[3px] bg-[#9a0002]"
                    />
                  </>
                )}

                <div className="relative z-[1] shrink-0">
                  {conv.customer.avatarUrl ? (
                    <img
                      src={conv.customer.avatarUrl}
                      alt=""
                      className="h-11 w-11 rounded-md object-cover"
                    />
                  ) : (
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-md text-[13px] font-semibold",
                        selected
                          ? "bg-[#9a0002]/15 text-[#9a0002]"
                          : "bg-[#e8e0d6] text-stone-700 dark:bg-[#2b2521] dark:text-stone-200",
                      )}
                    >
                      {conv.customer.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="relative z-[1] min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-[13px] tracking-tight",
                        selected
                          ? "font-semibold text-[#9a0002]"
                          : "font-medium text-stone-900 dark:text-stone-100",
                      )}
                    >
                      {conv.customer.name}
                    </span>
                    <span className="shrink-0 text-[10px] font-medium text-stone-400">
                      {conv.lastMessage.timestamp}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p
                      className={cn(
                        "min-w-0 flex-1 truncate text-[12px]",
                        conv.unreadCount > 0
                          ? "font-medium text-stone-800 dark:text-stone-100"
                          : "text-stone-500 dark:text-stone-400",
                      )}
                    >
                      {conv.lastMessage.sender === "business" ? "Vos: " : ""}
                      {conv.lastMessage.text}
                    </p>
                    {conv.unreadCount > 0 ? (
                      <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-sm bg-[#9a0002] px-1 text-[9px] font-bold text-white">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  {live && conv.activeOrder ? (
                    <p className="mt-1 truncate text-[10px] font-medium text-[#9a0002] dark:text-red-400">
                      #{conv.activeOrder.orderNumber} · {conv.activeOrder.statusLabel}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
