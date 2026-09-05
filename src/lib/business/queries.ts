import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";
import { BUSINESS_PLANS } from "@/lib/business/plans";
import {
  computeMetrics,
  computeSalesChart,
  periodStart,
  type DashboardPeriod,
} from "@/lib/business/dashboard";

export type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  is_open: boolean;
  plan: string;
  tagline: string | null;
  logo_path: string | null;
  banner_path: string | null;
  rating: number;
  reviews_count: number;
  prep_time_minutes: number;
  phone: string | null;
  address: string | null;
  city: string;
};

export type MembershipRow = {
  id: string;
  role: string;
  status: string;
  business_id: string;
  businesses: {
    id: string;
    name: string;
    slug: string;
    published: boolean;
    is_open: boolean;
    plan: string;
    logo_path?: string | null;
    banner_path?: string | null;
    tagline?: string | null;
    address?: string | null;
    city?: string | null;
    rating?: number;
    reviews_count?: number;
    products?: { count: number }[];
  } | null;
};

export type TutorialTask = { id: string; label: string; completed: boolean };

export type DashboardRecentOrder = {
  id: string;
  customerName: string;
  itemsCount: number;
  total: number;
  status: string;
  time: string;
  isDelivery: boolean;
};

export type DashboardStockProduct = {
  id: string;
  name: string;
  image?: string;
  available: boolean;
};

const BUSINESS_FIELDS =
  "id, name, slug, published, is_open, plan, tagline, logo_path, banner_path, rating, reviews_count, prep_time_minutes, phone, address, city";

export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/negocio/login");
  return { supabase, user };
});

export const requireBusinessAccess = cache(async (businessId: string) => {
  const { supabase, user } = await requireUser();
  const { resolvePlatformRole } = await import("@/lib/admin/platform");
  const { getImpersonationBusinessId } = await import("@/lib/business/impersonate");
  const platformRole = await resolvePlatformRole(user);
  const impersonating =
    platformRole === "superadmin" ? (await getImpersonationBusinessId()) === businessId : false;
  const isAdmin = impersonating;

  const { data: membership } = await supabase
    .from("business_members")
    .select(`id, role, status, businesses(${BUSINESS_FIELDS})`)
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership && !isAdmin) redirect("/negocio");

  let business = membership?.businesses as BusinessRow | null | undefined;
  if (!business && isAdmin) {
    const { data: biz } = await supabase
      .from("businesses")
      .select(BUSINESS_FIELDS)
      .eq("id", businessId)
      .single();
    business = biz as BusinessRow;
  }

  if (!business) redirect("/negocio");

  return {
    supabase,
    user,
    member: membership,
    business,
    isAdmin,
    platformRole,
    impersonating,
  };
});

