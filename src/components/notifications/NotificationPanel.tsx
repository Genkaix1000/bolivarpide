"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { flashToastUndo } from "@/components/FlashToast";
import { cn } from "@/lib/utils";
import { buildCustomerNotificationList } from "@/lib/notifications/customerList";
import {
  absoluteTime,
  BUSINESS_TABS,
  countUnreadByTab,
  filterByTab,
  groupByDay,
  relativeTime,
  sortNotifications,
  tabIds,
} from "@/lib/notifications/display";
import type { ActiveCustomerOrder } from "@/lib/orders/active";
import type { AppNotification, NotificationTab } from "@/lib/notifications/types";

const DELETE_DELAY_MS = 4500;
const SWIPE_DELETE_PX = 88;

type NotificationPanelProps = {
  items: AppNotification[];
  variant: "business" | "customer";
  onMarkRead: (input?: { id?: string; all?: boolean }) => void | Promise<void>;
  onRemove?: (input?: { id?: string; all?: boolean }) => void | Promise<void>;
  onClose?: () => void;
  settingsHref?: string;
  activeOrder?: ActiveCustomerOrder | null;
  className?: string;
};

export function NotificationPanel({
  items,
  variant,
  onMarkRead,
  onRemove,
  onClose,
  settingsHref,
  activeOrder,
  className,
}: NotificationPanelProps) {
  const tabs = BUSINESS_TABS;
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const pendingDeletes = useRef<Map<string, number>>(new Map());
  const isCustomer = variant === "customer";

  const displayItems = useMemo(() => {
    const base = isCustomer
      ? buildCustomerNotificationList(items, activeOrder)
      : sortNotifications(filterByTab(items, activeTab));
    return base.filter((n) => {
      if (hiddenIds.has(n.id)) return false;
      if (n.entityId && hiddenIds.has(`active-${n.entityId}`)) return false;
      return true;
    });
  }, [items, activeOrder, isCustomer, activeTab, hiddenIds]);

  const counts = useMemo(
    () => countUnreadByTab(items, tabIds(tabs)),
    [items, tabs],
  );
  const groups = useMemo(
    () => (isCustomer ? [{ label: "", items: displayItems }] : groupByDay(displayItems)),
    [isCustomer, displayItems],
  );
  const hasUnread = isCustomer
    ? displayItems.some((n) => !n.readAt)
    : counts.all > 0;

  useEffect(() => {
    // Apenas se abre el panel de notificaciones, se marcan todas como leídas
    void onMarkRead({ all: true });
    if (activeOrder?.orderId && activeOrder?.status) {
      try {
        localStorage.setItem(`bp_read_order_${activeOrder.orderId}`, activeOrder.status);
      } catch {
        /* ignore */
      }
    }
  }, [onMarkRead, activeOrder]);

  function hideItem(item: AppNotification) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      if (item.entityId) next.add(`active-${item.entityId}`);
      return next;
    });
  }

  function unhideItem(item: AppNotification) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      if (item.entityId) next.delete(`active-${item.entityId}`);
      return next;
    });
    if (item.entityId) {
      try {
        localStorage.removeItem(`bp_dismissed_order_${item.entityId}`);
      } catch {
        /* ignore */
      }
    }
  }

  function scheduleRemove(item: AppNotification) {
    if (!onRemove) return;
    hideItem(item);

    const prev = pendingDeletes.current.get(item.id);
    if (prev) window.clearTimeout(prev);

    const timeout = window.setTimeout(() => {
      pendingDeletes.current.delete(item.id);
      if (item.id.startsWith("active-") || item.entityId) {
        const orderId = item.entityId || item.id.replace("active-", "");
        try {
          localStorage.setItem(`bp_dismissed_order_${orderId}`, "true");
        } catch {
          /* ignore */
        }
      }
      if (!item.id.startsWith("active-")) void onRemove({ id: item.id });
    }, DELETE_DELAY_MS);
    pendingDeletes.current.set(item.id, timeout);

    flashToastUndo({
      message: "Notificación eliminada",
      onUndo: () => {
        const t = pendingDeletes.current.get(item.id);
        if (t) window.clearTimeout(t);
        pendingDeletes.current.delete(item.id);
        unhideItem(item);
      },
    });
  }

  return (
    <div
      className={cn(
        "w-[min(100vw-2rem,380px)] rounded-2xl border border-[#e8e0d6] bg-white p-3 shadow-xl dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-[#ece8e2]",
        className,
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2 px-0.5">
        <h3 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Notificaciones</h3>
        <div className="flex items-center gap-1">
          {settingsHref ? (
            <Link
              href={settingsHref}
              onClick={onClose}
              aria-label="Configuración de notificaciones"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-[#f5f1eb] dark:hover:bg-[#2a2623]"
            >
              <MaterialSymbol icon="settings" size={17} />
            </Link>
          ) : null}
        </div>
      </div>

      {!isCustomer ? (
        <div className="mb-2 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {tabs.map((tab) => {
            const count = counts[tab.id];
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  active
                    ? "bg-[#9a0002] text-white"
                    : "bg-[#f5f1eb] text-gray-600 hover:bg-[#ede4d9] dark:bg-[#2a2623] dark:text-gray-300",
                )}
              >
                {tab.label}
                {count > 0 ? ` · ${count}` : ""}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="max-h-[min(60vh,400px)] space-y-0.5 overflow-y-auto overflow-x-hidden pr-0.5">
        {displayItems.length === 0 ? (
          <p className="px-1 py-6 text-center text-[11px] text-gray-500">Sin novedades por ahora.</p>
        ) : (
          groups.map((group, gi) => (
            <div key={group.label || `g-${gi}`}>
              {group.label ? (
                <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  {group.label}
                </p>
              ) : null}
              <div>
                {group.items.map((item, idx) =>
                  isCustomer ? (
                    <CustomerNotificationRow
                      key={item.id}
                      item={item}
                      showDivider={idx < group.items.length - 1}
                      onOpen={() => {
                        if (!item.id.startsWith("active-")) void onMarkRead({ id: item.id });
                        onClose?.();
                      }}
                      onRemove={onRemove ? () => scheduleRemove(item) : undefined}
                    />
                  ) : (
                    <BusinessNotificationRow
                      key={item.id}
                      item={item}
                      showDivider={idx < group.items.length - 1}
                      onOpen={() => {
                        void onMarkRead({ id: item.id });
                        onClose?.();
                      }}
                      onRemove={onRemove ? () => scheduleRemove(item) : undefined}
                    />
                  ),
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SwipeToDelete({
  enabled,
  onDelete,
  children,
}: {
  enabled: boolean;
  onDelete: () => void;
  children: (opts: { suppressClick: boolean }) => ReactNode;
}) {
  const x = useMotionValue(0);
  const dragged = useRef(false);
  const [suppressClick, setSuppressClick] = useState(false);

  if (!enabled) return <>{children({ suppressClick: false })}</>;

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        className="absolute inset-y-0 right-0 flex w-24 items-center justify-end bg-[#9a0002] px-4"
        aria-hidden
      >
        <MaterialSymbol icon="delete" size={20} className="text-white" />
      </div>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.08}
        style={{ x }}
        className="relative z-10 touch-pan-y bg-white dark:bg-[#231f1c]"
        onDragStart={() => {
          dragged.current = true;
          setSuppressClick(true);
        }}
        onDragEnd={(_, info) => {
          const shouldDelete = info.offset.x < -SWIPE_DELETE_PX || info.velocity.x < -600;
          if (shouldDelete) {
            void animate(x, -420, { type: "spring", stiffness: 380, damping: 36 });
            onDelete();
            return;
          }
          void animate(x, 0, { type: "spring", stiffness: 420, damping: 34 });
          window.setTimeout(() => {
            dragged.current = false;
            setSuppressClick(false);
          }, 40);
        }}
      >
        {children({ suppressClick })}
      </motion.div>
    </div>
  );
}

function BusinessAvatar({ item }: { item: AppNotification }) {
  if (item.emoji) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f1eb] text-base dark:bg-[#2a2623]">
        {item.emoji}
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#9a0002]/10 text-[#9a0002]">
      <MaterialSymbol icon={item.icon ?? "notifications"} size={18} />
    </span>
  );
}

function BusinessNotificationRow({
  item,
  showDivider,
  onOpen,
  onRemove,
}: {
  item: AppNotification;
  showDivider: boolean;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  const unread = !item.readAt;
  const rowClass =
    "flex w-full gap-2.5 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-[#f5f1eb]/70 dark:hover:bg-[#2a2623]/50";

  const inner = (
    <>
      <BusinessAvatar item={item} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-[12px] leading-snug text-gray-800 dark:text-[#d4cfc9]", unread && "font-semibold")}>
          {item.title}
        </p>
        {item.body ? <p className="mt-0.5 text-[11px] text-gray-500">{item.body}</p> : null}
        <div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-gray-400">
          <span>{absoluteTime(item.createdAt)}</span>
          <span>·</span>
          <span>{relativeTime(item.createdAt)}</span>
        </div>
      </div>
      {unread ? (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#9a0002]" aria-label="No leída" />
      ) : null}
    </>
  );

  return (
    <div>
      <SwipeToDelete enabled={Boolean(onRemove)} onDelete={() => onRemove?.()}>
        {({ suppressClick }) =>
          item.actionUrl ? (
            <Link
              href={item.actionUrl}
              className={rowClass}
              onClick={(e) => {
                if (suppressClick) {
                  e.preventDefault();
                  return;
                }
                onOpen();
              }}
            >
              {inner}
            </Link>
          ) : (
            <button
              type="button"
              className={cn(rowClass, "cursor-pointer")}
              onClick={() => {
                if (suppressClick) return;
                onOpen();
              }}
            >
              {inner}
            </button>
          )
        }
      </SwipeToDelete>
      {showDivider ? <Divider /> : null}
    </div>
  );
}

function CustomerNotificationRow({
  item,
  showDivider,
  onOpen,
  onRemove,
}: {
  item: AppNotification;
  showDivider: boolean;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  const unread = !item.readAt;
  const p = item.payload;
  const businessName = p.businessName ?? item.title;
  const statusLabel = p.statusLabel ?? item.title;
  const cancelled =
    statusLabel.toLowerCase().includes("cancel") || Boolean(p.rejectionReason);
  const bubbleText = cancelled
    ? p.rejectionReason || item.body || "El local canceló tu pedido."
    : p.itemsSummary || p.summary || item.body;
  const href = item.actionUrl ?? (p.orderId ? `/pedido/${p.orderId}` : null);

  const content = (
    <div className="px-1.5 py-2.5">
      <div className="flex gap-2.5">
        <StoreLogo name={businessName} url={p.businessLogoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-[12px] leading-snug text-gray-800 dark:text-[#d4cfc9]">
              <span className={cn("font-semibold", cancelled && "text-red-700 dark:text-red-300")}>
                {statusLabel}
              </span>
              <span className="text-gray-500"> en </span>
              <span className="mt-0.5 inline-flex max-w-full align-middle">
                <span className="inline-flex max-w-full items-center gap-1 truncate rounded-md border border-[#e8e0d6] bg-[#faf6f1] px-1.5 py-0.5 text-[11px] font-semibold text-gray-800 dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-gray-100">
                  <MaterialSymbol icon="storefront" size={12} className="shrink-0 text-[#9a0002]" />
                  <span className="truncate">{businessName}</span>
                </span>
              </span>
            </p>
            {unread ? (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#9a0002]" aria-label="Nueva" title="Nueva" />
            ) : null}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-gray-400">
            <span>{absoluteTime(item.createdAt)}</span>
            <span>{relativeTime(item.createdAt)}</span>
          </div>
        </div>
      </div>

      {bubbleText ? (
        <div
          className={cn(
            "mt-2 ml-[46px] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed",
            cancelled
              ? "bg-red-50 text-red-800 dark:bg-red-950/35 dark:text-red-200"
              : "bg-[#f0ebe4] text-gray-700 dark:bg-[#2a2623] dark:text-gray-300",
          )}
        >
          {bubbleText}
        </div>
      ) : null}
    </div>
  );

  return (
    <div>
      <SwipeToDelete enabled={Boolean(onRemove)} onDelete={() => onRemove?.()}>
        {({ suppressClick }) =>
          href ? (
            <Link
              href={href}
              className="block rounded-xl transition-colors hover:bg-[#f5f1eb]/35 dark:hover:bg-[#2a2623]/25"
              onClick={(e) => {
                if (suppressClick) {
                  e.preventDefault();
                  return;
                }
                onOpen();
              }}
            >
              {content}
            </Link>
          ) : (
            <button
              type="button"
              className="block w-full cursor-pointer rounded-xl text-left transition-colors hover:bg-[#f5f1eb]/35 dark:hover:bg-[#2a2623]/25"
              onClick={() => {
                if (suppressClick) return;
                onOpen();
              }}
            >
              {content}
            </button>
          )
        }
      </SwipeToDelete>
      {showDivider ? <Divider /> : null}
    </div>
  );
}

function StoreLogo({ name, url }: { name: string; url?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full border border-[#e8e0d6] object-cover dark:border-[#3d3732]"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9a0002]/10 text-[12px] font-bold text-[#9a0002]">
      {initial}
    </span>
  );
}

function Divider() {
  return (
    <div
      className="mx-3 border-b border-dotted border-[#e8e0d6] dark:border-[#3d3732]"
      aria-hidden
    />
  );
}
