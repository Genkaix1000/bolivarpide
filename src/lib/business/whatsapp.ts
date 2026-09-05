"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireBusinessAccess, requireUser } from "@/lib/business/queries";

async function requireAdminScoped() {
  const { user } = await requireUser();
  if (user.app_metadata?.role !== "admin") throw new Error("Forbidden");
  return { service: createServiceClient() };
}

/** Admin: activate / deactivate a connected number. */
export async function setWhatsAppActive(formData: FormData) {
  const connectionId = String(formData.get("connectionId") || "");
  const active = formData.get("active") === "true";
  const { service } = await requireAdminScoped();
  const { error } = await service
    .from("business_whatsapp")
    .update({
      status: active ? "connected" : "unverified",
      is_active: active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId);
  if (error) throw error;
  revalidatePath("/admin");
}

/**
 * Connects (or updates) the WhatsApp number of a business (vía manual, para
 * casos técnicos: el camino normal es el OAuth de `linkWhatsAppViaOAuth`).
 *
 * The Meta access token never reaches the browser or the app tables: it is
 * stored encrypted in Supabase Vault and only the id is referenced from
 * business_whatsapp.vault_token_ref.
 *
 * On first connection the number is left as `unverified` (lo habilita un
 * admin). Editar o rotar el token de un número YA conectado no lo degrada:
 * antes este formulario mandaba siempre `unverified`/`is_active: false`, así
 * que tocar cualquier dato desconectaba una integración viva.
 *
 * Los ajustes de notificación viven en `updateWhatsAppNotifySettings`: si se
 * escribieran acá, guardar la conexión los pisaría con los defaults del form.
 */
export async function connectWhatsAppNumber(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const phoneNumberId = String(formData.get("phoneNumberId") || "").trim();
  const displayPhoneNumber = String(
    formData.get("displayPhoneNumber") || "",
  ).trim();
  const wabaId = String(formData.get("wabaId") || "").trim();
  const accessToken = String(formData.get("accessToken") || "").trim();

  if (!businessId || !phoneNumberId) throw new Error("Faltan datos del número");

  await requireBusinessAccess(businessId);
  const service = createServiceClient();

  const { data: existing } = await service
    .from("business_whatsapp")
    .select("id, vault_token_ref, phone_number_id, status, is_active")
    .eq("business_id", businessId)
    .maybeSingle();

  // El token es opcional cuando ya hay uno guardado (el placeholder del form
  // promete "dejar vacío para no cambiar"); obligatorio en el alta.
  if (accessToken && accessToken.length < 10) {
    throw new Error("Access token inválido");
  }
  if (!accessToken && !existing?.vault_token_ref) {
    throw new Error("Falta el access token de Meta");
  }

  // 1. Store/rotate the token in Vault (encrypted at rest).
  // vault.create_secret / vault.update_secret return/use the secret UUID.
  let vaultTokenRef: string;
  if (existing?.vault_token_ref) {
    if (accessToken) {
      const { error } = await service
        .schema("vault")
        .rpc("update_secret", {
          secret_id: existing.vault_token_ref,
          new_secret: accessToken,
        });
      if (error) throw error;
    }
    vaultTokenRef = existing.vault_token_ref;
  } else {
    const { data, error } = await service
      .schema("vault")
      .rpc("create_secret", {
        new_secret: accessToken,
        new_name: `whatsapp_token_${businessId}`,
      });
    if (error) throw error;
    vaultTokenRef = data;
  }

  // 2. Upsert the connection row. Un número distinto sí vuelve a `unverified`:
  // es otra línea y hay que re-verificarla.
  const isSameNumber = existing?.phone_number_id === phoneNumberId;
  const keepConnected = Boolean(existing) && isSameNumber;

  const { error } = await service.from("business_whatsapp").upsert(
    {
      business_id: businessId,
      phone_number_id: phoneNumberId,
      display_phone_number: displayPhoneNumber || null,
      waba_id: wabaId || null,
      vault_token_ref: vaultTokenRef,
      status: keepConnected ? existing!.status : "unverified",
      is_active: keepConnected ? existing!.is_active : false,
      // Un token pegado a mano no tiene vencimiento conocido: dejar el
      // `token_expires_at` del OAuth bloquearía los envíos al vencer.
      ...(accessToken ? { token_expires_at: null } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" },
  );
  if (error) throw error;

  revalidatePath(`/negocio/${businessId}/configuracion`);
}

/**
 * Ajustes de notificación de estado por WhatsApp (toggle + template).
 *
 * Va separado de `connectWhatsAppNumber` a propósito: son los únicos campos
 * que el dueño necesita tocar seguido, y antes sólo se podían guardar desde el
 * formulario de conexión, que además exigía re-pegar el token y desconectaba
 * el número.
 */
export async function updateWhatsAppNotifySettings(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const notifyStatus = formData.get("notifyStatus") === "true";
  const templateOrderStatusName =
    String(formData.get("templateOrderStatusName") || "").trim() || null;
  const templateOrderStatusLanguage =
    String(formData.get("templateOrderStatusLanguage") || "").trim() || "es_AR";

  if (!businessId) throw new Error("Falta el negocio");

  await requireBusinessAccess(businessId);
  const service = createServiceClient();

  const { data: existing } = await service
    .from("business_whatsapp")
    .select("id")
    .eq("business_id", businessId)
    .maybeSingle();
  if (!existing) throw new Error("Primero conectá tu número de WhatsApp");

  const { error } = await service
    .from("business_whatsapp")
    .update({
      notify_status: notifyStatus,
      template_order_status_name: templateOrderStatusName,
      template_order_status_language: templateOrderStatusLanguage,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", businessId);
  if (error) throw error;

  revalidatePath(`/negocio/${businessId}/configuracion`);
}