function formatOrderTime(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function mapRecentOrder(row: {
  id: string;
  customer_name: string | null;
  total_cents: number;
  status: string;
  created_at: string;
  delivery_address: string | null;
  order_items?: { quantity: number }[];
}): DashboardRecentOrder {
  const itemsCount =
    row.order_items?.reduce((s, i) => s + i.quantity, 0) ?? row.order_items?.length ?? 0;
  return {
    id: row.id,
    customerName: row.customer_name?.trim() || "Cliente",
    itemsCount,
    total: row.total_cents,
    status: row.status,
    time: formatOrderTime(row.created_at),
    isDelivery: Boolean(row.delivery_address),
  };
}

export async function getOnboardingTasks(
  businessId: string,
  business: BusinessRow,
  productsCount: number,
  driversCount: number,
): Promise<TutorialTask[]> {
  return [
    {
      id: "profile",
      label: "Logo y portada cargados en buena calidad",
      completed: Boolean(business.logo_path && business.banner_path),
    },
    {
      id: "menu",
      label: "Menú o carta cargada (min 5 productos)",
      completed: productsCount >= 5,
    },
    {
      id: "qr",
      label: "Menú QR generado e impreso",
      completed: productsCount >= 1,
    },
    {
      id: "promos",
      label: "Primera promoción de bienvenida creada",
      completed: false,
    },
    {
      id: "logistics",
      label: "Al menos 1 repartidor/delivery asociado",
      completed: driversCount >= 1,
    },
  ];
}

export async function getBusinessDashboardData(
  businessId: string,
  period: DashboardPeriod,
) {
  const { supabase, business } = await requireBusinessAccess(businessId);
  const start = periodStart(period);

  const [
    metricsOrdersRes,
    recentOrdersRes,
    productsCountRes,
    stockProductsRes,
    driversCountRes,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total_cents, status, created_at, delivery_address")
      .eq("business_id", businessId)
      .gte("created_at", start.toISOString()),
    supabase
      .from("orders")
      .select(
        "id, customer_name, total_cents, status, created_at, delivery_address, order_items(quantity)",
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("products")
      .select("id, name, icon_path, image_path, available")
      .eq("business_id", businessId)
      .order("sort_order")
      .order("name")
      .limit(6),
    supabase
      .from("business_members")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("role", "driver")
      .eq("status", "active"),
  ]);

  const metricOrders = metricsOrdersRes.data ?? [];
  const metrics = computeMetrics(metricOrders, period);
  const chart = computeSalesChart(metricOrders, period);
  const productsCount = productsCountRes.count ?? 0;
  const driversCount = driversCountRes.count ?? 0;

  const stockProducts: DashboardStockProduct[] = (stockProductsRes.data ?? []).map((p) => {
    const raw = ("icon_path" in p && p.icon_path) ? (p.icon_path as string) : p.image_path;
    return {
      id: p.id,
      name: p.name,
      image: resolveBusinessAssetUrl(raw) ?? raw ?? undefined,
      available: p.available,
    };
  });

  const tasks = await getOnboardingTasks(
    businessId,
    business,
    productsCount,
    driversCount,
  );

  return {
    business,
    metrics,
    chart,
    recentOrders: (recentOrdersRes.data ?? []).map(mapRecentOrder),
    productsCount,
    stockProducts,
    tasks,
  };
}

export type ShellNotification = { emoji: string; title: string; time: string };

export type ShellMemberPreview = {
  userId: string;
  label: string;
  avatar: {
    type: "initials" | "symbol" | "emoji";
    value: string;
    gradientId: string;
  };
};

export type BusinessShellData = {
  business: BusinessRow;
  displayName: string;
  email: string;
  initials: string;
  planLabel: string;
  planCommission: string;
  notifications: ShellNotification[];
  pendingCount: number;
  platformRole: "superadmin" | "soporte" | null;
  impersonating: boolean;
  members: ShellMemberPreview[];
  memberCount: number;
};

function planMeta(plan: string) {
  const p = BUSINESS_PLANS.find((x) => x.id === plan);
  return { label: p?.name ?? "Plan Inicial", commission: p?.commission ?? "7%" };
}

function userDisplay(user: { email?: string }, profileName: string | null) {
  const email = user.email ?? "";
  const displayName = profileName?.trim() || email.split("@")[0] || "Usuario";
  const initials = profileName?.trim()
    ? profileName.trim().split(/\s+/).length >= 2
      ? (profileName.trim().split(/\s+/)[0][0] + profileName.trim().split(/\s+/)[1][0]).toUpperCase()
      : profileName.trim().slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase();
  return { displayName, email, initials };
}

export async function getBusinessShellData(businessId: string): Promise<BusinessShellData> {
  const { supabase, user, business, platformRole, impersonating } =
    await requireBusinessAccess(businessId);
  const { label: planLabel, commission: planCommission } = planMeta(business.plan);

  const [profileRes, pendingAllRes, membersRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id, status, payment_status, payment_method")
      .eq("business_id", businessId)
      .eq("status", "pending"),
    supabase
      .from("business_members")
      .select("user_id")
      .eq("business_id", businessId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(24),
  ]);

  const { displayName, email, initials } = userDisplay(user, profileRes.data?.display_name);

  const notifications: ShellNotification[] = [];

  const { isKitchenEligible } = await import("@/lib/orders/lifecycle");
  const operationalPending = (pendingAllRes.data ?? []).filter((o) => isKitchenEligible(o)).length;

  const memberIds = (membersRes.data ?? []).map((m) => m.user_id);
  const memberCount = memberIds.length;
  const previewIds = memberIds.slice(0, 6);
  const members: ShellMemberPreview[] = [];

  if (previewIds.length > 0) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/service");
      const service = createServiceClient();
      const { data: profiles } = await service
        .from("user_profiles")
        .select(
          "user_id, display_name, avatar_type, avatar_value, avatar_gradient_id",
        )
        .in("user_id", previewIds);
      const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      for (const id of previewIds) {
        const p = map.get(id);
        const label = p?.display_name?.trim() || id.slice(0, 6);
        const fallback = label.slice(0, 2).toUpperCase();
        const type =
          p?.avatar_type === "symbol" || p?.avatar_type === "emoji" || p?.avatar_type === "initials"
            ? p.avatar_type
            : "initials";
        members.push({
          userId: id,
          label,
          avatar: {
            type,
            value: (p?.avatar_value || fallback).slice(0, type === "emoji" ? 8 : 24),
            gradientId: p?.avatar_gradient_id || "cherry",
          },
        });
      }
    } catch {
      for (const id of previewIds) {
        members.push({
          userId: id,
          label: id.slice(0, 6),
          avatar: {
            type: "initials",
            value: id.slice(0, 2).toUpperCase(),
            gradientId: "cherry",
          },
        });
      }
    }
  }

  return {
    business,
    displayName,
    email,
    initials,
    planLabel,
    planCommission,
    notifications,
    pendingCount: operationalPending,
    platformRole: platformRole ?? null,
    impersonating,
    members,
    memberCount,
  };
}

