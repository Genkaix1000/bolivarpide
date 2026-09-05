import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatDetail } from "@/lib/business/chatQueries";

/**
 * Detalle de un chat: una página de mensajes (los más nuevos) + pedidos.
 * `before` (created_at ISO) pagina hacia atrás.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  const chatId = req.nextUrl.searchParams.get("chatId");
  const before = req.nextUrl.searchParams.get("before") ?? undefined;

  if (!businessId || !chatId) {
    return NextResponse.json(
      { error: "businessId y chatId requeridos" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const page = await getChatDetail(businessId, chatId, before);
    return NextResponse.json(page ?? { conversation: null, nextCursor: null });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 403 },
    );
  }
}
