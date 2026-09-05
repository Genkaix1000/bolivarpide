import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  consumeMetaOAuthState,
  exchangeMetaCode,
  exchangeForLongLived,
  linkWhatsAppViaOAuth,
} from "@/lib/whatsapp/oauth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/meta/oauth/callback
 *
 * Meta redirige acá tras el consentimiento (o la cancelación). Convierte el
 * code en un token long-lived, lo guarda en Vault, auto-detecta el número y
 * deja la conexión activa. Redirige de vuelta a Canales con ?whatsapp=...
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const code = sp.get("code") ?? "";
  const state = sp.get("state") ?? "";
  const denied = sp.get("error");
  const deniedReason = sp.get("error_description");

  const row = await consumeMetaOAuthState(state);
  const redirectUrl = row?.redirect_url || "/";

  const backTo = (result: string, why?: string) => {
    const target = new URL(redirectUrl, req.nextUrl.origin);
    target.searchParams.set("whatsapp", result);
    if (why) target.searchParams.set("why", why);
    return NextResponse.redirect(target.toString());
  };

  if (!row) return backTo("error", "El enlace de Meta expiró o es inválido. Volvé a intentarlo.");
  if (denied) return backTo("error", deniedReason || "No autorizaste la conexión con WhatsApp.");

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && user.id !== row.user_id) {
      return backTo("error", "La sesión no coincide con la que inició el vínculo.");
    }

    const short = await exchangeMetaCode(code);
    const long = await exchangeForLongLived(short.accessToken);

    await linkWhatsAppViaOAuth({
      businessId: row.business_id,
      token: long.accessToken,
      expiresIn: long.expiresIn,
    });

    revalidatePath(`/negocio/${row.business_id}/configuracion`, "layout");
    revalidatePath(`/negocio/${row.business_id}/whatsapp`, "layout");

    return backTo("connected");
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo conectar WhatsApp.";
    return backTo("error", message);
  }
}