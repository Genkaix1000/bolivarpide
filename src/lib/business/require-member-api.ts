import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type BusinessMemberRole = "owner" | "staff" | "driver";

const ROLE_RANK: Record<BusinessMemberRole, number> = { owner: 3, staff: 2, driver: 1 };

export async function requireBusinessMember(
  businessId: string,
  minRole?: BusinessMemberRole,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  const isAdmin = user.app_metadata?.role === "admin";
  let role: BusinessMemberRole | null = isAdmin ? "owner" : null;

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
    role = member.role as BusinessMemberRole;
  }

  // P0 #6: operaciones sensibles (pagos MP) exigen rol mínimo (owner).
  if (minRole && role && ROLE_RANK[role] < ROLE_RANK[minRole]) {
    return {
      error: NextResponse.json(
        { error: "No tenés permisos para esta acción" },
        { status: 403 },
      ),
    };
  }

  return { user, supabase, role, isAdmin };
}