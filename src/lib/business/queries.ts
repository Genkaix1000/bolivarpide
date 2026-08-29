import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
  address: string | null;
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
  "id, name, slug, published, is_open, plan, tagline, logo_path, banner_path, rating, reviews_count, prep_time_minutes, address";

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
  const isAdmin = user.app_metadata?.role === "admin";

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

  return { supabase, user, member: membership, business, isAdmin };
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
      .select("id, name, image_path, available")
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

  const stockProducts: DashboardStockProduct[] = (stockProductsRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    image: p.image_path ?? undefined,
    available: p.available,
  }));

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

export async function listMyMemberships() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("business_members")
    .select(
      "id, role, status, business_id, businesses(id, name, slug, published, is_open, plan)",
    )
    .eq("user_id", user.id)
    .in("status", ["active", "invited"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MembershipRow[];
}

export async function listProducts(businessId: string) {
  const { supabase } = await requireBusinessAccess(businessId);
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data ?? [];
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
