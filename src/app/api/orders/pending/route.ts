import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPendingCustomerOrder } from "@/lib/orders/pending";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ pending: null });

  try {
    const pending = await getPendingCustomerOrder(user.id);
    return NextResponse.json({ pending });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo cargar el pedido" },
      { status: 500 },
    );
  }
}
