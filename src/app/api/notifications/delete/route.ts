import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteNotifications } from "@/lib/notifications/repository";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let body: { id?: string; all?: boolean; businessId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.id && !body.all) {
    return NextResponse.json({ error: "Indicá id o all" }, { status: 400 });
  }

  try {
    await deleteNotifications({
      userId: user.id,
      id: body.id,
      all: body.all,
      businessId: body.businessId ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo borrar" },
      { status: 500 },
    );
  }
}
