"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireBusinessAccess, requireUser } from "@/lib/business/queries";

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "local"
  );
}

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  if (user.app_metadata?.role !== "admin") {
    throw new Error("Forbidden");
  }
  return { supabase, user, service: createServiceClient() };
}

export async function upsertProduct(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim() || null;
  const pricePesos = Number(formData.get("price") || 0);
  const available = formData.get("available") === "on" || formData.get("available") === "true";
  if (!businessId || !name || Number.isNaN(pricePesos)) throw new Error("Datos inválidos");

  const { supabase } = await requireBusinessAccess(businessId);
  const row = {
    business_id: businessId,
    name,
    category,
    price_cents: Math.round(pricePesos * 100),
    available,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("products").insert(row);
    if (error) throw error;
  }
  revalidatePath(`/negocio/${businessId}/carta`);
}

export async function deleteProduct(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const id = String(formData.get("id") || "");
  const { supabase } = await requireBusinessAccess(businessId);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(`/negocio/${businessId}/carta`);
}

export async function toggleBusinessOpen(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const isOpen = formData.get("isOpen") === "true";
  const { supabase, business } = await requireBusinessAccess(businessId);
  if (business.id !== businessId) throw new Error("Negocio inválido");

  const { error } = await supabase
    .from("businesses")
    .update({ is_open: isOpen, updated_at: new Date().toISOString() })
    .eq("id", businessId);
  if (error) throw error;

  revalidatePath(`/negocio/${businessId}/dashboard`);
  revalidatePath(`/c/${business.slug}`);
}

export async function toggleProductAvailability(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const productId = String(formData.get("productId") || "");
  const { supabase } = await requireBusinessAccess(businessId);

  const { data: product } = await supabase
    .from("products")
    .select("available")
    .eq("id", productId)
    .eq("business_id", businessId)
    .single();

  if (product) {
    const { error } = await supabase
      .from("products")
      .update({
        available: !product.available,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);
    if (error) throw error;
  }

  revalidatePath(`/negocio/${businessId}/dashboard`);
  revalidatePath(`/negocio/${businessId}/carta`);
}

export async function setOrderStatus(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  const allowed = ["pending", "accepted", "preparing", "ready", "delivered", "cancelled"];
  if (!allowed.includes(status)) throw new Error("Status inválido");
  const { supabase } = await requireBusinessAccess(businessId);
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("business_id", businessId);
  if (error) throw error;
  revalidatePath(`/negocio/${businessId}/pedidos`);
}

export async function inviteMember(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "staff");
  if (!["staff", "driver"].includes(role)) throw new Error("Rol inválido");
  const { supabase, user } = await requireBusinessAccess(businessId);

  const service = createServiceClient();
  const { data: listed } = await service.auth.admin.listUsers({ perPage: 1000 });
  const invitee = listed?.users.find((u) => u.email?.toLowerCase() === email);
  if (!invitee) throw new Error("Usuario no encontrado — debe haber iniciado sesión al menos una vez");

  const { error } = await supabase.from("business_members").upsert(
    {
      business_id: businessId,
      user_id: invitee.id,
      role,
      status: "invited",
      invited_by: user.id,
      invited_at: new Date().toISOString(),
    },
    { onConflict: "business_id,user_id" },
  );
  if (error) throw error;
  revalidatePath(`/negocio/${businessId}/equipo`);
  revalidatePath("/negocio");
}

