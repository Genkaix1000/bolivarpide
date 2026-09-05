import { requireBusinessAccess } from "@/lib/business/queries";
import { getWhatsAppConnection } from "@/lib/business/whatsappQueries";
import { WhatsAppConnectionCard } from "@/components/business/WhatsAppConnectionCard";
import { ShellPageHeader } from "@/components/shell/ShellPageHeader";

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
      <ShellPageHeader
        title="Canales & WhatsApp"
        description="Sincronizá el número de WhatsApp de tu local para despachos automáticos y notificaciones a clientes."
        as="h2"
      />

      <WhatsAppConnectionCard
        businessId={businessId}
        connection={connection}
        initial={initial}
      />
    </div>
  );
}
