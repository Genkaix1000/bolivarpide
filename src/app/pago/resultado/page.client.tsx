"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export default function PagoResultadoPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status");
  const [paid, setPaid] = useState<boolean | null>(null);

  const poll = useCallback(async () => {
    if (!orderId) return;
    const res = await fetch(`/api/orders/${orderId}/payment/status`);
    if (!res.ok) return;
    const j = await res.json();
    if (j.order?.payment_status === "paid") setPaid(true);
    else if (status === "failure") setPaid(false);
    else setPaid((p) => (p === true ? true : null));
  }, [orderId, status]);

  useEffect(() => {
    queueMicrotask(() => void poll());
    const id = setInterval(() => void poll(), 3000);
    return () => clearInterval(id);
  }, [poll]);

  if (!orderId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-sm text-gray-500">Pedido no encontrado.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#faf6f1] dark:bg-[#1c1917]">
      <div className="max-w-sm w-full rounded-3xl bg-white dark:bg-[#231f1c] border border-[#e8e0d6] dark:border-[#3d3732] p-8 text-center space-y-4 shadow-lg">
        {paid === true ? (
          <>
            <MaterialSymbol icon="celebration" size={48} className="text-[#9a0002] mx-auto" />
            <h1 className="text-lg font-black text-gray-900 dark:text-white">¡Pago confirmado!</h1>
            <p className="text-sm text-gray-500">Tu pedido fue recibido.</p>
          </>
        ) : paid === false || status === "failure" ? (
          <>
            <MaterialSymbol icon="error_outline" size={48} className="text-amber-600 mx-auto" />
            <h1 className="text-lg font-black text-gray-900 dark:text-white">Pago no completado</h1>
            <p className="text-sm text-gray-500">Podés volver al local e intentar de nuevo.</p>
          </>
        ) : (
          <>
            <MaterialSymbol icon="progress_activity" size={48} className="animate-spin text-gray-400 mx-auto" />
            <h1 className="text-lg font-black text-gray-900 dark:text-white">Confirmando pago…</h1>
            <p className="text-sm text-gray-500">Esto puede tardar unos segundos.</p>
          </>
        )}
        <Link href="/" className="inline-block text-sm font-bold text-[#9a0002] underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