export async function respondInvite(formData: FormData) {
  const memberId = String(formData.get("memberId") || "");
  const accept = formData.get("accept") === "true";
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("business_members")
    .update({
      status: accept ? "active" : "rejected",
      responded_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("user_id", user.id)
    .eq("status", "invited");
  if (error) throw error;
  revalidatePath("/negocio");
}

export async function leaveBusiness(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("business_members")
    .update({ status: "left", responded_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .neq("role", "owner");
  if (error) throw error;
  revalidatePath("/negocio");
  redirect("/negocio");
}

export async function approveLead(formData: FormData) {
  const leadId = String(formData.get("leadId") || "");
  const { user, service } = await requireAdmin();

  const { data: lead, error: leadErr } = await service
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();
  if (leadErr || !lead) throw new Error("Lead no encontrado");
  if (lead.status === "approved") throw new Error("Ya aprobado");

  let slug = slugify(lead.business_name);
  const { data: existing } = await service.from("businesses").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug}-${randomBytes(2).toString("hex")}`;

  const { data: business, error: bizErr } = await service
    .from("businesses")
    .insert({
      name: lead.business_name,
      slug,
      phone: lead.whatsapp,
      city: lead.city,
      province: lead.province,
      postal_code: lead.postal_code,
    })
    .select("id")
    .single();
  if (bizErr || !business) throw new Error(bizErr?.message ?? "No se creó el business");

  const hours = Array.from({ length: 7 }, (_, weekday) => ({
    business_id: business.id,
    weekday,
    open_time: "09:00",
    close_time: "23:00",
    closed: weekday === 0,
  }));
  await service.from("business_hours").insert(hours);

  const { data: usersPage } = await service.auth.admin.listUsers({ perPage: 1000 });
  const matched = usersPage?.users.find(
    (u) => u.email?.toLowerCase() === String(lead.email).toLowerCase(),
  );

  let claimToken: string | null = null;
  if (matched) {
    await service.from("business_members").insert({
      business_id: business.id,
      user_id: matched.id,
      role: "owner",
      status: "active",
    });
  } else {
    claimToken = randomBytes(24).toString("hex");
    await service
      .from("leads")
      .update({
        claim_token: claimToken,
        claim_expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
      })
      .eq("id", leadId);
  }

  await service
    .from("leads")
    .update({
      status: "approved",
      approved_business_id: business.id,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq("id", leadId);

  await service.from("admin_audit_log").insert({
    actor_user_id: user.id,
    action: "approve_lead",
    target_type: "lead",
    target_id: leadId,
    meta: { business_id: business.id, claim: Boolean(claimToken) },
  });

  revalidatePath("/admin");
}

export async function rejectLead(formData: FormData) {
  const leadId = String(formData.get("leadId") || "");
  const { user, service } = await requireAdmin();
  await service.from("leads").update({ status: "rejected" }).eq("id", leadId);
  await service.from("admin_audit_log").insert({
    actor_user_id: user.id,
    action: "reject_lead",
    target_type: "lead",
    target_id: leadId,
  });
  revalidatePath("/admin");
}

export async function setPublished(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const published = formData.get("published") === "true";
  const { user, service } = await requireAdmin();
  await service.from("businesses").update({ published }).eq("id", businessId);
  await service.from("admin_audit_log").insert({
    actor_user_id: user.id,
    action: "set_published",
    target_type: "business",
    target_id: businessId,
    meta: { published },
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setPlan(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const plan = String(formData.get("plan") || "free");
  if (!["free", "impulso", "lider"].includes(plan)) throw new Error("Plan inválido");
  const { user, service } = await requireAdmin();
  await service.from("businesses").update({ plan }).eq("id", businessId);
  await service.from("admin_audit_log").insert({
    actor_user_id: user.id,
    action: "set_plan",
    target_type: "business",
    target_id: businessId,
    meta: { plan },
  });
  revalidatePath("/admin");
}

export async function claimBusinessOwnership(formData: FormData) {
  const token = String(formData.get("claim") || "");
  const { supabase, user } = await requireUser();
  const service = createServiceClient();

  const { data: lead } = await service
    .from("leads")
    .select("id, approved_business_id, claim_token, claim_expires_at")
    .eq("claim_token", token)
    .maybeSingle();

  if (!lead?.approved_business_id) throw new Error("Claim inválido");
  if (lead.claim_expires_at && new Date(lead.claim_expires_at) < new Date()) {
    throw new Error("Claim expirado");
  }

  await service.from("business_members").upsert(
    {
      business_id: lead.approved_business_id,
      user_id: user.id,
      role: "owner",
      status: "active",
      responded_at: new Date().toISOString(),
    },
    { onConflict: "business_id,user_id" },
  );

  await service
    .from("leads")
    .update({ claim_token: null, claim_expires_at: null })
    .eq("id", lead.id);

  redirect(`/negocio/${lead.approved_business_id}/dashboard`);
}
