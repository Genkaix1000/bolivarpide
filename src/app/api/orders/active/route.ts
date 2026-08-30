import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveCustomerOrder } from "@/lib/orders/active";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ active: null });

  try {
    const active = await getActiveCustomerOrder(user.id);
    return NextResponse.json({ active });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo cargar el pedido" },
      { status: 500 },
    );
  }
}
