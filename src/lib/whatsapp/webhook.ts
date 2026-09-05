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

/**
 * Meta serializa los numéricos del webhook como STRING (`"timestamp": "1757030400"`,
 * `"code": "131047"`), así que acá se acepta string y number.
 */
function num(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string" && v.trim() !== "") {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/** Epoch en segundos anterior a 2001-09-09: no puede venir de Meta. */
const MIN_EPOCH_S = 1_000_000_000;
/** Por encima de esto el valor está en milisegundos, no en segundos. */
const MS_THRESHOLD = 100_000_000_000;

/**
 * Normaliza el `timestamp` de Meta (epoch en segundos, como string) a número.
 *
 * Un valor ausente o implausible cae en "ahora" y NO en 0: con epoch 0 el
 * mensaje se persistía con `created_at` de 1970 y la ventana de 24 h quedaba
 * vencida para siempre, lo que dejaba al negocio sin poder responder.
 */
function epochSeconds(v: unknown, nowMs: number): number {
  const fallback = Math.floor(nowMs / 1000);
  const raw = num(v);
  if (raw === undefined) return fallback;
  const seconds = Math.floor(raw >= MS_THRESHOLD ? raw / 1000 : raw);
  return seconds >= MIN_EPOCH_S ? seconds : fallback;
}

function parseMessage(raw: RawItem, nowMs: number): ParsedWhatsAppMessage | null {
  const id = str(raw.id);
  const from = str(raw.from);
  if (!id || !from) return null;

  const rawType = str(raw.type) ?? "unknown";
  const type: WhatsAppMessageType =
    rawType === "text" ? "text" : MEDIA_TYPES.has(rawType) ? (rawType as WhatsAppMediaKind) : "unsupported";

  const out: ParsedWhatsAppMessage = {
    waMessageId: id,
    from,
    timestamp: epochSeconds(raw.timestamp, nowMs),
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

function parseStatus(raw: RawItem, nowMs: number): ParsedWhatsAppStatus | null {
  const id = str(raw.id);
  const status = str(raw.status);
  if (!id || !status) return null;
  const errList = Array.isArray(raw.errors) ? (raw.errors as RawItem[]) : undefined;
  return {
    waMessageId: id,
    status: status as ParsedWhatsAppStatus["status"],
    timestamp: epochSeconds(raw.timestamp, nowMs),
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

export function parseMetaWebhook(
  body: unknown,
  nowMs: number = Date.now(),
): ParsedWhatsAppWebhook | null {
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
        messages: parseList(value.messages, (m) => parseMessage(m, nowMs)),
        contacts: parseList(value.contacts, (c): ParsedWhatsAppChange["contacts"][number] | null => {
          const waId = str(c.wa_id);
          if (!waId) return null;
          const profileName = str((c.profile as RawItem | undefined)?.name);
          return { waId, profile: profileName ? { name: profileName } : undefined };
        }),
        statuses: parseList(value.statuses, (s) => parseStatus(s, nowMs)),
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