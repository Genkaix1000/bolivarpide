// Run: npx tsx src/lib/whatsapp/webhook.check.ts
import assert from "node:assert/strict";
import { parseMetaWebhook } from "@/lib/whatsapp/webhook";

const NOW_MS = Date.UTC(2026, 8, 5, 12, 0, 0); // 2026-09-05T12:00:00Z
const NOW_S = Math.floor(NOW_MS / 1000);

/** Payload con la forma real que manda Meta Cloud API (numéricos como string). */
function metaPayload(value: Record<string, unknown>) {
  return {
    object: "whatsapp_business_account",
    entry: [{ id: "WABA_ID", changes: [{ field: "messages", value }] }],
  };
}

function metadata() {
  return { display_phone_number: "5492314443322", phone_number_id: "109999999999999" };
}

// ---------------------------------------------------------------------------
// timestamp: Meta lo manda como STRING de epoch en segundos.
// Regresión: un guard `typeof v === "number"` lo tiraba a 0 => created_at 1970
// => la ventana de 24 h quedaba vencida siempre y el negocio no podía responder.
// ---------------------------------------------------------------------------
{
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      contacts: [{ profile: { name: "Juan" }, wa_id: "5492314111222" }],
      messages: [
        {
          from: "5492314111222",
          id: "wamid.TEXT1",
          timestamp: "1757030400",
          text: { body: "Hola, quiero 2 muzzas" },
          type: "text",
        },
      ],
    }),
    NOW_MS,
  );

  const msg = parsed!.changes[0].messages[0];
  assert.equal(msg.timestamp, 1757030400);
  assert.equal(new Date(msg.timestamp * 1000).toISOString(), "2025-09-05T00:00:00.000Z");
  assert.equal(msg.type, "text");
  assert.equal(msg.text?.body, "Hola, quiero 2 muzzas");
  assert.equal(parsed!.changes[0].contacts[0].profile?.name, "Juan");
  assert.equal(parsed!.changes[0].metadata.phoneNumberId, "109999999999999");
}

// Un timestamp numérico (por si Meta o un test lo manda así) sigue funcionando.
{
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      messages: [{ from: "5492314111222", id: "wamid.N", timestamp: 1757030400, type: "text", text: { body: "hi" } }],
    }),
    NOW_MS,
  );
  assert.equal(parsed!.changes[0].messages[0].timestamp, 1757030400);
}

// Timestamp en milisegundos: se normaliza a segundos en vez de mandar el
// mensaje al año 57000.
{
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      messages: [{ from: "549231411", id: "wamid.MS", timestamp: "1757030400000", type: "text", text: { body: "hi" } }],
    }),
    NOW_MS,
  );
  assert.equal(parsed!.changes[0].messages[0].timestamp, 1757030400);
}

// Ausente / basura / 0 => "ahora", nunca 1970 (si no, se cierra la ventana).
for (const bogus of [undefined, null, "", "  ", "hola", 0, "0", -5, Number.NaN]) {
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      messages: [{ from: "549231411", id: `wamid.B${String(bogus)}`, timestamp: bogus, type: "text", text: { body: "x" } }],
    }),
    NOW_MS,
  );
  const ts = parsed!.changes[0].messages[0].timestamp;
  assert.equal(ts, NOW_S, `timestamp inválido (${String(bogus)}) debía caer en "ahora"`);
  assert.equal(new Date(ts * 1000).getUTCFullYear(), 2026);
}

// ---------------------------------------------------------------------------
// Media y tipos no-texto
// ---------------------------------------------------------------------------
{
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      messages: [
        {
          from: "5492314111222",
          id: "wamid.AUDIO",
          timestamp: "1757030460",
          type: "audio",
          audio: { id: "media-123", mime_type: "audio/ogg; codecs=opus", sha256: "abc", voice: true },
        },
        {
          from: "5492314111222",
          id: "wamid.IMG",
          timestamp: "1757030470",
          type: "image",
          image: { id: "media-456", mime_type: "image/jpeg", caption: "comprobante" },
        },
      ],
    }),
    NOW_MS,
  );

  const [audio, image] = parsed!.changes[0].messages;
  assert.equal(audio.type, "audio");
  assert.equal(audio.media?.id, "media-123");
  assert.equal(audio.media?.mimeType, "audio/ogg; codecs=opus");
  assert.equal(image.type, "image");
  assert.equal(image.media?.id, "media-456");
  assert.equal(image.media?.caption, "comprobante");
}

// Ubicación: payload estructurado, no media. Antes caía en la rama de media,
// no encontraba `id`/`mime_type` y llegaba al chat como burbuja vacía.
{
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      messages: [
        {
          from: "5492314111222",
          id: "wamid.LOC",
          timestamp: "1757030520",
          type: "location",
          location: {
            latitude: -36.2301,
            longitude: -61.1134,
            name: "Casa",
            address: "Av. San Martín 123",
          },
        },
      ],
    }),
    NOW_MS,
  );

  const msg = parsed!.changes[0].messages[0];
  assert.equal(msg.type, "location");
  assert.equal(msg.location?.latitude, -36.2301);
  assert.equal(msg.location?.longitude, -61.1134);
  assert.equal(msg.location?.name, "Casa");
  assert.equal(msg.location?.address, "Av. San Martín 123");
  assert.equal(msg.media, undefined);
}

// Ubicación con coordenadas como string (Meta serializa números así).
{
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      messages: [
        {
          from: "549231411",
          id: "wamid.LOC2",
          timestamp: "1757030520",
          type: "location",
          location: { latitude: "-36.23", longitude: "-61.11" },
        },
      ],
    }),
    NOW_MS,
  );
  assert.equal(parsed!.changes[0].messages[0].location?.latitude, -36.23);
}

