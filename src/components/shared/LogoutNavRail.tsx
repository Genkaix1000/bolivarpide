"use client";

import { useEffect, useRef, type RefObject } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type Props = {
  confirm: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  /** Footer pintado con acento — ajusta botones de confirmación */
  onAccent?: boolean;
  /** Área que mantiene el modo confirm (típico: footer entero) */
  boundaryRef?: RefObject<HTMLElement | null>;
  /** Ícono Material del botón pedir confirmación (default: logout) */
  askIcon?: string;
  askTitle?: string;
};

const slide =
  "absolute inset-0 flex items-center justify-end transition-all duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]";

/**
 * Acción con confirmación inline: ícono → ✕ y ✓ al confirmar.
 */
export function LogoutNavRail({
  confirm,
  onAsk,
  onCancel,
  onConfirm,
  onAccent = false,
  boundaryRef,
  askIcon = "logout",
  askTitle = "Cerrar sesión",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLButtonElement>(null);

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
        "relative h-9 shrink-0 overflow-hidden transition-[width] duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        confirm ? "w-[72px]" : "w-9",
      )}
    >
      <button
        type="button"
        title={askTitle}
        aria-label={askTitle}
        aria-expanded={confirm}
        onClick={onAsk}
        className={cn(
          slide,
          "cursor-pointer bg-transparent",
          onAccent ? "text-white" : "text-[#9a0002] hover:text-[#7a0001] dark:text-red-400 dark:hover:text-red-300",
          confirm ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100",
        )}
      >
        <MaterialSymbol icon={askIcon} size={20} />
      </button>

      <div
        className={cn(
          slide,
          "gap-1 pr-0.5",
          confirm ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none",
        )}
      >
        <button
          ref={focusRef}
          type="button"
          title="Cancelar"
          aria-label="Cancelar"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className={cn(
            "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors",
            onAccent
              ? "text-white/90 hover:bg-white/15"
              : "text-gray-500 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/5",
          )}
        >
          <MaterialSymbol icon="close" size={16} />
        </button>
        <button
          type="button"
          title="Confirmar"
          aria-label="Confirmar"
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          className={cn(
            "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-95",
            onAccent
              ? "bg-white text-[#9a0002] hover:bg-white/90"
              : "bg-[#9a0002] text-white hover:brightness-110",
          )}
        >
          <MaterialSymbol icon="check" size={16} />
        </button>
      </div>
    </div>
  );
}
