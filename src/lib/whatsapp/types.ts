/**
 * WhatsApp (Meta Cloud API) webhook + chat types (pure, no I/O).
 */

/** Tipos que se descargan del endpoint de media de Meta (tienen `id`). */
export type WhatsAppMediaKind =
  | "image"
  | "audio"
  | "video"
  | "sticker"
  | "document";

/**
 * `location` y `contacts` NO son media: su payload es estructurado
 * (lat/long, o un array de tarjetas de contacto). Estaban dentro de
 * `WhatsAppMediaKind`, así que el parser les buscaba `id`/`mime_type`, no
 * encontraba nada y el mensaje llegaba al chat como una burbuja vacía.
 */
export type WhatsAppMessageType =
  | "text"
  | "location"
  | "contacts"
  | "unsupported"
  | WhatsAppMediaKind;

export type ParsedWhatsAppLocation = {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
};

export type ParsedWhatsAppContactCard = {
  name: string;
  phones: string[];
};

export type ParsedWhatsAppText = {
  body: string;
};

export type ParsedWhatsAppMedia = {
  id?: string;
  mimeType?: string;
  sha256?: string;
  caption?: string;
  fileName?: string;
  url?: string;
  /** audio/video duration in ms */
  durationMs?: number;
  /** image size in bytes (meta reports width/height; size lives in media download) */
  bytes?: number;
};

export type ParsedWhatsAppContactProfile = {
  name?: string;
};

export type ParsedWhatsAppMessage = {
  /** Meta message id, e.g. wamid.HBg... */
  waMessageId: string;
  /** Sender wa_id (E.164 without +), e.g. 5492314443322 */
  from: string;
  timestamp: number;
  type: WhatsAppMessageType;
  text?: ParsedWhatsAppText;
  media?: ParsedWhatsAppMedia;
  location?: ParsedWhatsAppLocation;
  contacts?: ParsedWhatsAppContactCard[];
  context?: { from?: string; id?: string };
};

export type ParsedWhatsAppContact = {
  waId: string;
  profile?: ParsedWhatsAppContactProfile;
};

export type ParsedWhatsAppStatus = {
  /** The outbound message id being reported */
  waMessageId: string;
  status: "sent" | "delivered" | "read" | "failed" | "rejected";
  timestamp: number;
  recipientId?: string;
  errors?: Array<{ code: number; title?: string; message?: string; error_data?: { details?: string } }>;
};

export type ParsedWhatsAppChange = {
  field: "messages";
  /** WABA id */
  accountId: string;
  metadata: {
    phoneNumberId: string;
    displayPhoneNumber?: string;
  };
  messages: ParsedWhatsAppMessage[];
  contacts: ParsedWhatsAppContact[];
  statuses: ParsedWhatsAppStatus[];
};

export type ParsedWhatsAppWebhook = {
  object: "whatsapp_business_account";
  changes: ParsedWhatsAppChange[];
};