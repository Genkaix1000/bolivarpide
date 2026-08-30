"use client";

import { useEffect, useRef } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type Props = {
  confirm: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  askIcon?: string;
  askLabel?: string;
  className?: string;
};

const slide =
  "absolute inset-0 flex items-center justify-end gap-1 transition-all duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]";

/** Confirmación inline (✕ / ✓) para acciones destructivas en cards. */
export function ConfirmActionRail({
  confirm,
  onAsk,
  onCancel,
  onConfirm,
  askIcon = "delete",
  askLabel = "Eliminar",
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirm) return;
    focusRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, onCancel]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative h-8 shrink-0 overflow-hidden transition-[width] duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        confirm ? "w-[72px]" : "w-8",
        className,
      )}
    >
      <button
        type="button"
        title={askLabel}
        aria-label={askLabel}
        aria-expanded={confirm}
        onClick={onAsk}
        className={cn(
          slide,
          "cursor-pointer text-gray-400 hover:text-red-600 dark:hover:text-red-400",
          confirm ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100",
        )}
      >
        <MaterialSymbol icon={askIcon} size={18} />
      </button>

      <div
        className={cn(
          slide,
          confirm ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none",
        )}
      >
        <button
          ref={focusRef}
          type="button"
          aria-label="Cancelar"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-white/90 hover:bg-white/15"
        >
          <MaterialSymbol icon="close" size={14} />
        </button>
        <button
          type="button"
          aria-label="Confirmar"
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-white text-red-700 hover:bg-white/90 active:scale-95 transition-all"
        >
          <MaterialSymbol icon="check" size={14} />
        </button>
      </div>
    </div>
  );
}
