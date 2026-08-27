import { listOrders } from "@/lib/business/queries";
import { OrdersBoard } from "@/components/business/OrdersBoard";

export default async function PedidosPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const orders = await listOrders(businessId);
  return <OrdersBoard businessId={businessId} initialOrders={orders as never} />;
}
