"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireBusinessAccess, requireUser } from "@/lib/business/queries";

async function requireAdminScoped() {
  const { user } = await requireUser();
  const { isPlatformSuperadmin } = await import("@/lib/admin/platform");
  if (!isPlatformSuperadmin(user)) throw new Error("Forbidden");
  return { user, service: createServiceClient() };
}

/** Admin: activate / deactivate a connected number. */
export async function setWhatsAppActive(formData: FormData) {
  const connectionId = String(formData.get("connectionId") || "");
  const active = formData.get("active") === "true";
  const { user, service } = await requireAdminScoped();
  const { data: conn } = await service
    .from("business_whatsapp")
    .select("business_id, display_phone_number")
    .eq("id", connectionId)
    .maybeSingle();
  const { error } = await service
    .from("business_whatsapp")
    .update({
      status: active ? "connected" : "unverified",
      is_active: active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId);
  if (error) throw error;
  const { writeAdminAudit } = await import("@/lib/admin/audit");
  await writeAdminAudit({
    actorUserId: user.id,
    action: "whatsapp_set_active",
    targetType: "business",
    targetId: conn?.business_id ?? connectionId,
    meta: { phone_e164: conn?.display_phone_number ?? null, active },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/soporte");
  revalidatePath("/admin/auditoria");
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
 * Desconecta el número: corta la entrega de webhooks y deja la conexión
 * inactiva, así ningún camino de envío la toma (todos pasan por
 * `getActiveWhatsAppConnection`).
 *
 * No se borra el secreto del Vault: reconectar sigue siendo un click, y el
 * token de todos modos vence solo. Si Meta rechaza la baja de la suscripción
 * igual se desactiva localmente — que es lo que el dueño pidió.
 */
export async function disconnectWhatsAppNumber(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  if (!businessId) throw new Error("Falta el negocio");

  await requireBusinessAccess(businessId);
  const service = createServiceClient();

  const { data: existing } = await service
    .from("business_whatsapp")
    .select("id, waba_id, vault_token_ref, token_expires_at")
    .eq("business_id", businessId)
    .maybeSingle();
  if (!existing) throw new Error("No hay ningún número conectado");

  if (existing.waba_id) {
    try {
      const { readConnectionToken, unsubscribeAppFromWaba } = await import(
        "@/lib/whatsapp/oauth"
      );
      const token = await readConnectionToken({
        vault_token_ref: existing.vault_token_ref,
        token_expires_at: existing.token_expires_at,
      });
      if (token) await unsubscribeAppFromWaba(existing.waba_id, token);
    } catch (err) {
      console.warn("disconnectWhatsAppNumber: no se pudo desuscribir la WABA", err);
    }
  }

  const { error } = await service
    .from("business_whatsapp")
    .update({
      status: "unverified",
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", businessId);
  if (error) throw error;

  revalidatePath(`/negocio/${businessId}/configuracion`);
  revalidatePath(`/negocio/${businessId}/whatsapp`);
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