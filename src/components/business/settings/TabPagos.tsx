"use client";

import { PagosSection } from "@/components/business/PagosSection";

export function TabPagos({ businessId }: { businessId: string }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-stone-100 dark:border-[#2a2623] pb-4">
        <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
          Pagos y Facturación
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Configurá los cobros digitales automáticos mediante Mercado Pago (QR) y tus preferencias de cobro.
        </p>
      </div>

      <PagosSection businessId={businessId} />
    </div>
  );
}
