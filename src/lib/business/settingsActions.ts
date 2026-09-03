"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireBusinessAccess } from "@/lib/business/queries";
import { toStoredPhone } from "@/lib/business/phone";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

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

function revalidateSettings(businessId: string, slug: string, prevSlug?: string) {
  revalidatePath(`/negocio/${businessId}/configuracion`);
  revalidatePath(`/negocio/${businessId}/dashboard`);
  revalidatePath(`/c/${slug}`);
  if (prevSlug && prevSlug !== slug) revalidatePath(`/c/${prevSlug}`);
}

function extFromMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

async function removeAsset(path: string | null | undefined) {
  if (!path || path.startsWith("http://") || path.startsWith("https://")) return;
  const service = createServiceClient();
  await service.storage.from("business-assets").remove([path.replace(/^\/+/, "")]);
}

async function uploadAsset(
  businessId: string,
  kind: "logo" | "banner",
  file: File,
  previousPath?: string | null,
) {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Usá PNG, JPEG, GIF o WebP.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("La imagen debe pesar menos de 2 MB.");

  const service = createServiceClient();
  // Cliente ya manda WebP vía optimizeImageFile; fallback conserva mime.
  const isWebp = file.type === "image/webp" || file.name.endsWith(".webp");
  const path = `${businessId}/${kind}-${randomUUID().slice(0, 8)}.${isWebp ? "webp" : extFromMime(file.type)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await service.storage.from("business-assets").upload(path, bytes, {
    upsert: false,
    contentType: isWebp ? "image/webp" : file.type || "image/jpeg",
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message);
  if (previousPath && previousPath !== path) await removeAsset(previousPath);
  return path;
}

export async function updateBusinessProfileAction(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const name = String(formData.get("name") || "").trim();
  const slugRaw = String(formData.get("slug") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || "San Carlos de Bolivar";
  const phoneRaw = String(formData.get("phone") || "").trim();
  let phone: string | null = null;
  if (phoneRaw) {
    phone = toStoredPhone(phoneRaw);
    if (!phone) throw new Error("Teléfono inválido (mín. 8 dígitos)");
  }

  if (!businessId || !name) throw new Error("Nombre requerido");

  const slug = slugify(slugRaw || name);
  const { supabase, business } = await requireBusinessAccess(businessId);

  if (slug !== business.slug) {
    const { data: taken } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .neq("id", businessId)
      .maybeSingle();
    if (taken) throw new Error("Esa URL ya está en uso");
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      slug,
      tagline,
      address,
      city,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);
  if (error) throw new Error(error.message);

  revalidateSettings(businessId, slug, business.slug);
}

export async function uploadBusinessImageAction(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const kind = String(formData.get("kind") || "") as "logo" | "banner";
  const file = formData.get("file") as File | null;
  if (!businessId || (kind !== "logo" && kind !== "banner") || !file?.size) {
    throw new Error("Imagen inválida");
  }

  const { supabase, business } = await requireBusinessAccess(businessId);
  const prev = kind === "logo" ? business.logo_path : business.banner_path;
  const path = await uploadAsset(businessId, kind, file, prev);
  const patch =
    kind === "logo"
      ? { logo_path: path, updated_at: new Date().toISOString() }
      : { banner_path: path, updated_at: new Date().toISOString() };

  const { error } = await supabase.from("businesses").update(patch).eq("id", businessId);
  if (error) throw new Error(error.message);

  revalidateSettings(businessId, business.slug);
}

export async function removeBusinessImageAction(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const kind = String(formData.get("kind") || "") as "logo" | "banner";
  if (!businessId || (kind !== "logo" && kind !== "banner")) throw new Error("Datos inválidos");

  const { supabase, business } = await requireBusinessAccess(businessId);
  const prev = kind === "logo" ? business.logo_path : business.banner_path;
  const patch =
    kind === "logo"
      ? { logo_path: null, updated_at: new Date().toISOString() }
      : { banner_path: null, updated_at: new Date().toISOString() };

  const { error } = await supabase.from("businesses").update(patch).eq("id", businessId);
  if (error) throw new Error(error.message);
  await removeAsset(prev);

  revalidateSettings(businessId, business.slug);
}

export async function updateBusinessOperationAction(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const prep = Number(formData.get("prepTime") || 30);
  const isOpen = formData.get("isOpen") === "on" || formData.get("isOpen") === "true";
  if (!businessId || Number.isNaN(prep) || prep < 5 || prep > 180) {
    throw new Error("Tiempo de preparación inválido (5–180 min)");
  }

  const { supabase, business } = await requireBusinessAccess(businessId);
  const { error } = await supabase
    .from("businesses")
    .update({
      prep_time_minutes: Math.round(prep),
      is_open: isOpen,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);
  if (error) throw new Error(error.message);

  revalidateSettings(businessId, business.slug);
}

export async function updateBusinessHoursAction(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  if (!businessId) throw new Error("Negocio inválido");

  const { supabase, business } = await requireBusinessAccess(businessId);
  const rows = Array.from({ length: 7 }, (_, weekday) => {
    const closed = formData.get(`closed_${weekday}`) === "on";
    const open = String(formData.get(`open_${weekday}`) || "").trim() || null;
    const close = String(formData.get(`close_${weekday}`) || "").trim() || null;
    return {
      business_id: businessId,
      weekday,
      closed,
      open_time: closed ? null : open,
      close_time: closed ? null : close,
    };
  });

  for (const row of rows) {
    if (!row.closed && (!row.open_time || !row.close_time)) {
      throw new Error("Completá apertura y cierre en los días abiertos");
    }
    const { error } = await supabase.from("business_hours").upsert(row, {
      onConflict: "business_id,weekday",
    });
    if (error) throw new Error(error.message);
  }

  revalidateSettings(businessId, business.slug);
}
