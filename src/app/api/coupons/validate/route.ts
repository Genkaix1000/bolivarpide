import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCouponPublic } from "@/lib/mercadopago/checkout";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Iniciá sesión para usar cupones" }, { status: 401 });

  let body: { businessSlug?: string; code?: string; subtotalCents?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const slug = body.businessSlug?.trim();
  const code = body.code?.trim();
  const subtotalCents = body.subtotalCents;
  if (!slug || !code || typeof subtotalCents !== "number") {
    return NextResponse.json({ error: "businessSlug, code y subtotalCents requeridos" }, { status: 400 });
  }

  try {
    return NextResponse.json(await validateCouponPublic(slug, code, subtotalCents));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cupón inválido" },
      { status: 400 },
    );
  }
}
