import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrderTracking } from "@/lib/orders/queries";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const tracking = await getOrderTracking(orderId);
  if (!tracking) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(tracking);
}
