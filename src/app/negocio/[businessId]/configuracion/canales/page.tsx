import { requireBusinessAccess } from "@/lib/business/queries";
import { getWhatsAppConnection } from "@/lib/business/whatsappQueries";
import { WhatsAppConnectionCard } from "@/components/business/WhatsAppConnectionCard";

export default async function ConfiguracionCanalesPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ whatsapp?: string; why?: string }>;
}) {
  const { businessId } = await params;
  const sp = await searchParams;
  await requireBusinessAccess(businessId);
  const connection = await getWhatsAppConnection(businessId);

  const initial =
    sp.whatsapp === "connected"
      ? { ok: true, text: "WhatsApp conectado. Ya recibís y respondés mensajes desde el panel." }
      : sp.whatsapp === "error"
        ? { ok: false, text: sp.why || "No se pudo conectar WhatsApp." }
        : null;

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

      <WhatsAppConnectionCard
        businessId={businessId}
        connection={connection}
        initial={initial}
      />
    </div>
  );
}
