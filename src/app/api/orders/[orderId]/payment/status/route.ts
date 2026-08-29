import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPaymentStatus } from "@/lib/mercadopago/checkout";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const data = await getPaymentStatus(orderId, user.id);
  if (!data) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json(data);
}
