/**
 * WhatsApp (Meta Cloud API) webhook + chat types (pure, no I/O).
 */

export type WhatsAppMediaKind =
  | "image"
  | "audio"
  | "video"
  | "sticker"
  | "document"
  | "location"
  | "contacts";

export type WhatsAppMessageType = "text" | "unsupported" | WhatsAppMediaKind;

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