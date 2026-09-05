"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Compact "?" popover for field explanations. */
export function FieldHint({
  text,
  title = "Consejo",
  className,
}: {
  text: string;
  title?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className={cn("relative inline-flex shrink-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Ver más información"
        aria-expanded={open}
        aria-label="Más información"
        className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600 hover:bg-stone-300 dark:bg-[#2a2623] dark:text-stone-300 dark:hover:bg-[#38332f]"
      >
        ?
      </button>
      {open && (
        <div className="absolute left-0 top-5 z-50 w-64 rounded-xl border border-[#e8e0d6] bg-white p-3 text-[11px] leading-relaxed text-stone-700 shadow-xl dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-200 sm:left-auto sm:right-0">
          <div className="mb-1 flex items-start justify-between gap-1">
            <span className="font-bold text-[#9a0002] dark:text-red-400">{title}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          <p>{text}</p>
        </div>
      )}
    </span>
  );
}
