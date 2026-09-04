import { createServiceClient } from "@/lib/supabase/service";

export type WhatsAppConnectionRow = {
  id: string;
  business_id: string;
  phone_number_id: string;
  display_phone_number: string | null;
  waba_id: string | null;
  status: string;
  vault_token_ref: string | null;
  is_active: boolean;
};

/**
 * Loads the active WhatsApp connection for a business (service_role).
 * Returns null when the business has no connected/active number.
 */
export async function getActiveWhatsAppConnection(
  businessId: string,
): Promise<WhatsAppConnectionRow | null> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("business_whatsapp")
    .select(
      "id, business_id, phone_number_id, display_phone_number, waba_id, status, vault_token_ref, is_active",
    )
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.status !== "connected" || data.is_active !== true) return null;
  return data as WhatsAppConnectionRow;
}

/**
 * Reads the Meta access token stored encrypted in Supabase Vault.
 * Returns null if there is no vault ref (missing token).
 */
export async function readWhatsAppToken(vaultTokenRef: string | null): Promise<string | null> {
  if (!vaultTokenRef) return null;
  const service = createServiceClient();
  const { data, error } = await service
    .schema("vault")
    .from("decrypted_secrets")
    .select("decrypted_secret")
    .eq("id", vaultTokenRef)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { decrypted_secret: string }).decrypted_secret ?? null;
}

/** Download the inbound media payload over the Graph API using the business token. */
export async function fetchMetaMedia(
  mediaId: string,
  accessToken: string,
): Promise<{ bytes: Buffer; mimeType: string } | null> {
  const graphBase = process.env.META_GRAPH_VERSION
    ? `https://graph.facebook.com/${process.env.META_GRAPH_VERSION}`
    : "https://graph.facebook.com/v21.0";

  // 1. Resolve media metadata -> temporary URL (valid ~5 min).
  const meta = await fetch(`${graphBase}/${mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meta.ok) return null;
  const metaJson = (await meta.json()) as { url?: string; mime_type?: string };
  if (!metaJson.url) return null;

  // 2. Download the actual bytes from the temporary URL.
  const res = await fetch(metaJson.url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  const header = res.headers.get("content-type");
  return { bytes, mimeType: metaJson.mime_type || header || "application/octet-stream" };
}