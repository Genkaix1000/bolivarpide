import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/negocio/login");
  return { supabase, user };
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

export async function requireBusinessAccess(businessId: string) {
  const { supabase, user } = await requireUser();
  const isAdmin = user.app_metadata?.role === "admin";

  const { data: member } = await supabase
    .from("business_members")
    .select("id, role, status")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member && !isAdmin) redirect("/negocio");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, published, is_open, plan")
    .eq("id", businessId)
    .single();

  if (!business) redirect("/negocio");
  return { supabase, user, member, business, isAdmin };
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
