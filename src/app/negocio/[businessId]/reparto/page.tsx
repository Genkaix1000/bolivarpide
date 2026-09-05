import { requireBusinessAccess } from "@/lib/business/queries";
import { listDispatchQueue, listDriverDeliveries } from "@/lib/delivery/queries";
import { isDeliveryManager } from "@/lib/delivery/rules";
import { DispatchView } from "@/components/delivery/DispatchView";
import { DriverBoard } from "@/components/delivery/DriverBoard";

export default async function RepartoPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { user, member, isAdmin } = await requireBusinessAccess(businessId);
  const role = isAdmin ? "owner" : (member?.role ?? "staff");

  if (!isDeliveryManager(role)) {
    const board = await listDriverDeliveries(businessId, user.id);
    return <DriverBoard businessId={businessId} initial={board} />;
  }

  const queue = await listDispatchQueue(businessId);
  return <DispatchView businessId={businessId} initial={queue} />;
}