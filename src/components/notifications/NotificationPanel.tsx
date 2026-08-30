"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
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

type NotificationPanelProps = {
  items: AppNotification[];
  variant: "business" | "customer";
  onMarkRead: (input?: { id?: string; all?: boolean }) => void | Promise<void>;
  onClose?: () => void;
  settingsHref?: string;
  activeOrder?: ActiveCustomerOrder | null;
  className?: string;
};

export function NotificationPanel({
  items,
  variant,
  onMarkRead,
  onClose,
  settingsHref,
  activeOrder,
  className,
}: NotificationPanelProps) {
  const tabs = BUSINESS_TABS;
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const isCustomer = variant === "customer";

  const displayItems = useMemo(() => {
    if (isCustomer) return buildCustomerNotificationList(items, activeOrder);
    return sortNotifications(filterByTab(items, activeTab));
  }, [items, activeOrder, isCustomer, activeTab]);

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

  return (
    <div
      className={cn(
        "w-[min(100vw-2rem,360px)] rounded-2xl border border-[#e8e0d6] bg-white p-3 shadow-xl dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-[#ece8e2]",
        className,
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2 px-0.5">
        <h3 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Notificaciones</h3>
        <div className="flex items-center gap-1">
          {hasUnread ? (
            <button
              type="button"
              aria-label="Marcar todo como leído"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-[#f5f1eb] dark:hover:bg-[#2a2623]"
              onClick={() => void onMarkRead({ all: true })}
            >
              <MaterialSymbol icon="done_all" size={17} />
            </button>
          ) : null}
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

      <div className="max-h-[min(60vh,360px)] space-y-1 overflow-y-auto pr-0.5">
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
}: {
  item: AppNotification;
  showDivider: boolean;
  onOpen: () => void;
}) {
  const unread = !item.readAt;
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
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#9a0002]" aria-label="No leída" />
      ) : null}
    </>
  );

  const rowClass =
    "flex w-full gap-2.5 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-[#f5f1eb]/70 dark:hover:bg-[#2a2623]/50";

  return (
    <div>
      {item.actionUrl ? (
        <Link href={item.actionUrl} className={rowClass} onClick={onOpen}>
          {inner}
        </Link>
      ) : (
        <button type="button" className={cn(rowClass, "cursor-pointer")} onClick={onOpen}>
          {inner}
        </button>
      )}
      {showDivider ? <Divider /> : null}
    </div>
  );
}

function CustomerNotificationRow({
  item,
  showDivider,
  onOpen,
}: {
  item: AppNotification;
  showDivider: boolean;
  onOpen: () => void;
}) {
  const unread = !item.readAt;
  const p = item.payload;
  const businessName = p.businessName ?? item.title;
  const statusLabel = p.statusLabel ?? item.title;
  const summary = p.summary ?? item.body;
  const cta = p.ctaLabel ?? "Ver seguimiento";
  const href = item.actionUrl ?? (p.orderId ? `/pedido/${p.orderId}` : null);

  const content = (
    <div className="px-1.5 py-2.5">
      <div className="flex gap-2.5">
        <StoreLogo name={businessName} url={p.businessLogoUrl} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] leading-snug text-gray-800 dark:text-[#d4cfc9]">
            <span className={cn(unread && "font-semibold")}>{statusLabel}</span>
            <span className="text-gray-500"> en </span>
            <span className="font-semibold">{businessName}</span>
          </p>
          <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-gray-400">
            <span>{absoluteTime(item.createdAt)}</span>
            <span>{relativeTime(item.createdAt)}</span>
          </div>
        </div>
        {unread ? (
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#9a0002]" aria-label="No leída" />
        ) : null}
      </div>

      {(summary || href) && (
        <div className="mt-2.5 ml-[46px] rounded-xl border border-[#ebe4da] bg-[#f5f1eb]/90 px-3 py-2.5 dark:border-[#3d3732] dark:bg-[#2a2623]/90">
          {summary ? (
            <p className="text-[11px] leading-snug text-gray-600 dark:text-gray-400">{summary}</p>
          ) : null}
          {item.body && item.body !== summary ? (
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{item.body}</p>
          ) : null}
          {href ? (
            <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#9a0002]">
              {cta}
              <MaterialSymbol icon="arrow_forward" size={14} />
            </span>
          ) : null}
        </div>
      )}
    </div>
  );

  return (
    <div className="transition-colors hover:bg-[#f5f1eb]/40 dark:hover:bg-[#2a2623]/30 rounded-xl">
      {href ? (
        <Link href={href} className="block" onClick={onOpen}>
          {content}
        </Link>
      ) : (
        <button type="button" className="block w-full cursor-pointer text-left" onClick={onOpen}>
          {content}
        </button>
      )}
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
