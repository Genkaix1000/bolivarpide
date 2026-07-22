"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

interface MaterialSymbolProps {
  icon: string;
  fill?: boolean;
  weight?: number;
  grade?: number;
  opticalSize?: number;
  size?: number | string;
  className?: string;
  onClick?: () => void;
}

export function MaterialSymbol({
  icon,
  fill = false,
  weight = 400,
  grade = 0,
  opticalSize = 24,
  size,
  className,
  onClick,
}: MaterialSymbolProps) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={
        {
          fontSize: size,
          "--ms-fill": fill ? 1 : 0,
          fontVariationSettings: `'FILL' var(--ms-fill, ${fill ? 1 : 0}), 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
        } as CSSProperties
      }
      onClick={onClick}
    >
      {icon}
    </span>
  );
}
