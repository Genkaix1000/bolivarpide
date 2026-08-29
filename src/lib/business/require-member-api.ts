import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireBusinessMember(businessId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  const isAdmin = user.app_metadata?.role === "admin";
  if (!isAdmin) {
    const { data: member } = await supabase
      .from("business_members")
      .select("id, role")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!member) {
      return { error: NextResponse.json({ error: "Sin acceso a este negocio" }, { status: 403 }) };
    }
  }
  return { user, supabase };
}
