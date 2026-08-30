"use client";

import { useRef } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type Props = {
  disabled?: boolean;
  onPick: (file: File) => void | Promise<void>;
  className?: string;
  compact?: boolean;
};

export function ImageSourceActions({ disabled, onPick, className, compact }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    await onPick(file);
  }

  const btnClass = cn(
    "inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white font-bold text-stone-700 transition-colors hover:border-[#9a0002]/40 hover:text-[#9a0002] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-200",
    compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]",
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => cameraRef.current?.click()}
        className={btnClass}
      >
        <MaterialSymbol icon="photo_camera" size={compact ? 14 : 15} />
        Sacar foto
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => galleryRef.current?.click()}
        className={btnClass}
      >
        <MaterialSymbol icon="photo_library" size={compact ? 14 : 15} />
        Galería
      </button>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
