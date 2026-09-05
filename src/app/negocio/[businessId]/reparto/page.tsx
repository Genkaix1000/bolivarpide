import { requireBusinessAccess } from "@/lib/business/queries";
import { listDispatchQueue } from "@/lib/delivery/queries";
import { isDeliveryManager } from "@/lib/delivery/rules";
import { DispatchView } from "@/components/delivery/DispatchView";

export default async function RepartoPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { member, isAdmin } = await requireBusinessAccess(businessId);
  const role = isAdmin ? "owner" : (member?.role ?? "staff");

  if (!isDeliveryManager(role)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Reparto</h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Tu consola de reparto
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-12 text-center text-sm text-stone-500 dark:border-stone-600">
          La consola del repartidor se habilita en la próxima entrega. Mientras
          tanto, tu negocio puede asignarte pedidos desde Reparto.
        </div>
      </div>
    );
  }

  const queue = await listDispatchQueue(businessId);
  return <DispatchView businessId={businessId} initial={queue} />;
}