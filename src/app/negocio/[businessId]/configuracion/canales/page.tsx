import { requireBusinessAccess } from "@/lib/business/queries";
import { getWhatsAppConnection } from "@/lib/business/whatsappQueries";
import { WhatsAppConnectionCard } from "@/components/business/WhatsAppConnectionCard";

export default async function ConfiguracionCanalesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  await requireBusinessAccess(businessId);
  const connection = await getWhatsAppConnection(businessId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
          Canales & WhatsApp
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Sincronizá el número de WhatsApp de tu local para despachos automáticos y notificaciones a clientes.
        </p>
      </div>

      <WhatsAppConnectionCard businessId={businessId} connection={connection} />
    </div>
  );
}
