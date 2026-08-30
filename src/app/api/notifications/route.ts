import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listNotifications } from "@/lib/notifications/repository";
import type { NotificationCategory } from "@/lib/notifications/types";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  const category = req.nextUrl.searchParams.get("category") as NotificationCategory | null;

  try {
    const items = await listNotifications({
      userId: user.id,
      businessId: businessId || null,
      category: category || null,
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudieron cargar las notificaciones" },
      { status: 500 },
    );
  }
}
