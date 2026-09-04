"use client";

import React, { useState, useEffect, useRef } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { startThemeTransitionFrom } from "@/components/Navbar";
import { cn } from "@/lib/utils";

interface ThemeSegmentedControlProps {
  className?: string;
}

export function ThemeSegmentedControl({ className = "" }: ThemeSegmentedControlProps) {
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => setIsDark(document.documentElement.classList.contains("dark")));
  }, []);

  const setMode = (darkMode: boolean) => {
    if (darkMode === isDark) return;
    setIsDark(darkMode);
    startThemeTransitionFrom(containerRef.current, darkMode);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-center p-1 bg-[#ede4d9]/70 dark:bg-[#1f1b18] rounded-xl border border-[#e8e0d6] dark:border-[#3d3732] shadow-2xs w-full",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setMode(false)}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer",
          !isDark
            ? "bg-white text-gray-900 shadow-xs dark:bg-transparent"
            : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        )}
      >
        <MaterialSymbol icon="light_mode" size={15} className={!isDark ? "text-amber-500" : "text-gray-400"} />
        <span>Claro</span>
      </button>

      <button
        type="button"
        onClick={() => setMode(true)}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer",
          isDark
            ? "bg-[#2d2825] text-white shadow-xs"
            : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        )}
      >
        <MaterialSymbol icon="dark_mode" size={15} className={isDark ? "text-indigo-400" : "text-gray-400"} />
        <span>Oscuro</span>
      </button>
    </div>
  );
}
