import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckout } from "@/lib/mercadopago/checkout";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tenés que iniciar sesión para pedir" }, { status: 401 });
  }

  let body: {
    businessSlug?: string;
    lines?: { name: string; quantity: number; unitPriceCents: number; productId?: string; note?: string }[];
    paymentMethod?: "mercadopago_qr" | "cash";
    couponCode?: string;
    idempotencyKey?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.businessSlug?.trim() || !body.lines?.length || !body.paymentMethod) {
    return NextResponse.json({ error: "Datos de checkout incompletos" }, { status: 400 });
  }

  try {
    const result = await createCheckout({
      businessSlug: body.businessSlug.trim(),
      userId: user.id,
      lines: body.lines,
      paymentMethod: body.paymentMethod,
      couponCode: body.couponCode,
      idempotencyKey: body.idempotencyKey,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo crear el pedido" },
      { status: 400 },
    );
  }
}
