"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireBusinessAccess } from "@/lib/business/queries";
import {
  FREE_PLAN_MAX_CATEGORIES,
  FREE_PLAN_MAX_PRODUCTS,
  isFreePlan,
} from "@/lib/business/planLimits";
import { formatMenuError } from "@/lib/business/menuErrors";
import { parseMenuOptionGroups } from "@/lib/business/menuOptionTypes";

function extFromMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

async function uploadAsset(
  businessId: string,
  relativePath: string,
  file: File,
) {
  const service = createServiceClient();
  const ext = extFromMime(file.type || "image/jpeg");
  const path = `${businessId}/${relativePath}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await service.storage.from("business-assets").upload(path, bytes, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw new Error(formatMenuError(error));
  return path;
}

async function assertProductLimit(businessId: string, plan: string, isUpdate: boolean) {
  if (!isFreePlan(plan) || isUpdate) return;
  const { supabase } = await requireBusinessAccess(businessId);
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);
  if (error) throw new Error(formatMenuError(error));
  if ((count ?? 0) >= FREE_PLAN_MAX_PRODUCTS) {
    throw new Error(`Plan Inicial: máximo ${FREE_PLAN_MAX_PRODUCTS} productos.`);
  }
}

async function assertCategoryLimit(businessId: string, plan: string) {
  if (!isFreePlan(plan)) return;
  const { supabase } = await requireBusinessAccess(businessId);
  const { count, error } = await supabase
    .from("menu_categories")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);
  if (error) throw new Error(formatMenuError(error));
  if ((count ?? 0) >= FREE_PLAN_MAX_CATEGORIES) {
    throw new Error(`Plan Inicial: máximo ${FREE_PLAN_MAX_CATEGORIES} categorías.`);
  }
}

function revalidateMenu(businessId: string, slug?: string) {
  revalidatePath(`/negocio/${businessId}/carta`);
  revalidatePath(`/negocio/${businessId}/dashboard`);
  if (slug) revalidatePath(`/c/${slug}`);
}

export async function createMenuCategoryAction(businessId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nombre de categoría requerido.");
  const { supabase, business } = await requireBusinessAccess(businessId);
  await assertCategoryLimit(businessId, business.plan);

  const { data: maxRow } = await supabase
    .from("menu_categories")
    .select("sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (maxRow?.sort_order ?? 0) + 1;
  const { error } = await supabase.from("menu_categories").insert({
    business_id: businessId,
    name: trimmed,
    sort_order: sortOrder,
  });
  if (error) throw new Error(formatMenuError(error));
  revalidateMenu(businessId, business.slug);
}

export async function reorderMenuCategoriesAction(businessId: string, orderedIds: string[]) {
  const { supabase, business } = await requireBusinessAccess(businessId);
  for (let i = 0; i < orderedIds.length; i += 1) {
    const id = orderedIds[i];
    const { error } = await supabase
      .from("menu_categories")
      .update({ sort_order: i + 1, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("business_id", businessId);
    if (error) throw new Error(formatMenuError(error));
  }
  revalidateMenu(businessId, business.slug);
}

export async function deleteMenuCategoryAction(businessId: string, categoryId: string) {
  const { supabase, business } = await requireBusinessAccess(businessId);
  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", categoryId)
    .eq("business_id", businessId);
  if (error) throw new Error(formatMenuError(error));
  revalidateMenu(businessId, business.slug);
}

export async function saveMenuProductAction(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const pricePesos = Number(formData.get("price") || 0);
  const description = String(formData.get("description") || "").trim() || null;
  const iconFile = formData.get("iconFile") as File | null;
  const photoFile = formData.get("photoFile") as File | null;
  const existingIcon = String(formData.get("existingIconPath") || "") || null;
  const existingPhoto = String(formData.get("existingPhotoPath") || "") || null;

  if (!businessId || !name || !categoryId || Number.isNaN(pricePesos) || pricePesos < 0) {
    throw new Error("Completá nombre, categoría y precio.");
  }

  const hasIcon = (iconFile && iconFile.size > 0) || existingIcon;
  if (!hasIcon) {
    throw new Error("El ícono del producto es obligatorio.");
  }

  let ingredients: string[] = [];
  try {
    const raw = formData.get("ingredients");
    if (raw) {
      const parsed = JSON.parse(String(raw));
      if (Array.isArray(parsed)) {
        ingredients = parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    }
  } catch {
    ingredients = [];
  }

  let options: ReturnType<typeof parseMenuOptionGroups> = [];
  try {
    const raw = formData.get("options");
    if (raw) options = parseMenuOptionGroups(JSON.parse(String(raw)));
  } catch {
    options = [];
  }

  const { supabase, business } = await requireBusinessAccess(businessId);
  await assertProductLimit(businessId, business.plan, Boolean(id));

  const productId = id || randomUUID();
  let iconPath = existingIcon;
  let photoPath = existingPhoto;

  if (iconFile && iconFile.size > 0) {
    iconPath = await uploadAsset(businessId, `products/${productId}/icon`, iconFile);
  }
  if (photoFile && photoFile.size > 0) {
    photoPath = await uploadAsset(businessId, `products/${productId}/photo`, photoFile);
  }

  const row = {
    business_id: businessId,
    name,
    description,
    category_id: categoryId,
    category: null,
    price_cents: Math.round(pricePesos * 100),
    available: true,
    icon_path: iconPath,
    image_path: photoPath,
    ingredients,
    options,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id).eq("business_id", businessId);
    if (error) throw new Error(formatMenuError(error));
  } else {
    const { error } = await supabase.from("products").insert({ ...row, id: productId });
    if (error) throw new Error(formatMenuError(error));
  }

  revalidateMenu(businessId, business.slug);
  return { id: id || productId };
}

export async function deleteMenuProductAction(businessId: string, productId: string) {
  const { supabase, business } = await requireBusinessAccess(businessId);
  const { error } = await supabase.from("products").delete().eq("id", productId).eq("business_id", businessId);
  if (error) throw new Error(formatMenuError(error));
  revalidateMenu(businessId, business.slug);
}

export async function pauseMenuProductAction(businessId: string, productId: string, available: boolean) {
  const { supabase, business } = await requireBusinessAccess(businessId);
  const { error } = await supabase
    .from("products")
    .update({ available, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("business_id", businessId);
  if (error) throw new Error(formatMenuError(error));
  revalidateMenu(businessId, business.slug);
}

/** Vacía productos y categorías del menú (owner/admin). */
export async function wipeBusinessCartaAction(businessId: string) {
  const { supabase, business } = await requireBusinessAccess(businessId);

  const { error: prodErr } = await supabase.from("products").delete().eq("business_id", businessId);
  if (prodErr) throw new Error(formatMenuError(prodErr));

  const catProbe = await supabase.from("menu_categories").select("id").limit(1);
  if (!catProbe.error) {
    const { error: catErr } = await supabase.from("menu_categories").delete().eq("business_id", businessId);
    if (catErr) throw new Error(formatMenuError(catErr));
  }

  revalidateMenu(businessId, business.slug);
}
