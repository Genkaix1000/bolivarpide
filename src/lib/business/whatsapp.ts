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
 * Connects (or updates) the WhatsApp number of a business.
 *
 * The Meta access token never reaches the browser or the app tables: it is
 * stored encrypted in Supabase Vault and only the id is referenced from
 * business_whatsapp.vault_token_ref.
 *
 * On first connection the number is left as `unverified`: it becomes
 * `connected` once n8n confirms the webhook/phone (admin step).
 */
export async function connectWhatsAppNumber(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const phoneNumberId = String(formData.get("phoneNumberId") || "").trim();
  const displayPhoneNumber = String(
    formData.get("displayPhoneNumber") || "",
  ).trim();
  const wabaId = String(formData.get("wabaId") || "").trim();
  const accessToken = String(formData.get("accessToken") || "").trim();
  const notifyStatus = formData.get("notifyStatus") === "true";
  const templateOrderStatusName = String(
    formData.get("templateOrderStatusName") || "",
  ).trim() || null;
  const templateOrderStatusLanguage = (
    String(formData.get("templateOrderStatusLanguage") || "").trim() || "es_AR"
  );

  if (!businessId || !phoneNumberId) throw new Error("Faltan datos del número");
  if (accessToken.length < 10) throw new Error("Access token inválido");

  await requireBusinessAccess(businessId);
  const service = createServiceClient();

  const { data: existing } = await service
    .from("business_whatsapp")
    .select("id, vault_token_ref")
    .eq("business_id", businessId)
    .maybeSingle();

  // 1. Store/rotate the token in Vault (encrypted at rest).
  // vault.create_secret / vault.update_secret return/use the secret UUID.
  let vaultTokenRef: string;
  if (existing?.vault_token_ref) {
    const { error } = await service
      .schema("vault")
      .rpc("update_secret", {
        secret_id: existing.vault_token_ref,
        new_secret: accessToken,
      });
    if (error) throw error;
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

  // 2. Upsert the connection row.
  const { error } = await service.from("business_whatsapp").upsert(
    {
      business_id: businessId,
      phone_number_id: phoneNumberId,
      display_phone_number: displayPhoneNumber || null,
      waba_id: wabaId || null,
      vault_token_ref: vaultTokenRef,
      status: "unverified",
      is_active: false,
      notify_status: notifyStatus,
      template_order_status_name: templateOrderStatusName,
      template_order_status_language: templateOrderStatusLanguage,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" },
  );
  if (error) throw error;

  revalidatePath(`/negocio/${businessId}/configuracion`);
}