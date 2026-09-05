import { createServiceClient } from "@/lib/supabase/service";
import type { PlatformRole } from "@/lib/admin/platform";
import type { UserAvatar } from "@/lib/userProfile";

export type NetworkKpis = {
  businessesTotal: number;
  businessesOpen: number;
  businessesPublished: number;
  businessesDraft: number;
  usersTotal: number;
  ordersDelivered: number;
  ordersToday: number;
  orders7d: number;
  ordersTotal: number;
  gmvCents: number | null;
  gmvMonthCents: number | null;
  gmvPrevMonthCents: number | null;
  ticketAvgCents: number | null;
  successRate: number | null;
};

export type TopBusiness = {
  id: string;
  name: string;
  slug: string;
  logo_path: string | null;
  orders: number;
  gmvCents: number | null;
};

function monthBounds(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const prevStart = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    prevStart: prevStart.toISOString(),
    prevEnd: start.toISOString(),
  };
}

export async function getNetworkKpis(includeFinance: boolean): Promise<NetworkKpis> {
  const service = createServiceClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const { start, end, prevStart, prevEnd } = monthBounds();

  const [
    bizAll,
    bizOpen,
    bizPub,
    users,
    delivered,
    ordersToday,
    orders7d,
    ordersTotal,
  ] = await Promise.all([
    service.from("businesses").select("*", { count: "exact", head: true }),
    service.from("businesses").select("*", { count: "exact", head: true }).eq("is_open", true),
    service.from("businesses").select("*", { count: "exact", head: true }).eq("published", true),
    service.from("user_profiles").select("*", { count: "exact", head: true }),
    service.from("orders").select("*", { count: "exact", head: true }).eq("status", "delivered"),
    service
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    service
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString()),
    service.from("orders").select("*", { count: "exact", head: true }),
  ]);

  let gmvCents: number | null = null;
  let gmvMonthCents: number | null = null;
  let gmvPrevMonthCents: number | null = null;
  let ticketAvgCents: number | null = null;

  if (includeFinance) {
    // ponytail: full row scan for GMV — fine until ~10k delivered orders; then SQL SUM RPC
    const [allGmv, monthGmv, prevGmv] = await Promise.all([
      service.from("orders").select("total_cents").eq("status", "delivered"),
      service
        .from("orders")
        .select("total_cents")
        .eq("status", "delivered")
        .gte("created_at", start)
        .lt("created_at", end),
      service
        .from("orders")
        .select("total_cents")
        .eq("status", "delivered")
        .gte("created_at", prevStart)
        .lt("created_at", prevEnd),
    ]);
    const sum = (rows: { total_cents: number }[] | null) =>
      (rows ?? []).reduce((a, r) => a + (r.total_cents || 0), 0);
    gmvCents = sum(allGmv.data);
    gmvMonthCents = sum(monthGmv.data);
    gmvPrevMonthCents = sum(prevGmv.data);
    const n = delivered.count ?? 0;
    ticketAvgCents = n > 0 ? Math.round(gmvCents / n) : 0;
  }

  const deliveredN = delivered.count ?? 0;
  const totalN = ordersTotal.count ?? 0;

  return {
    businessesTotal: bizAll.count ?? 0,
    businessesOpen: bizOpen.count ?? 0,
    businessesPublished: bizPub.count ?? 0,
    businessesDraft: Math.max(0, (bizAll.count ?? 0) - (bizPub.count ?? 0)),
    usersTotal: users.count ?? 0,
    ordersDelivered: deliveredN,
    ordersToday: ordersToday.count ?? 0,
    orders7d: orders7d.count ?? 0,
    ordersTotal: totalN,
    gmvCents,
    gmvMonthCents,
    gmvPrevMonthCents,
    ticketAvgCents,
    successRate: totalN > 0 ? Math.round((deliveredN / totalN) * 1000) / 10 : null,
  };
}

export async function getTopBusinesses(includeGmv: boolean, limit = 5): Promise<TopBusiness[]> {
  const service = createServiceClient();
  const { start, end } = monthBounds();
  const { data: orders } = await service
    .from("orders")
    .select("business_id, total_cents, status")
    .eq("status", "delivered")
    .gte("created_at", start)
    .lt("created_at", end);

  const byBiz = new Map<string, { orders: number; gmv: number }>();
  for (const o of orders ?? []) {
    const cur = byBiz.get(o.business_id) ?? { orders: 0, gmv: 0 };
    cur.orders += 1;
    cur.gmv += o.total_cents || 0;
    byBiz.set(o.business_id, cur);
  }
  const ranked = [...byBiz.entries()]
    .sort((a, b) => (includeGmv ? b[1].gmv - a[1].gmv : b[1].orders - a[1].orders))
    .slice(0, limit);
  if (ranked.length === 0) return [];

  const { data: businesses } = await service
    .from("businesses")
    .select("id, name, slug, logo_path")
    .in(
      "id",
      ranked.map(([id]) => id),
    );

  const map = new Map((businesses ?? []).map((b) => [b.id, b]));
  return ranked.map(([id, stats]) => {
    const b = map.get(id);
    return {
      id,
      name: b?.name ?? id.slice(0, 8),
      slug: b?.slug ?? "",
      logo_path: b?.logo_path ?? null,
      orders: stats.orders,
      gmvCents: includeGmv ? stats.gmv : null,
    };
  });
}

export type AdminBusinessRow = {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  is_open: boolean;
  plan: string;
  created_at: string;
  phone: string | null;
  logo_path: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  ordersCount: number;
};

