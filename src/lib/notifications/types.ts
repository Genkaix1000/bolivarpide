export type NotificationCategory = "orders" | "payments" | "system" | "promos" | "badges";

export type NotificationPayload = {
  businessName?: string;
  businessLogoUrl?: string;
  orderNumber?: number;
  orderId?: string;
  statusLabel?: string;
  summary?: string;
  itemsSummary?: string;
  rejectionReason?: string;
  ctaLabel?: string;
};

export type AppNotification = {
  id: string;
  category: NotificationCategory;
  priority: 0 | 1 | 2;
  title: string;
  body: string | null;
  emoji: string | null;
  icon: string | null;
  actionUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  businessId: string | null;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
};

export type NotificationTab = "all" | NotificationCategory;

export type NotificationCounts = Record<NotificationTab, number>;

export type NotificationInput = {
  userId: string;
  businessId?: string | null;
  category: NotificationCategory;
  priority: 0 | 1 | 2;
  title: string;
  body?: string | null;
  emoji?: string | null;
  icon?: string | null;
  actionUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: NotificationPayload;
  dedupeKey?: string | null;
};
