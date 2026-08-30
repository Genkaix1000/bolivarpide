"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

export function ProductImagePlaceholder({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 bg-[#f0ebe4] text-stone-400 dark:bg-[#231f1c] dark:text-stone-500",
        className,
      )}
    >
      <MaterialSymbol icon="restaurant" size={36} className="opacity-60" />
      {label && <span className="text-[11px] font-medium">{label}</span>}
    </div>
  );
}
