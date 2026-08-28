"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/business/queries";
import { resolveCategory } from "@/lib/business/categories";
import { CreateBusinessOnboardingSchema } from "@/lib/business/onboardingSchemas";

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

async function userOwnsBusiness(userId: string) {
  const service = createServiceClient();
  const { data } = await service
    .from("business_members")
    .select("business_id")
    .eq("user_id", userId)
    .eq("role", "owner")
    .eq("status", "active")
    .maybeSingle();
  return data?.business_id ?? null;
}

export async function createBusinessFromOnboarding(input: unknown) {
  const parsed = CreateBusinessOnboardingSchema.parse(input);
  if (parsed.plan !== "free") {
    throw new Error("Solo el Plan Inicial está disponible por ahora");
  }

  const { user } = await requireUser();
  const service = createServiceClient();

  const existing = await userOwnsBusiness(user.id);
  if (existing) {
    throw new Error("Ya tenés un local registrado");
  }

  const { category, customCategoryInput } = resolveCategory(
    parsed.categorySelection,
    parsed.customCategoryInput,
  );

  let slug = slugify(parsed.name);
  const { data: slugTaken } = await service
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (slugTaken) slug = `${slug}-${randomBytes(2).toString("hex")}`;

  const { data: business, error: bizError } = await service
    .from("businesses")
    .insert({
      name: parsed.name,
      slug,
      category,
      custom_category_input: customCategoryInput,
      phone: parsed.phone,
      address: parsed.address,
      city: "San Carlos de Bolivar",
      province: "Buenos Aires",
      postal_code: "6550",
      plan: parsed.plan,
      is_open: false,
      published: false,
      verification_level: 1,
      verification_status: "unverified",
    })
    .select("id")
    .single();

  if (bizError || !business) {
    throw new Error(bizError?.message ?? "No se pudo crear el comercio");
  }

  const hours = Array.from({ length: 7 }, (_, weekday) => ({
    business_id: business.id,
    weekday,
    open_time: "09:00",
    close_time: "23:00",
    closed: weekday === 0,
  }));
  await service.from("business_hours").insert(hours);

  const { error: memberError } = await service.from("business_members").insert({
    business_id: business.id,
    user_id: user.id,
    role: "owner",
    status: "active",
    responded_at: new Date().toISOString(),
  });
  if (memberError) throw new Error(memberError.message);

  await service.from("admin_audit_log").insert({
    actor_user_id: user.id,
    action: "create_business_onboarding",
    target_type: "business",
    target_id: business.id,
    meta: { plan: parsed.plan, category },
  });

  revalidatePath("/negocio");
  revalidatePath("/admin");
  redirect(`/negocio/${business.id}/dashboard`);
}