// Ubicación sin coordenadas: no se inventa un punto en (0,0).
{
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      messages: [
        { from: "549231411", id: "wamid.LOC3", timestamp: "1757030520", type: "location", location: { name: "x" } },
      ],
    }),
    NOW_MS,
  );
  assert.equal(parsed!.changes[0].messages[0].location, undefined);
}

// Contactos: array de tarjetas, no un objeto.
{
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      messages: [
        {
          from: "5492314111222",
          id: "wamid.CONTACT",
          timestamp: "1757030530",
          type: "contacts",
          contacts: [
            {
              name: { formatted_name: "Ana Gómez", first_name: "Ana" },
              phones: [{ phone: "+54 9 2314 55-6677", wa_id: "5492314556677" }],
            },
            {
              name: { first_name: "Luis", last_name: "Pérez" },
              phones: [],
            },
          ],
        },
      ],
    }),
    NOW_MS,
  );

  const msg = parsed!.changes[0].messages[0];
  assert.equal(msg.type, "contacts");
  assert.equal(msg.contacts?.length, 2);
  assert.equal(msg.contacts?.[0].name, "Ana Gómez");
  assert.deepEqual(msg.contacts?.[0].phones, ["+54 9 2314 55-6677"]);
  assert.equal(msg.contacts?.[1].name, "Luis Pérez");
  assert.deepEqual(msg.contacts?.[1].phones, []);
}

// Documento: conserva el nombre del archivo para mostrarlo en el chat.
{
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      messages: [
        {
          from: "549231411",
          id: "wamid.DOC",
          timestamp: "1757030540",
          type: "document",
          document: { id: "media-doc", mime_type: "application/pdf", filename: "comprobante.pdf" },
        },
      ],
    }),
    NOW_MS,
  );
  const msg = parsed!.changes[0].messages[0];
  assert.equal(msg.type, "document");
  assert.equal(msg.media?.fileName, "comprobante.pdf");
}

// Tipo desconocido => "unsupported" (no rompe la ingesta del resto del lote).
{
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      messages: [
        { from: "549231411", id: "wamid.RXN", timestamp: "1757030400", type: "reaction", reaction: { emoji: "👍" } },
        { from: "549231411", id: "wamid.OK", timestamp: "1757030401", type: "text", text: { body: "ok" } },
      ],
    }),
    NOW_MS,
  );
  assert.equal(parsed!.changes[0].messages.length, 2);
  assert.equal(parsed!.changes[0].messages[0].type, "unsupported");
  assert.equal(parsed!.changes[0].messages[1].type, "text");
}

// ---------------------------------------------------------------------------
// Statuses (delivery receipts) — mismo problema de string en timestamp/code.
// ---------------------------------------------------------------------------
{
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      statuses: [
        { id: "wamid.OUT1", status: "delivered", timestamp: "1757030500", recipient_id: "5492314111222" },
        {
          id: "wamid.OUT2",
          status: "failed",
          timestamp: "1757030600",
          recipient_id: "5492314111222",
          errors: [
            {
              code: "131047",
              title: "Re-engagement message",
              error_data: { details: "Message failed to send because more than 24 hours have passed." },
            },
          ],
        },
      ],
    }),
    NOW_MS,
  );

  const [delivered, failed] = parsed!.changes[0].statuses;
  assert.equal(delivered.status, "delivered");
  assert.equal(delivered.timestamp, 1757030500);
  assert.equal(failed.status, "failed");
  assert.equal(failed.errors?.[0].code, 131047);
  assert.equal(failed.errors?.[0].title, "Re-engagement message");
  assert.ok(failed.errors?.[0].error_data?.details?.includes("24 hours"));
}

// ---------------------------------------------------------------------------
// Payloads que hay que descartar
// ---------------------------------------------------------------------------
assert.equal(parseMetaWebhook(null), null);
assert.equal(parseMetaWebhook("nope"), null);
assert.equal(parseMetaWebhook({ object: "page", entry: [] }), null);
assert.equal(parseMetaWebhook({ object: "whatsapp_business_account" }), null);

// Un change sin phone_number_id no se puede rutear a un negocio => se ignora.
{
  const parsed = parseMetaWebhook(
    metaPayload({ metadata: {}, messages: [{ from: "1", id: "wamid.X", timestamp: "1757030400", type: "text" }] }),
    NOW_MS,
  );
  assert.equal(parsed!.changes.length, 0);
}

// Campos que no son "messages" (p. ej. message_template_status_update) se ignoran.
{
  const parsed = parseMetaWebhook(
    {
      object: "whatsapp_business_account",
      entry: [{ id: "W", changes: [{ field: "message_template_status_update", value: { event: "APPROVED" } }] }],
    },
    NOW_MS,
  );
  assert.equal(parsed!.changes.length, 0);
}

// Mensajes sin id o sin from se descartan sin tirar abajo el lote.
{
  const parsed = parseMetaWebhook(
    metaPayload({
      metadata: metadata(),
      messages: [
        { id: "wamid.NOFROM", timestamp: "1757030400", type: "text" },
        { from: "549231411", timestamp: "1757030400", type: "text" },
        { from: "549231411", id: "wamid.GOOD", timestamp: "1757030400", type: "text", text: { body: "ok" } },
      ],
    }),
    NOW_MS,
  );
  assert.equal(parsed!.changes[0].messages.length, 1);
  assert.equal(parsed!.changes[0].messages[0].waMessageId, "wamid.GOOD");
}

console.log("whatsapp webhook checks OK");
