"use client";

import { useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export function PinConfirmInput({
  onClose,
  onConfirm,
  pending,
}: {
  onClose: () => void;
  onConfirm: (pin: string) => void;
  pending: boolean;
}) {
  const [pin, setPin] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl dark:bg-[#231f1c]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">Confirmar entrega</h3>
          <button type="button" onClick={onClose} className="cursor-pointer text-stone-400">
            <MaterialSymbol icon="close" size={20} />
          </button>
        </div>
        <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
          Pedile el PIN de 4 dígitos al cliente.
        </p>
        <input
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="mb-4 w-full rounded-xl border border-stone-300 px-4 py-3 text-center text-2xl font-black tracking-[0.4em] dark:border-stone-600 dark:bg-[#1c1917]"
          autoFocus
        />
        <button
          type="button"
          disabled={pin.length !== 4 || pending}
          onClick={() => onConfirm(pin)}
          className="w-full rounded-xl bg-[#9a0002] py-3 font-bold text-white disabled:opacity-50 cursor-pointer"
        >
          Confirmar entregado
        </button>
      </div>
    </div>
  );
}
