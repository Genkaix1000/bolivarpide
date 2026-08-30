import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrderTracking } from "@/lib/orders/queries";
import { OrderTrackingClient } from "./page.client";

export default async function PedidoTrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/?login=1&next=/pedido/${orderId}`);

  const tracking = await getOrderTracking(orderId);
  if (!tracking) notFound();

  return <OrderTrackingClient orderId={orderId} initial={tracking} />;
}
