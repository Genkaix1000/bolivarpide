import { NextRequest, NextResponse } from "next/server";
import { requireBusinessMember } from "@/lib/business/require-member-api";
import { createMetaLoginUrl } from "@/lib/whatsapp/oauth";

/**
 * GET /api/meta/oauth/start?businessId=...
 *
 * Arranca el Business Login de Meta para que el comercio enlace su número
 * WhatsApp. Requiere sesión + ser miembro del negocio.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId")?.trim();
  if (!businessId) {
    return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
  }

  const auth = await requireBusinessMember(businessId);
  if ("error" in auth && auth.error) return auth.error;

  const origin = req.headers.get("origin") ?? req.nextUrl.origin;
  const redirectUrl = `${origin}/negocio/${businessId}/configuracion/canales`;

  try {
    const url = await createMetaLoginUrl({
      businessId,
      userId: auth.user.id,
      redirectUrl,
    });
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo iniciar el vínculo con Meta";
    const back = new URL(redirectUrl);
    back.searchParams.set("whatsapp", "error");
    back.searchParams.set("why", message);
    return NextResponse.redirect(back.toString());
  }
}