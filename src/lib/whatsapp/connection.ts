import { createServiceClient } from "@/lib/supabase/service";
import { fetchWithTimeout, graphFetch } from "@/lib/whatsapp/graph";

/** La media (audio/video) puede pesar, así que va más holgado que una llamada normal. */
const MEDIA_DOWNLOAD_TIMEOUT_MS = 30_000;

export type WhatsAppConnectionRow = {
  id: string;
  business_id: string;
  phone_number_id: string;
  display_phone_number: string | null;
  waba_id: string | null;
  status: string;
  vault_token_ref: string | null;
  is_active: boolean;
  token_expires_at: string | null;
  notify_status: boolean | null;
  template_order_status_name: string | null;
  template_order_status_language: string | null;
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
      "id, business_id, phone_number_id, display_phone_number, waba_id, status, vault_token_ref, is_active, token_expires_at, notify_status, template_order_status_name, template_order_status_language",
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
  try {
    // 1. Resolve media metadata -> temporary URL (valid ~5 min).
    const metaJson = await graphFetch<{ url?: string; mime_type?: string }>({
      path: mediaId,
      token: accessToken,
    });
    if (!metaJson.url) return null;

    // 2. Download the actual bytes from the temporary URL. No pasa por
    // `graphFetch` porque la respuesta es binaria y el host es un CDN, pero
    // sigue necesitando el token y un timeout (los audios pueden ser grandes).
    const res = await fetchWithTimeout(
      metaJson.url,
      { headers: { Authorization: `Bearer ${accessToken}` } },
      MEDIA_DOWNLOAD_TIMEOUT_MS,
    );
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    const header = res.headers.get("content-type");
    return { bytes, mimeType: metaJson.mime_type || header || "application/octet-stream" };
  } catch (err) {
    console.error(`fetchMetaMedia: no se pudo descargar el media ${mediaId}`, err);
    return null;
  }
}