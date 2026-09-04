"use client";

import { useEffect, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type LinkableOrder = {
  id: string;
  orderNumber: number;
  statusLabel: string;
  totalCents: number;
  customerName: string | null;
  createdAt: string;
};

interface LinkOrderModalProps {
  businessId: string;
  businessName: string;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

export function LinkOrderModal({ businessId, businessName, onClose, onConfirm }: LinkOrderModalProps) {
  const [orders, setOrders] = useState<LinkableOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/whatsapp/linkable-orders?businessId=${encodeURIComponent(businessId)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((j: { orders?: LinkableOrder[] }) => setOrders(j.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[#fdfcfb] shadow-2xl dark:bg-[#181513]">
        <header className="flex shrink-0 items-center justify-between border-b border-[#e8e0d6] px-4 py-3 dark:border-[#2a2623]">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Vincular pedido
            </p>
            <p className="text-[11px] text-gray-500">
              Pedidos en curso de {businessName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-black/5"
            aria-label="Cerrar"
          >
            <MaterialSymbol icon="close" size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Cargando…</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                No hay pedidos para vincular
              </p>
              <p className="mt-1 text-[12px] text-gray-500">
                Solo aparecen pedidos en curso (nuevos, en cocina, en camino) sin chat asignado.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onConfirm(o.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#eee7de] px-3 py-2.5 text-left transition-colors hover:border-[#9a0002]/40 dark:border-[#2a2623]"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                      #{o.orderNumber}
                      <span className="ml-2 text-[11px] font-semibold text-[#9a0002] dark:text-red-400">
                        {o.statusLabel}
                      </span>
                    </p>
                    <p className="truncate text-[11px] text-gray-500">
                      {o.customerName ?? "Cliente sin nombre"} · {o.createdAt}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[12px] font-bold">{formatCents(o.totalCents)}</span>
                    <MaterialSymbol icon="chevron_right" size={18} className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 border-t border-[#e8e0d6] px-4 py-3 dark:border-[#2a2623]">
          <button
            type="button"
            onClick={onClose}
            className={cn("ml-auto rounded-full border border-[#e0d7cb] px-4 py-2 text-[12px] font-bold text-gray-700 hover:bg-black/5")}
          >
            Cancelar
          </button>
        </footer>
      </div>
    </div>
  );
}