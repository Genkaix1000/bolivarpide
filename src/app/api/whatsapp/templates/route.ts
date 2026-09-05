import { NextRequest, NextResponse } from "next/server";
import { requireBusinessMember } from "@/lib/business/require-member-api";
import { getActiveWhatsAppConnection } from "@/lib/whatsapp/connection";
import { listApprovedTemplates, readConnectionToken } from "@/lib/whatsapp/oauth";

/**
 * GET /api/whatsapp/templates?businessId=...
 *
 * Templates aprobadas en la WABA del negocio, para elegirlas en Canales en
 * vez de tipear el nombre a ciegas.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId")?.trim();
  if (!businessId) {
    return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
  }

  const auth = await requireBusinessMember(businessId);
  if ("error" in auth && auth.error) return auth.error;

  const conn = await getActiveWhatsAppConnection(businessId);
  if (!conn?.waba_id) {
    return NextResponse.json(
      { templates: [], error: "WhatsApp no está conectado" },
      { status: 200 },
    );
  }

  const token = await readConnectionToken({
    vault_token_ref: conn.vault_token_ref,
    token_expires_at: conn.token_expires_at,
  });
  if (!token) {
    return NextResponse.json(
      { templates: [], error: "Token de WhatsApp vencido o no disponible" },
      { status: 200 },
    );
  }

  try {
    const templates = await listApprovedTemplates(conn.waba_id, token);
    return NextResponse.json({ templates });
  } catch (e) {
    // No es un error de la app: puede ser permisos de la WABA. La UI cae al
    // input manual en vez de bloquear la configuración.
    return NextResponse.json(
      {
        templates: [],
        error: e instanceof Error ? e.message : "No se pudieron leer las templates",
      },
      { status: 200 },
    );
  }
}
