import { createClient } from "@/lib/supabase/server";
import { requireBusinessAccess } from "@/lib/business/queries";

const LEGACY_PRODUCT_COLUMNS =
  "id, business_id, name, description, category, price_cents, available, image_path, sort_order, created_at, updated_at";

const EXTENDED_PRODUCT_COLUMNS =
  `${LEGACY_PRODUCT_COLUMNS}, category_id, icon_path, ingredients, options`;

function isSchemaMissingError(message: string) {
  return /menu_categories|category_id|icon_path|ingredients|options|does not exist|Could not find/i.test(message);
}

/** Quita productos de prueba del CRUD viejo (sin categoría del menú). */
export async function pruneLegacyCartaProducts(businessId: string) {
  const { supabase } = await requireBusinessAccess(businessId);

  await supabase.from("products").delete().eq("business_id", businessId).eq("name", "");

  const probe = await supabase
    .from("products")
    .select("id")
    .eq("business_id", businessId)
    .is("category_id", null)
    .limit(1);

  if (!probe.error && probe.data) {
    await supabase.from("products").delete().eq("business_id", businessId).is("category_id", null);
  }
}

export async function listMenuCategoriesSafe(businessId: string) {
  const { supabase } = await requireBusinessAccess(businessId);
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id, business_id, name, sort_order")
    .eq("business_id", businessId)
    .order("sort_order")
    .order("name");

  if (error) {
    if (isSchemaMissingError(error.message)) return [];
    throw error;
  }
  return data ?? [];
}

export async function listProductsSafe(businessId: string) {
  const { supabase } = await requireBusinessAccess(businessId);

  const extended = await supabase
    .from("products")
    .select(EXTENDED_PRODUCT_COLUMNS)
    .eq("business_id", businessId)
    .order("sort_order")
    .order("name");

  const result =
    extended.error && isSchemaMissingError(extended.error.message)
      ? await supabase
          .from("products")
          .select(LEGACY_PRODUCT_COLUMNS)
          .eq("business_id", businessId)
          .order("sort_order")
          .order("name")
      : extended;

  if (result.error) throw result.error;
  return (result.data ?? []).map((row) => ({
    ...row,
    category_id: "category_id" in row ? (row.category_id as string | null) : null,
    icon_path: "icon_path" in row ? (row.icon_path as string | null) : null,
    ingredients: "ingredients" in row && Array.isArray(row.ingredients) ? row.ingredients : [],
    options: "options" in row && Array.isArray(row.options) ? row.options : [],
  }));
}

export async function getCartaPageData(businessId: string) {
  const { business } = await requireBusinessAccess(businessId);

  try {
    await pruneLegacyCartaProducts(businessId);
  } catch {
    // Migración pendiente o RLS — no bloqueamos la pantalla.
  }

  const categories = await listMenuCategoriesSafe(businessId);
  const products = await listProductsSafe(businessId);
  return { business, categories, products };
}

export async function listPublicMenuCategories(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id, name, sort_order")
    .eq("business_id", businessId)
    .order("sort_order")
    .order("name");

  if (error && isSchemaMissingError(error.message)) return [];
  if (error) throw error;
  return data ?? [];
}

export async function listPublicProductsSafe(businessId: string) {
  const supabase = await createClient();

  const extended = await supabase
    .from("products")
    .select(
      "id, name, description, price_cents, image_path, icon_path, category_id, category, ingredients, options, sort_order",
    )
    .eq("business_id", businessId)
    .eq("available", true)
    .order("sort_order")
    .order("name");

  const result =
    extended.error && isSchemaMissingError(extended.error.message)
      ? await supabase
          .from("products")
          .select("id, name, description, price_cents, image_path, category, sort_order")
          .eq("business_id", businessId)
          .eq("available", true)
          .order("sort_order")
          .order("name")
      : extended;

  if (result.error) throw result.error;
  return (result.data ?? []).map((row) => ({
    ...row,
    category_id: "category_id" in row ? (row.category_id as string | null) : null,
    icon_path: "icon_path" in row ? (row.icon_path as string | null) : null,
    ingredients: "ingredients" in row && Array.isArray(row.ingredients) ? row.ingredients : [],
    options: "options" in row && Array.isArray(row.options) ? row.options : [],
  }));
}
