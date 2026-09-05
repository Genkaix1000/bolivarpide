/**
 * Primitivos de envío a WhatsApp (sin authz, sin cache de Next).
 *
 * Van separados de `actions.ts` a propósito: la notificación de estado de un
 * pedido la dispara el sistema, no un usuario. Cuando reusaba el server
 * action, arrastraba `requireBusinessAccess` (que hace `redirect()` y depende
 * de las cookies del request) y `revalidatePath`, dos cosas que no tienen
 * sentido —y que rompen— fuera del ciclo de vida de un request.
 *
 * Quien llame desde una action es responsable de la autorización.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { graphFetch, MetaGraphError } from "@/lib/whatsapp/graph";

export type SendOutcome =
  | { ok: true; waMessageId: string }
  | { ok: false; error: string; code: number | null };

type SendInput = {
  businessId: string;
  phoneNumberId: string;
  token: string;
  chatId: string;
  /** Cuerpo del mensaje de Meta (`type` + su payload). */
  message: Record<string, unknown>;
  /** Qué se guarda como texto del mensaje en el chat del panel. */
  transcript: string;
};

async function persistOutbound(input: {
  businessId: string;
  chatId: string;
  text: string;
  waMessageId: string | null;
  status: "sent" | "failed";
  errorCode?: number | null;
  errorTitle?: string | null;
  errorDetails?: string | null;
}): Promise<void> {
  const svc = createServiceClient();
  const { error } = await svc.from("whatsapp_messages").insert({
    business_id: input.businessId,
    chat_id: input.chatId,
    direction: "outbound",
    type: "text",
    text_body: input.text,
    wa_message_id: input.waMessageId,
    status: input.status,
    customer_name: null,
    error_code: input.errorCode ?? null,
    error_title: input.errorTitle ?? null,
    error_details: input.errorDetails ?? null,
  });
  if (error) {
    console.error("whatsapp/send: no se pudo persistir el outbound", error);
  }
}

/**
 * Envía un mensaje y deja la fila en `whatsapp_messages`.
 *
 * Un fallo también se persiste (`status = 'failed'` + el código de Meta): sin
 * eso el mensaje desaparecía del chat y el negocio no tenía forma de saber
 * que no había llegado.
 */
export async function sendWhatsAppMessage(input: SendInput): Promise<SendOutcome> {
  try {
    const json = await graphFetch<{ messages?: Array<{ id: string }> }>({
      path: `${input.phoneNumberId}/messages`,
      token: input.token,
      method: "POST",
      body: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: input.chatId,
        ...input.message,
      },
    });

    const waMessageId = json.messages?.[0]?.id;
    if (!waMessageId) {
      await persistOutbound({
        businessId: input.businessId,
        chatId: input.chatId,
        text: input.transcript,
        waMessageId: null,
        status: "failed",
        errorTitle: "Meta no devolvió el id del mensaje",
      });
      return { ok: false, error: "Meta no devolvió el id del mensaje", code: null };
    }

    await persistOutbound({
      businessId: input.businessId,
      chatId: input.chatId,
      text: input.transcript,
      waMessageId,
      status: "sent",
    });
    return { ok: true, waMessageId };
  } catch (err) {
    const graphError = err instanceof MetaGraphError ? err : null;
    const message = graphError?.message
      ?? (err instanceof Error ? err.message : "No se pudo enviar el mensaje");

    await persistOutbound({
      businessId: input.businessId,
      chatId: input.chatId,
      text: input.transcript,
      waMessageId: null,
      status: "failed",
      errorCode: graphError?.code ?? null,
      errorTitle: message,
      errorDetails: graphError?.details ?? null,
    });

    return { ok: false, error: message, code: graphError?.code ?? null };
  }
}

/** Texto libre. Solo válido dentro de la ventana de 24 h (Meta lo exige). */
export function sendWhatsAppTextMessage(input: {
  businessId: string;
  phoneNumberId: string;
  token: string;
  chatId: string;
  body: string;
}): Promise<SendOutcome> {
  return sendWhatsAppMessage({
    businessId: input.businessId,
    phoneNumberId: input.phoneNumberId,
    token: input.token,
    chatId: input.chatId,
    message: { type: "text", text: { preview_url: false, body: input.body } },
    transcript: input.body,
  });
}

/** Template aprobada. Es la única vía fuera de la ventana de 24 h. */
export function sendWhatsAppTemplateMessage(input: {
  businessId: string;
  phoneNumberId: string;
  token: string;
  chatId: string;
  templateName: string;
  language: string;
  /** Parámetros del componente `body`, en orden. */
  bodyParams: string[];
  transcript: string;
}): Promise<SendOutcome> {
  return sendWhatsAppMessage({
    businessId: input.businessId,
    phoneNumberId: input.phoneNumberId,
    token: input.token,
    chatId: input.chatId,
    message: {
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.language },
        components: [
          {
            type: "body",
            parameters: input.bodyParams.map((text) => ({ type: "text", text })),
          },
        ],
      },
    },
    transcript: input.transcript,
  });
}
