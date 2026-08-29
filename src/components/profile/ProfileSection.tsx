"use client";

import type React from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type ProfileSectionProps = {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function ProfileSection({
  icon,
  title,
  subtitle,
  badge,
  open,
  onToggle,
  children,
}: ProfileSectionProps) {
  return (
    <div className="border-b border-[#f0ebe4] dark:border-[#2a2623] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[#faf6f1] dark:hover:bg-[#2a2623]/60 transition-colors text-left cursor-pointer group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#faf6f1] dark:bg-[#1c1917] border border-[#e8e0d6] dark:border-[#3d3732] flex items-center justify-center text-gray-700 dark:text-gray-300 group-hover:text-[#9a0002] transition-colors shrink-0">
            <MaterialSymbol icon={icon} size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100">{title}</span>
              {badge && (
                <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
          </div>
        </div>
        <MaterialSymbol
          icon="expand_more"
          size={22}
          className={cn(
            "text-gray-400 shrink-0 transition-transform duration-200",
            open && "rotate-180",
            "group-hover:text-gray-600 dark:group-hover:text-gray-300",
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 animate-fade-in space-y-3 border-t border-[#f0ebe4] dark:border-[#2a2623] bg-[#faf6f1]/40 dark:bg-[#1c1917]/30">
          {children}
        </div>
      )}
    </div>
  );
}
