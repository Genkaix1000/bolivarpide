"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { isLiveOrder, type ChatSummary } from "@/lib/business/chatTypes";

export type ListFilter = "all" | "orders" | "inquiry";

interface ChatListPaneProps {
  summaries: ChatSummary[];
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

function hasLiveOrder(c: ChatSummary) {
  return isLiveOrder(c.activeOrder);
}

export function ChatListPane({
  summaries,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  className,
}: ChatListPaneProps) {
  const filtered = summaries.filter((c) => {
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
        <div className="mb-3 flex items-center justify-between gap-2 px-0.5">
          <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">Chats</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>

        <div className="relative">
          <MaterialSymbol
            icon="search"
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar chat…"
            className="w-full rounded-full border border-transparent bg-[#f0ebe3] py-2 pl-9 pr-8 text-[12px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#9a0002]/25 dark:bg-[#201d1a] dark:text-gray-100"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <MaterialSymbol icon="close" size={15} />
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
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  active
                    ? "bg-[#9a0002] text-white"
                    : "bg-[#f0ebe3] text-gray-600 hover:bg-[#eae3d8] dark:bg-[#221e1b] dark:text-gray-300",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-gray-400">
            <p className="text-[13px] font-medium">No hay conversaciones</p>
            <p className="mt-0.5 text-[11px] text-gray-500">Probá otro filtro o búsqueda</p>
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
                  "flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors",
                  selected
                    ? "bg-[#9a0002] text-white shadow-sm"
                    : "hover:bg-[#f0ebe3] dark:hover:bg-[#1f1b19]",
                )}
              >
                <div className="relative shrink-0">
                  {conv.customer.avatarUrl ? (
                    <img
                      src={conv.customer.avatarUrl}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full text-[13px] font-bold",
                        selected
                          ? "bg-white/20 text-white"
                          : "bg-[#e8e0d6] text-gray-700 dark:bg-[#2b2521] dark:text-gray-200",
                      )}
                    >
                      {conv.customer.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  {live ? (
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 bg-emerald-500",
                        selected ? "border-[#9a0002]" : "border-[#fdfcfb] dark:border-[#161413]",
                      )}
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-[13px] font-semibold",
                        selected ? "text-white" : "text-gray-900 dark:text-gray-100",
                      )}
                    >
                      {conv.customer.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[10px] font-medium",
                        selected ? "text-white/75" : "text-gray-400",
                      )}
                    >
                      {conv.lastMessage.timestamp}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p
                      className={cn(
                        "min-w-0 flex-1 truncate text-[12px]",
                        selected
                          ? "text-white/85"
                          : conv.unreadCount > 0
                            ? "font-semibold text-gray-800 dark:text-gray-100"
                            : "text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {conv.lastMessage.sender === "business" ? "Vos: " : ""}
                      {conv.lastMessage.text}
                    </p>
                    {conv.unreadCount > 0 ? (
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          selected ? "bg-white" : "bg-[#9a0002]",
                        )}
                        aria-label="No leído"
                      />
                    ) : null}
                  </div>
                  {live && conv.activeOrder ? (
                    <p
                      className={cn(
                        "mt-1 truncate text-[10px] font-semibold",
                        selected ? "text-white/90" : "text-[#9a0002] dark:text-red-400",
                      )}
                    >
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
