"use client";

import { useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { deleteBusinessAction } from "@/lib/business/actions";

export function DangerZone({
  businessId,
  businessName,
  isOwner,
}: {
  businessId: string;
  businessName: string;
  isOwner: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOwner) return null;

  async function handleDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDeleting(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      await deleteBusinessAction(fd);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al dar de baja el comercio");
      setDeleting(false);
    }
  }

  return (
    <section className="mt-8 bg-red-50/60 dark:bg-red-950/20 rounded-[20px] p-6 sm:p-7 border border-red-200 dark:border-red-900/40 penpot-shadow space-y-4">
      <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
        <MaterialSymbol icon="warning" size={24} />
        <div>
          <h3 className="text-base font-black">Zona de Peligro: Dar de baja el comercio</h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            Acción reservada exclusivamente para el <strong>Titular</strong>.
          </p>
        </div>
      </div>

      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
        Al eliminar tu comercio, se borrarán de manera permanente el catálogo de productos, el historial de pedidos y la vinculación de todo el equipo. Esta acción no se puede deshacer.
      </p>

      {error && (
        <div className="p-3 rounded-xl bg-red-100 text-red-700 text-xs font-bold">
          {error}
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="cursor-pointer px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
        >
          Dar de baja este comercio
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1c1917] rounded-[24px] max-w-md w-full p-6 space-y-5 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <MaterialSymbol icon="delete_forever" size={28} />
              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">
                ¿Confirmás la baja definitiva?
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Para confirmar, escribí el nombre exacto del comercio:{" "}
              <strong className="text-stone-900 dark:text-stone-100 select-all">{businessName}</strong>
            </p>

            <form onSubmit={handleDelete} className="space-y-4">
              <input type="hidden" name="businessId" value={businessId} />
              <input type="hidden" name="confirmation" value={confirmText} />

              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Escribí el nombre del comercio..."
                className="w-full px-3.5 py-2 rounded-xl border border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-full border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleting || confirmText.trim().toLowerCase() !== businessName.trim().toLowerCase()}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {deleting ? "Eliminando..." : "Sí, eliminar comercio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
