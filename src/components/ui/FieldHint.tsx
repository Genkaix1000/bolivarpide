"use client";

import { cn } from "@/lib/utils";

/** Compact "?" popover for field explanations using native <details>. */
export function FieldHint({
  text,
  title = "Consejo",
  className,
}: {
  text: string;
  title?: string;
  className?: string;
}) {
  return (
    <details className={cn("group relative inline-flex shrink-0", className)}>
      <summary
        title="Ver más información"
        aria-label="Más información"
        className="flex h-4 w-4 list-none cursor-pointer items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600 hover:bg-stone-300 dark:bg-[#2a2623] dark:text-stone-300 dark:hover:bg-[#38332f] [&::-webkit-details-marker]:hidden select-none"
      >
        ?
      </summary>
      <div className="absolute left-0 top-5 z-50 w-64 rounded-xl border border-[#e8e0d6] bg-white p-3 text-[11px] leading-relaxed text-stone-700 shadow-xl dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-200 sm:left-auto sm:right-0">
        <p className="mb-1 font-bold text-[#9a0002] dark:text-red-400">{title}</p>
        <p>{text}</p>
      </div>
    </details>
  );
}