export async function getBusinessHours(businessId: string) {
  const { supabase } = await requireBusinessAccess(businessId);
  const { data, error } = await supabase
    .from("business_hours")
    .select("weekday, open_time, close_time, closed")
    .eq("business_id", businessId)
    .order("weekday");
  if (error) throw error;
  return data ?? [];
}

export async function getPublicStoreBySlug(slugOrId: string) {
  const supabase = await createClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  
  let query = supabase
    .from("businesses")
    .select(
      "id, slug, name, tagline, logo_path, banner_path, rating, reviews_count, prep_time_minutes, is_open, address, published",
    )
    .eq("published", true);

  if (isUuid) {
    query = query.or(`slug.eq.${slugOrId},id.eq.${slugOrId}`);
  } else {
    query = query.eq("slug", slugOrId);
  }

  const { data: business, error } = await query.maybeSingle();
  if (error) throw error;
  if (!business) return null;

  const { listPublicMenuCategories, listPublicProductsSafe } = await import(
    "@/lib/business/menuQueries"
  );
  const categories = await listPublicMenuCategories(business.id);
  const products = await listPublicProductsSafe(business.id);

  return { business, categories, products };
}

export async function listMyMemberships() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("business_members")
    .select(
      "id, role, status, business_id, businesses(id, name, slug, published, is_open, plan, logo_path, banner_path, tagline, address, city, rating, reviews_count, products(count))",
    )
    .eq("user_id", user.id)
    .in("status", ["active", "invited"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MembershipRow[];
}

export async function listProducts(businessId: string) {
  const { listProductsSafe } = await import("@/lib/business/menuQueries");
  return listProductsSafe(businessId);
}

export async function listOrders(businessId: string) {
  const { supabase } = await requireBusinessAccess(businessId);
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function listPublishedBusinesses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, slug, name, tagline, logo_path, rating, reviews_count, prep_time_minutes, is_open, address",
    )
    .eq("published", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}
