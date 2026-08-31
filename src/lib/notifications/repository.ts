import { createServiceClient } from "@/lib/supabase/service";
import type {
  AppNotification,
  NotificationCategory,
  NotificationInput,
  NotificationPayload,
} from "./types";

function parsePayload(raw: unknown): NotificationPayload {
  if (!raw || typeof raw !== "object") return {};
  const p = raw as Record<string, unknown>;
  return {
    businessName: typeof p.businessName === "string" ? p.businessName : undefined,
    businessLogoUrl: typeof p.businessLogoUrl === "string" ? p.businessLogoUrl : undefined,
    orderNumber: typeof p.orderNumber === "number" ? p.orderNumber : undefined,
    orderId: typeof p.orderId === "string" ? p.orderId : undefined,
    statusLabel: typeof p.statusLabel === "string" ? p.statusLabel : undefined,
    summary: typeof p.summary === "string" ? p.summary : undefined,
    itemsSummary: typeof p.itemsSummary === "string" ? p.itemsSummary : undefined,
    rejectionReason: typeof p.rejectionReason === "string" ? p.rejectionReason : undefined,
    ctaLabel: typeof p.ctaLabel === "string" ? p.ctaLabel : undefined,
  };
}

function mapRow(row: {
  id: string;
  category: string;
  priority: number;
  title: string;
  body: string | null;
  emoji: string | null;
  icon: string | null;
  action_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  business_id: string | null;
  payload: unknown;
  read_at: string | null;
  created_at: string;
}): AppNotification {
  return {
    id: row.id,
    category: row.category as NotificationCategory,
    priority: row.priority as 0 | 1 | 2,
    title: row.title,
    body: row.body,
    emoji: row.emoji,
    icon: row.icon,
    actionUrl: row.action_url,
    entityType: row.entity_type,
    entityId: row.entity_id,
    businessId: row.business_id,
    payload: parsePayload(row.payload),
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function insertNotification(input: NotificationInput): Promise<void> {
  const svc = createServiceClient();
  const row = {
    user_id: input.userId,
    business_id: input.businessId ?? null,
    category: input.category,
    priority: input.priority,
    title: input.title,
    body: input.body ?? null,
    emoji: input.emoji ?? null,
    icon: input.icon ?? null,
    action_url: input.actionUrl ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    payload: input.payload ?? {},
    dedupe_key: input.dedupeKey ?? null,
  };

  if (input.dedupeKey) {
    await svc.from("notifications").upsert(row, {
      onConflict: "user_id,dedupe_key",
      ignoreDuplicates: true,
    });
    return;
  }

  await svc.from("notifications").insert(row);
}

export async function listNotifications(input: {
  userId: string;
  businessId?: string | null;
  category?: NotificationCategory | null;
  limit?: number;
}): Promise<AppNotification[]> {
  const svc = createServiceClient();
  let q = svc
    .from("notifications")
    .select(
      "id, category, priority, title, body, emoji, icon, action_url, entity_type, entity_id, business_id, payload, read_at, created_at",
    )
    .eq("user_id", input.userId)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 50);

  if (input.businessId) q = q.eq("business_id", input.businessId);
  if (input.category) q = q.eq("category", input.category);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function markNotificationsRead(input: {
  userId: string;
  id?: string;
  all?: boolean;
  businessId?: string | null;
}): Promise<void> {
  const svc = createServiceClient();
  const now = new Date().toISOString();
  let q = svc.from("notifications").update({ read_at: now }).eq("user_id", input.userId).is("read_at", null);

  if (input.id) q = q.eq("id", input.id);
  if (input.businessId) q = q.eq("business_id", input.businessId);
  if (!input.id && !input.all) return;

  const { error } = await q;
  if (error) throw error;
}

export async function deleteNotifications(input: {
  userId: string;
  id?: string;
  all?: boolean;
  businessId?: string | null;
}): Promise<void> {
  const svc = createServiceClient();
  let q = svc.from("notifications").delete().eq("user_id", input.userId);

  if (input.id) q = q.eq("id", input.id);
  if (input.businessId) q = q.eq("business_id", input.businessId);
  if (!input.id && !input.all) return;

  const { error } = await q;
  if (error) throw error;
}

export async function unreadCount(input: {
  userId: string;
  businessId?: string | null;
}): Promise<number> {
  const svc = createServiceClient();
  let q = svc
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .is("read_at", null);
  if (input.businessId) q = q.eq("business_id", input.businessId);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}
