import type {
  ParsedWhatsAppChange,
  ParsedWhatsAppMessage,
  ParsedWhatsAppStatus,
  ParsedWhatsAppWebhook,
  WhatsAppMediaKind,
  WhatsAppMessageType,
} from "./types";

const MEDIA_TYPES = new Set([
  "image",
  "audio",
  "video",
  "sticker",
  "document",
  "location",
  "contacts",
]);

type RawItem = Record<string, unknown>;

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

function parseMessage(raw: RawItem): ParsedWhatsAppMessage | null {
  const id = str(raw.id);
  const from = str(raw.from);
  if (!id || !from) return null;

  const rawType = str(raw.type) ?? "unknown";
  const type: WhatsAppMessageType =
    rawType === "text" ? "text" : MEDIA_TYPES.has(rawType) ? (rawType as WhatsAppMediaKind) : "unsupported";

  const out: ParsedWhatsAppMessage = {
    waMessageId: id,
    from,
    timestamp: num(raw.timestamp) ?? 0,
    type,
  };

  if (type === "text") {
    const textObj = raw.text as RawItem | undefined;
    const body = textObj && str(textObj.body);
    if (body) out.text = { body };
  } else if (type !== "unsupported") {
    const m = raw[rawType] as RawItem | undefined;
    if (m) {
      out.media = {
        id: str(m.id),
        mimeType: str(m.mime_type),
        sha256: str(m.sha256),
        caption: str(m.caption),
        fileName: str(m.filename),
        bytes: num(m.size),
      };
      if (type === "audio" || type === "video") {
        out.media.durationMs = num(m.duration);
      }
    }
  }

  const context = raw.context as RawItem | undefined;
  if (context && (str(context.from) || str(context.id))) {
    out.context = {
      from: str(context.from),
      id: str(context.id),
    };
  }

  return out;
}

function parseStatus(raw: RawItem): ParsedWhatsAppStatus | null {
  const id = str(raw.id);
  const status = str(raw.status);
  if (!id || !status) return null;
  const errList = Array.isArray(raw.errors) ? (raw.errors as RawItem[]) : undefined;
  return {
    waMessageId: id,
    status: status as ParsedWhatsAppStatus["status"],
    timestamp: num(raw.timestamp) ?? 0,
    recipientId: str(raw.recipient_id),
    errors: errList
      ?.map((e) => ({
        code: num(e.code) ?? 0,
        title: str(e.title),
        message: str(e.message),
        error_data:
          e.error_data && typeof e.error_data === "object"
            ? { details: str((e.error_data as RawItem).details) }
            : undefined,
      }))
      .filter((e) => e.code > 0 || e.message || e.title),
  };
}

export function parseMetaWebhook(body: unknown): ParsedWhatsAppWebhook | null {
  if (!body || typeof body !== "object") return null;
  const root = body as { object?: unknown; entry?: unknown };

  if (root.object !== "whatsapp_business_account" || !Array.isArray(root.entry)) {
    return null;
  }

  const changes: ParsedWhatsAppChange[] = [];
  for (const entry of root.entry) {
    if (!entry || typeof entry !== "object") continue;
    const entryObj = entry as { id?: unknown; changes?: unknown };
    if (!Array.isArray(entryObj.changes)) continue;
    for (const change of entryObj.changes) {
      if (!change || typeof change !== "object") continue;
      const changeObj = change as { field?: unknown; value?: unknown };
      if (changeObj.field !== "messages" || !changeObj.value || typeof changeObj.value !== "object") {
        continue;
      }
      const value = changeObj.value as { metadata?: RawItem; messages?: unknown; contacts?: unknown; statuses?: unknown };
      const metadata = value.metadata ?? {};
      const phoneNumberId = str(metadata.phone_number_id);
      if (!phoneNumberId) continue;

      changes.push({
        field: "messages",
        accountId: str(entryObj.id) ?? "",
        metadata: {
          phoneNumberId,
          displayPhoneNumber: str(metadata.display_phone_number),
        },
        messages: parseList(value.messages, parseMessage),
        contacts: parseList(value.contacts, (c): ParsedWhatsAppChange["contacts"][number] | null => {
          const waId = str(c.wa_id);
          if (!waId) return null;
          const profileName = str((c.profile as RawItem | undefined)?.name);
          return { waId, profile: profileName ? { name: profileName } : undefined };
        }),
        statuses: parseList(value.statuses, parseStatus),
      });
    }
  }

  return { object: "whatsapp_business_account", changes };
}

function parseList<T>(value: unknown, parser: (item: RawItem) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (v && typeof v === "object" ? parser(v as RawItem) : null))
    .filter((x): x is T => x !== null);
}