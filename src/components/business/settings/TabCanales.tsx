"use client";

import { WhatsAppConnectionCard } from "@/components/business/WhatsAppConnectionCard";
import type { WhatsAppConnection } from "@/lib/business/whatsappQueries";

export function TabCanales({
  businessId,
  connection,
}: {
  businessId: string;
  connection: WhatsAppConnection | null;
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-stone-100 dark:border-[#2a2623] pb-4">
        <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
          Canales & WhatsApp
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Sincronizá el número de WhatsApp de tu local para despachos automáticos y notificaciones a clientes.
        </p>
      </div>

      <WhatsAppConnectionCard businessId={businessId} connection={connection} />
    </div>
  );
}
