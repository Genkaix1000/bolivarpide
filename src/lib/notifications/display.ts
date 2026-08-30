import type { AppNotification, NotificationCategory, NotificationCounts, NotificationTab } from "./types";

export function relativeTime(createdAt: string, now = Date.now()): string {
  const diff = now - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Ayer";
  return `Hace ${days} d`;
}

export function absoluteTime(createdAt: string, now = Date.now()): string {
  const d = new Date(createdAt);
  const today = new Date(now);
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const time = d.toLocaleTimeString("es-AR", { hour: "numeric", minute: "2-digit" });
  if (sameDay) return time;
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dayGroupLabel(createdAt: string, now = Date.now()): string {
  const d = new Date(createdAt);
  const today = new Date(now);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.floor((startOfToday - startOfDay) / 86_400_000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" });
}

export function sortNotifications(items: AppNotification[]): AppNotification[] {
  return [...items].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function filterByTab(items: AppNotification[], tab: NotificationTab): AppNotification[] {
  if (tab === "all") return items;
  return items.filter((n) => n.category === tab);
}

export function countUnreadByTab(items: AppNotification[], tabs: NotificationTab[]): NotificationCounts {
  const unread = items.filter((n) => !n.readAt);
  const counts = {} as NotificationCounts;
  for (const tab of tabs) {
    counts[tab] = tab === "all" ? unread.length : unread.filter((n) => n.category === tab).length;
  }
  return counts;
}

export function groupByDay(items: AppNotification[], now = Date.now()) {
  const sorted = sortNotifications(items);
  const groups: { label: string; items: AppNotification[] }[] = [];
  for (const item of sorted) {
    const label = dayGroupLabel(item.createdAt, now);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

export const BUSINESS_TABS: { id: NotificationTab; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "orders", label: "Pedidos" },
  { id: "payments", label: "Pagos" },
  { id: "system", label: "Sistema" },
];

export const CUSTOMER_TABS: { id: NotificationTab; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "orders", label: "Pedidos" },
  { id: "promos", label: "Promos" },
];

export function tabIds(tabs: { id: NotificationTab }[]): NotificationTab[] {
  return tabs.map((t) => t.id);
}
