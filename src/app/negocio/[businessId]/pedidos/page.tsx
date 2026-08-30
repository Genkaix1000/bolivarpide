import { listKitchenOrders } from "@/lib/orders/kitchen";
import { ComanderaBoard } from "@/components/business/ComanderaBoard";

export default async function PedidosPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { tickets } = await listKitchenOrders(businessId);
  return <ComanderaBoard businessId={businessId} initialTickets={tickets} />;
}