export async function listAdminBusinesses(q?: string): Promise<AdminBusinessRow[]> {
  const service = createServiceClient();
  let query = service
    .from("businesses")
    .select("id, name, slug, published, is_open, plan, created_at, phone, logo_path")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q?.trim()) {
    const s = q.trim();
    query = query.or(`name.ilike.%${s}%,slug.ilike.%${s}%,phone.ilike.%${s}%`);
  }
  const { data: businesses } = await query;
  if (!businesses?.length) return [];

  const ids = businesses.map((b) => b.id);
  const [{ data: owners }, { data: orderRows }] = await Promise.all([
    service
      .from("business_members")
      .select("business_id, user_id")
      .in("business_id", ids)
      .eq("role", "owner")
      .eq("status", "active"),
    service.from("orders").select("business_id").in("business_id", ids),
  ]);

  const orderCount = new Map<string, number>();
  for (const o of orderRows ?? []) {
    orderCount.set(o.business_id, (orderCount.get(o.business_id) ?? 0) + 1);
  }

  const ownerByBiz = new Map<string, string>();
  for (const m of owners ?? []) ownerByBiz.set(m.business_id, m.user_id);

  const ownerIds = [...new Set([...ownerByBiz.values()])];
  const profiles = new Map<string, { email: string | null; name: string | null }>();
  if (ownerIds.length) {
    const { data: profs } = await service
      .from("user_profiles")
      .select("user_id, display_name")
      .in("user_id", ownerIds);
    for (const p of profs ?? []) {
      profiles.set(p.user_id, { email: null, name: p.display_name ?? null });
    }
    for (const uid of ownerIds) {
      const { data } = await service.auth.admin.getUserById(uid);
      const prev = profiles.get(uid);
      profiles.set(uid, {
        email: data.user?.email ?? null,
        name:
          prev?.name ??
          ((data.user?.user_metadata?.full_name as string) || null),
      });
    }
  }

  return businesses.map((b) => {
    const oid = ownerByBiz.get(b.id);
    const p = oid ? profiles.get(oid) : null;
    return {
      ...b,
      ownerEmail: p?.email ?? null,
      ownerName: p?.name ?? null,
      ordersCount: orderCount.get(b.id) ?? 0,
    };
  });
}

export type AuditLogRow = {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  actorEmail: string | null;
};

export type AuditFilters = {
  action?: string;
  periodHours?: number;
  q?: string;
};

export async function listAuditLogs(
  filters: AuditFilters = {},
  limit = 200,
): Promise<{ rows: AuditLogRow[]; total: number; buckets: { t: string; n: number }[] }> {
  const service = createServiceClient();
  const hours = filters.periodHours ?? 24;
  const since = new Date(Date.now() - hours * 3600e3).toISOString();

  let query = service
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.action && filters.action !== "all") {
    query = query.eq("action", filters.action);
  }
  if (filters.q?.trim()) {
    const s = filters.q.trim();
    query = query.or(`action.ilike.%${s}%,target_id.ilike.%${s}%,target_type.ilike.%${s}%`);
  }

  const { data, count } = await query;
  const actorIds = [...new Set((data ?? []).map((r) => r.actor_user_id).filter(Boolean))] as string[];
  const emails = new Map<string, string>();
  await Promise.all(
    actorIds.map(async (id) => {
      const { data: u } = await service.auth.admin.getUserById(id);
      if (u.user?.email) emails.set(id, u.user.email);
    }),
  );

  const rows: AuditLogRow[] = (data ?? []).map((r) => ({
    id: r.id,
    actor_user_id: r.actor_user_id,
    action: r.action,
    target_type: r.target_type,
    target_id: r.target_id,
    meta: (r.meta as Record<string, unknown>) ?? {},
    created_at: r.created_at,
    actorEmail: r.actor_user_id ? emails.get(r.actor_user_id) ?? null : null,
  }));

  // Histogram buckets (~12 slots over the period)
  const slots = 12;
  const slotMs = (hours * 3600e3) / slots;
  const now = Date.now();
  const buckets = Array.from({ length: slots }, (_, i) => {
    const t = new Date(now - (slots - i) * slotMs);
    return {
      t: t.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      n: 0,
    };
  });
  for (const r of rows) {
    const age = now - new Date(r.created_at).getTime();
    const idx = Math.min(slots - 1, Math.max(0, slots - 1 - Math.floor(age / slotMs)));
    buckets[idx].n += 1;
  }

  return { rows, total: count ?? rows.length, buckets };
}

export type PlatformMember = {
  user_id: string;
  role: PlatformRole;
  email: string | null;
  displayName: string | null;
  created_at: string;
  avatar?: UserAvatar;
  isVerified?: boolean;
};

export async function listPlatformMembers(): Promise<PlatformMember[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("platform_users")
    .select("user_id, role, created_at")
    .order("created_at", { ascending: true });
  if (!data?.length) return [];

  const out: PlatformMember[] = [];
  for (const row of data) {
    const { data: u } = await service.auth.admin.getUserById(row.user_id);
    const { data: prof } = await service
      .from("user_profiles")
      .select("display_name, identity_verified, avatar_type, avatar_value, avatar_gradient_id")
      .eq("user_id", row.user_id)
      .maybeSingle();

    const displayName = prof?.display_name ?? null;
    const email = u.user?.email ?? null;
    const fallbackInitials = (displayName || email?.split("@")[0] || "?").slice(0, 2).toUpperCase();
    const avatar: UserAvatar = {
      type: (prof?.avatar_type as UserAvatar["type"]) || "initials",
      value: prof?.avatar_value || fallbackInitials,
      gradientId: prof?.avatar_gradient_id || "cherry",
    };

    out.push({
      user_id: row.user_id,
      role: row.role as PlatformRole,
      email,
      displayName,
      created_at: row.created_at,
      avatar,
      isVerified: Boolean(prof?.identity_verified),
    });
  }
  return out;
}
