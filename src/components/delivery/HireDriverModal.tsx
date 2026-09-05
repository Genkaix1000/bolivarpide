"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { flashToast } from "@/components/FlashToast";
import { hireApprovedDriverAction } from "@/lib/delivery/actions";
import type { HirableDriver } from "@/lib/delivery/types";

export function HireDriverModal({
  businessId,
  open,
  onClose,
  onHired,
}: {
  businessId: string;
  open: boolean;
  onClose: () => void;
  onHired: () => void;
}) {
  const [drivers, setDrivers] = useState<HirableDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let alive = true;
    queueMicrotask(() => setLoading(true));
    fetch(`/api/orders/hirable?businessId=${encodeURIComponent(businessId)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : Promise.resolve([])))
      .then((list) => {
        if (alive) setDrivers((list as HirableDriver[]) ?? []);
      })
      .catch(() => {
        if (alive) setDrivers([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [businessId, open]);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => setDrivers([]));
    }
  }, [open]);

  function hire(userId: string, driverName: string) {
    startTransition(async () => {
      const res = await hireApprovedDriverAction({ businessId, userId });
      if (!res.ok) flashToast(res.error);
      else {
        flashToast(`Invitado: ${res.driverName ?? driverName}`);
        setDrivers((prev) => prev.filter((d) => d.userId !== userId));
        onHired();
      }
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border border-[#e8e0d6] bg-white shadow-2xl dark:border-[#3d3732] dark:bg-[#1c1917]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#f0ebe4] bg-white/95 px-4 py-3 backdrop-blur-md dark:border-[#2a2623] dark:bg-[#1c1917]/95">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#9a0002]/10 text-[#9a0002] dark:text-red-400 flex items-center justify-center">
                  <MaterialSymbol icon="moped" size={18} fill />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-gray-900 dark:text-gray-100 leading-tight">
                    Contratar repartidor
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                    Repartidores aprobados por BolivarPide
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-gray-400 hover:bg-[#f5f1eb] hover:text-gray-600 dark:hover:bg-[#2a2623] cursor-pointer transition-colors"
              >
                <MaterialSymbol icon="close" size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {loading ? (
                <p className="py-8 text-center text-sm text-stone-500">Buscando repartidores…</p>
              ) : drivers.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 dark:border-stone-600">
                  No hay repartidores aprobados disponibles. Cuando un repartidor
                  complete su postulación y sea aprobado, aparece acá.
                </p>
              ) : (
                <ul className="space-y-2">
                  {drivers.map((d) => (
                    <li
                      key={d.userId}
                      className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-[#3d3732] dark:bg-[#231f1c]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9a0002]/10 text-xs font-bold text-[#9a0002]">
                        {d.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">
                          {d.displayName}
                        </p>
                        <p className="text-[11px] font-medium text-stone-500">{d.vehicleLabel}</p>
                      </div>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => hire(d.userId, d.displayName)}
                        className="shrink-0 cursor-pointer rounded-xl bg-[#9a0002] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#850002] disabled:opacity-50"
                      >
                        Invitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 rounded-xl bg-stone-100 px-3 py-2 text-[11px] text-stone-500 dark:bg-[#2a2623]">
                Le llega una invitación al repartidor. La acepta desde{" "}
                <span className="font-semibold">Mis locales</span> y recién ahí puede
                recibir pedidos.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}