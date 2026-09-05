"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const { isPlatformSuperadmin } = await import("@/lib/admin/platform");
  if (!isPlatformSuperadmin(user)) {
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
  const map: Record<string, "preparing" | "delivering" | "delivered" | "rejected"> = {
    accepted: "preparing",
    preparing: "preparing",
    ready: "delivering",
    delivering: "delivering",
    delivered: "delivered",
    cancelled: "rejected",
  };
  const target = map[status];
  if (!target) throw new Error("Status inválido");
  const { advanceOrderStatus } = await import("@/lib/orders/actions");
  const res = await advanceOrderStatus({
    businessId,
    orderId,
    targetStatus: target,
    rejectionReason: target === "rejected" ? "Cancelado desde panel legacy" : undefined,
  });
  if (!res.ok) throw new Error(res.error);
}

export async function searchUsersForInviteAction(
  businessId: string,
  rawQuery: string,
): Promise<
  Array<{
    userId: string;
    email: string;
    displayName: string;
    avatar: { type: "initials" | "symbol" | "emoji"; value: string; gradientId: string };
  }>
> {
  const q = rawQuery.trim();
  if (!businessId || q.length < 2) return [];

  await requireBusinessAccess(businessId);
  const service = createServiceClient();

  const [{ data: members }, { data: listed }, { data: profiles }] = await Promise.all([
    service.from("business_members").select("user_id, status").eq("business_id", businessId),
    service.auth.admin.listUsers({ perPage: 1000 }),
    service
      .from("user_profiles")
      .select(
        "user_id, display_name, first_name, last_name, avatar_type, avatar_value, avatar_gradient_id",
      ),
  ]);

  // Solo contar activos/invitados — left/rejected pueden volver a invitarse
  const alreadyIn = new Set(
    (members ?? [])
      .filter((m) => m.status === "active" || m.status === "invited")
      .map((m) => m.user_id),
  );
  const profileById = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const needle = q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const hits: Array<{
    userId: string;
    email: string;
    displayName: string;
    avatar: { type: "initials" | "symbol" | "emoji"; value: string; gradientId: string };
    score: number;
  }> = [];

  for (const u of listed?.users ?? []) {
    if (!u.email || alreadyIn.has(u.id)) continue;
    const p = profileById.get(u.id);
    const email = u.email;
    const displayName =
      [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim() ||
      p?.display_name?.trim() ||
      email.split("@")[0];
    const hay = `${displayName} ${email} ${p?.first_name ?? ""} ${p?.last_name ?? ""} ${p?.display_name ?? ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (!hay.includes(needle)) continue;

    const nameNorm = displayName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const emailNorm = email.toLowerCase();
    // Prefer name prefix matches, then email prefix, then substring.
    let score = 3;
    if (nameNorm.startsWith(needle)) score = 0;
    else if (emailNorm.startsWith(needle)) score = 1;
    else if (nameNorm.includes(needle)) score = 2;

    const initials = displayName.slice(0, 2).toUpperCase() || "?";
    hits.push({
      userId: u.id,
      email,
      displayName,
      avatar: {
        type: (p?.avatar_type as "initials" | "symbol" | "emoji") || "initials",
        value: p?.avatar_value || initials,
        gradientId: p?.avatar_gradient_id || "cherry",
      },
      score,
    });
  }

  return hits
    .sort((a, b) => a.score - b.score || a.displayName.localeCompare(b.displayName))
    .slice(0, 8)
    .map(({ score: _score, ...rest }) => {
      void _score;
      return rest;
    });
}

export async function inviteMember(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const userId = String(formData.get("userId") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "staff");
  if (!["staff", "driver"].includes(role)) throw new Error("Rol inválido");
  const { supabase, user } = await requireBusinessAccess(businessId);

  const service = createServiceClient();
  let inviteeId = userId;

  if (!inviteeId && email) {
    const { data: listed } = await service.auth.admin.listUsers({ perPage: 1000 });
    const invitee = listed?.users.find((u) => u.email?.toLowerCase() === email);
    if (!invitee) throw new Error("Usuario no encontrado — debe haber iniciado sesión al menos una vez");
    inviteeId = invitee.id;
  }

  if (!inviteeId) throw new Error("Seleccioná un usuario de la búsqueda");
  if (inviteeId === user.id) throw new Error("No podés invitarte a vos mismo");

  const { data: existing } = await supabase
    .from("business_members")
    .select("id, status")
    .eq("business_id", businessId)
    .eq("user_id", inviteeId)
    .maybeSingle();
  if (existing?.status === "active") throw new Error("Esa persona ya está en el equipo");

  const { error } = await supabase.from("business_members").upsert(
    {
      business_id: businessId,
      user_id: inviteeId,
      role,
      status: "invited",
      invited_by: user.id,
      invited_at: new Date().toISOString(),
    },
    { onConflict: "business_id,user_id" },
  );
  if (error) throw error;
  revalidatePath(`/negocio/${businessId}/configuracion/equipo`);
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

/** Owner/staff removes a non-owner member. Soft status → left (undoable). */
export async function removeMember(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const memberId = String(formData.get("memberId") || "");
  if (!businessId || !memberId) throw new Error("Datos inválidos");

  const { supabase, user, member: actor } = await requireBusinessAccess(businessId);
  if (!actor || (actor.role !== "owner" && actor.role !== "staff")) {
    throw new Error("Sin permiso para quitar miembros");
  }

  const { data: target, error: fetchErr } = await supabase
    .from("business_members")
    .select("id, role, user_id, status")
    .eq("id", memberId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (fetchErr || !target) throw new Error("Miembro no encontrado");
  if (target.role === "owner") throw new Error("No se puede eliminar al titular");
  if (target.user_id === user.id) throw new Error("Usá Salir del local para irte vos");
  if (actor.role === "staff" && target.role === "staff") {
    throw new Error("Solo el titular puede quitar administradores");
  }

  const { error } = await supabase
    .from("business_members")
    .update({ status: "left", responded_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("business_id", businessId)
    .neq("role", "owner");
  if (error) throw error;

  revalidatePath(`/negocio/${businessId}/configuracion/equipo`);
  revalidatePath("/negocio");
  return { previousStatus: target.status as string };
}

/** Undo de removeMember: restaura status previo (active | invited). */
export async function restoreMember(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const memberId = String(formData.get("memberId") || "");
  const previousStatus = String(formData.get("previousStatus") || "active");
  if (!businessId || !memberId) throw new Error("Datos inválidos");
  if (previousStatus !== "active" && previousStatus !== "invited") {
    throw new Error("Estado inválido");
  }

  const { supabase, member: actor } = await requireBusinessAccess(businessId);
  if (!actor || (actor.role !== "owner" && actor.role !== "staff")) {
    throw new Error("Sin permiso");
  }

  const { error } = await supabase
    .from("business_members")
    .update({
      status: previousStatus,
      responded_at: previousStatus === "active" ? new Date().toISOString() : null,
    })
    .eq("id", memberId)
    .eq("business_id", businessId)
    .neq("role", "owner");
  if (error) throw error;

  revalidatePath(`/negocio/${businessId}/configuracion/equipo`);
  revalidatePath("/negocio");
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
  revalidatePath("/admin/leads");
  revalidatePath("/admin/auditoria");
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
  revalidatePath("/admin/leads");
  revalidatePath("/admin/auditoria");
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
  revalidatePath("/admin/comercios");
  revalidatePath("/admin/auditoria");
  revalidatePath("/");
}

/** Owner publishes store when their account identity is verified (test gate). */
export async function publishBusinessAction(businessId: string) {
  const { supabase, user, member } = await requireBusinessAccess(businessId);
  if (!member || member.role !== "owner") {
    throw new Error("Solo el dueño del local puede publicar.");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("identity_verified")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.identity_verified) {
    throw new Error("Verificá tu identidad en Mi perfil antes de publicar.");
  }

  const { data: biz, error: fetchErr } = await supabase
    .from("businesses")
    .select("published, slug")
    .eq("id", businessId)
    .single();
  if (fetchErr || !biz) throw new Error("Negocio no encontrado");
  if (biz.published) return { published: true, slug: biz.slug };

  const { error } = await supabase
    .from("businesses")
    .update({ published: true, updated_at: new Date().toISOString() })
    .eq("id", businessId);
  if (error) throw new Error(error.message);

  revalidatePath(`/negocio/${businessId}/dashboard`);
  revalidatePath("/");
  revalidatePath(`/c/${biz.slug}`);
  return { published: true, slug: biz.slug };
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
  revalidatePath("/admin/comercios");
  revalidatePath("/admin/auditoria");
}

export async function claimBusinessOwnership(formData: FormData) {
  const token = String(formData.get("claim") || "");
  const { user } = await requireUser();
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

export async function updateBusinessGeneralSettings(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || "Bolívar";
  const phone = String(formData.get("phone") || "").trim() || null;

  if (!businessId || !name || !slug) {
    throw new Error("Nombre y URL son requeridos");
  }

  const { supabase, business } = await requireBusinessAccess(businessId);
  const cleanSlug = slugify(slug);

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      slug: cleanSlug,
      tagline,
      address,
      city,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) {
    if (error.code === "23505") throw new Error("La URL / slug ya está en uso por otro comercio");
    throw error;
  }

  revalidatePath(`/negocio/${businessId}/configuracion`);
  revalidatePath(`/negocio/${businessId}/dashboard`);
  revalidatePath(`/c/${cleanSlug}`);
  if (business.slug !== cleanSlug) {
    revalidatePath(`/c/${business.slug}`);
  }
}

export async function updateBusinessOperationSettings(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const isOpen = formData.get("isOpen") === "true";
  const prepTimeMinutes = parseInt(String(formData.get("prepTimeMinutes") || "30"), 10);

  if (!businessId) throw new Error("ID de negocio inválido");

  const { supabase, business } = await requireBusinessAccess(businessId);

  const { error } = await supabase
    .from("businesses")
    .update({
      is_open: isOpen,
      prep_time_minutes: isNaN(prepTimeMinutes) ? 30 : prepTimeMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) throw error;

  revalidatePath(`/negocio/${businessId}/configuracion`);
  revalidatePath(`/negocio/${businessId}/dashboard`);
  revalidatePath(`/c/${business.slug}`);
}

export async function updateBusinessHoursSchedule(
  businessId: string,
  hours: { weekday: number; open_time: string; close_time: string; closed: boolean }[]
) {
  const { supabase, business } = await requireBusinessAccess(businessId);

  for (const h of hours) {
    const { error } = await supabase
      .from("business_hours")
      .upsert(
        {
          business_id: businessId,
          weekday: h.weekday,
          open_time: h.open_time,
          close_time: h.close_time,
          closed: h.closed,
        },
        { onConflict: "business_id,weekday" }
      );
    if (error) throw error;
  }

  revalidatePath(`/negocio/${businessId}/configuracion`);
  revalidatePath(`/negocio/${businessId}/dashboard`);
  revalidatePath(`/c/${business.slug}`);
}

export async function deleteBusinessAction(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const confirmation = String(formData.get("confirmation") || "").trim();

  if (!businessId) throw new Error("ID de local inválido");

  const { member, business } = await requireBusinessAccess(businessId);
  if (!member || member.role !== "owner") {
    throw new Error("Solo el Titular puede dar de baja el comercio");
  }

  if (confirmation.toLowerCase() !== business.name.toLowerCase().trim()) {
    throw new Error("El nombre ingresado para confirmar la baja no coincide exactamente");
  }

  const service = createServiceClient();
  const { error } = await service.from("businesses").delete().eq("id", businessId);
  if (error) throw error;

  revalidatePath("/negocio");
  revalidatePath("/");
  redirect("/negocio");
}
