import { createServiceClient } from "@/lib/supabase/service";
import { verifyAndParseMetaWebhook } from "@/lib/whatsapp/signature";
import { parseMetaWebhook } from "@/lib/whatsapp/webhook";
import {
  readWhatsAppToken,
  fetchMetaMedia,
} from "@/lib/whatsapp/connection";

/**
 * GET /api/webhooks/meta
 *
 * Meta webhook subscription verification. Meta hits this endpoint with
 *   ?hub.mode=subscribe&hub.verify_token=<verify token>&hub.challenge=<challenge>
 * We must echo `hub.challenge` back verbatim.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Verification failed", { status: 403 });
}

/**
 * POST /api/webhooks/meta
 *
 * Inbound WhatsApp events (messages + statuses) forwarded by Meta Cloud API.
 * - Signature is validated against META_APP_SECRET (X-Hub-Signature-256).
 * - The phone_number_id => business resolution reuses business_whatsapp.
 * - Messages are persisted to whatsapp_messages (idempotent by wa_message_id).
 * - Inbound media is downloaded to Supabase Storage (whatsapp-media) so the
 *   temporary Graph URL does not expire.
 * - Outbound statuses (sent/delivered/read) update already-persisted rows.
 */
export async function POST(request: Request) {
  const parsed = await verifyAndParseMetaWebhook(request, process.env.META_APP_SECRET);
  if (!parsed) {
    return Response.json({ success: false, message: "Firma inválida" }, { status: 401 });
  }

  const webhook = parseMetaWebhook(parsed);
  if (!webhook) {
    return Response.json({ success: false, message: "Payload inválido" }, { status: 400 });
  }

  const service = createServiceClient();

  for (const change of webhook.changes) {
    const phoneNumberId = change.metadata.phoneNumberId;

    // Resolve connection by phone_number_id (one business per number model).
    const { data: conn } = await service
      .from("business_whatsapp")
      .select("id, business_id, phone_number_id, vault_token_ref, status, is_active")
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();

    if (!conn) continue; // unknown number -> ignore (not our business)
    if (conn.status !== "connected" || conn.is_active !== true) continue;

    const businessId = conn.business_id as string;

    // Outbound delivery/read receipts: update existing rows.
    const statusUpdates = change.statuses.map(async (status) => {
      if (status.status === "sent") return;
      const { error } = await service
        .from("whatsapp_messages")
        .update({ status: status.status, updated_at: new Date().toISOString() })
        .eq("wa_message_id", status.waMessageId);
      if (error) {
        console.error(
          `webhook/meta: no se pudo actualizar estado ${status.status}`,
          error,
        );
      }
    });
    await Promise.all(statusUpdates);

    // Inbound messages: persist + download media (best-effort).
    const contact = change.contacts[0];
    const customerName = contact?.profile?.name || null;

    for (const message of change.messages) {
      const { data: existing } = await service
        .from("whatsapp_messages")
        .select("id")
        .eq("wa_message_id", message.waMessageId)
        .maybeSingle();
      if (existing) continue; // idempotency (Meta retries)

      let mediaJson: Record<string, unknown> | null = null;
      if (message.media?.id) {
        const token = await readWhatsAppToken(conn.vault_token_ref as string | null);
        if (token) {
          const downloaded = await fetchMetaMedia(message.media.id, token);
          if (downloaded) {
            const ext = (downloaded.mimeType.split("/")[1] ?? "bin").replace(/[^a-z0-9]/gi, "");
            const path = `${businessId}/${message.waMessageId}.${ext}`;
            const { error: uploadErr } = await service.storage
              .from("whatsapp-media")
              .upload(path, downloaded.bytes, { contentType: downloaded.mimeType });
            const publicUrl = uploadErr
              ? null
              : service.storage.from("whatsapp-media").getPublicUrl(path).data.publicUrl;
            mediaJson = {
              mime_type: downloaded.mimeType,
              storage_path: uploadErr ? null : path,
              storage_url: publicUrl,
              caption: message.media.caption ?? null,
              duration_ms: message.media.durationMs ?? null,
            };
          }
        }
      }

      const { error: insertErr } = await service.from("whatsapp_messages").insert({
        business_id: businessId,
        chat_id: message.from,
        direction: "inbound",
        type: message.type,
        text_body: message.text?.body ?? null,
        media_json: mediaJson,
        wa_message_id: message.waMessageId,
        status: "received",
        customer_name: customerName,
        created_at: new Date(message.timestamp * 1000).toISOString(),
      });
      if (insertErr) {
        // Sin esto un fallo de persistencia perdía el mensaje del cliente en
        // silencio (incluida la colisión de wa_message_id en reintentos).
        console.error(
          `webhook/meta: no se pudo persistir el mensaje ${message.waMessageId}`,
          insertErr,
        );
      }
    }
  }

  return Response.json({ success: true }, { status: 200 });
}