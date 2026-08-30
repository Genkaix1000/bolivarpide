"use client";

import { useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";

const PRESETS = ["Sin stock", "Local cerrado", "Zona no cubierta"];

export function RejectOrderModal({
  onClose,
  onConfirm,
  pending,
}: {
  onClose: () => void;
  onConfirm: (reason: string) => void;
  pending: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-[#231f1c]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-red-700">Rechazar pedido</h3>
          <button type="button" onClick={onClose} className="cursor-pointer text-stone-400">
            <MaterialSymbol icon="close" size={20} />
          </button>
        </div>
        <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
          El motivo es obligatorio. Si pagó con Mercado Pago se reembolsa automáticamente.
        </p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setReason(p)}
              className="rounded-full border border-stone-300 px-2.5 py-1 text-xs cursor-pointer hover:border-[#9a0002]"
            >
              {p}
            </button>
          ))}
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Motivo del rechazo (mín. 10 caracteres)"
          className="mb-4 w-full rounded-xl border border-stone-300 p-3 text-sm dark:border-stone-600 dark:bg-[#1c1917]"
        />
        <button
          type="button"
          disabled={reason.trim().length < 10 || pending}
          onClick={() => onConfirm(reason.trim())}
          className="w-full rounded-xl bg-red-600 py-3 font-bold text-white disabled:opacity-50 cursor-pointer"
        >
          Rechazar y reembolsar si aplica
        </button>
      </div>
    </div>
  );
}
