"use client";

import { useEffect, useRef, type RefObject } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

export type ConfirmActionRailProps = {
  confirm: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onAccent?: boolean;
  boundaryRef?: RefObject<HTMLElement | null>;
  askIcon?: string;
  askLabel?: string;
  askTitle?: string;
  className?: string;
};

const slide =
  "absolute inset-0 flex items-center justify-end gap-1 transition-all duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]";

/** Confirmación inline (✕ / ✓) para acciones destructivas o de cierre de sesión. */
export function ConfirmActionRail({
  confirm,
  onAsk,
  onCancel,
  onConfirm,
  onAccent = false,
  boundaryRef,
  askIcon = "delete",
  askLabel,
  askTitle = "Eliminar",
  className,
}: ConfirmActionRailProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLButtonElement>(null);
  const label = askLabel ?? askTitle;

  useEffect(() => {
    if (!confirm) return;
    focusRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    const onPointerDown = (e: PointerEvent) => {
      const boundary = boundaryRef?.current ?? rootRef.current;
      if (!boundary?.contains(e.target as Node)) onCancel();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [confirm, onCancel, boundaryRef]);

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
        title={label}
        aria-label={label}
        aria-expanded={confirm}
        onClick={onAsk}
        className={cn(
          slide,
          "cursor-pointer bg-transparent",
          onAccent
            ? "text-white"
            : "text-gray-400 hover:text-red-600 dark:hover:text-red-400",
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
          className={cn(
            "flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors",
            onAccent
              ? "text-white/90 hover:bg-white/15"
              : "text-gray-500 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/5",
          )}
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
          className={cn(
            "flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-95",
            onAccent
              ? "bg-white text-[#9a0002] hover:bg-white/90"
              : "bg-red-600 text-white hover:bg-red-700",
          )}
        >
          <MaterialSymbol icon="check" size={14} />
        </button>
      </div>
    </div>
  );
}
