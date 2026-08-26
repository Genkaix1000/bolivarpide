"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: string;
  /** @deprecated call-site compat */
  iconBg?: string;
  /** @deprecated call-site compat */
  iconColor?: string;
  value: string;
  label: string;
  delta?: { text: string; direction: "up" | "down" };
  /** Sequence-style stacked metric (Income/Expense) */
  large?: boolean;
}

export function StatCard({ icon, value, label, delta, large }: StatCardProps) {
  if (large) {
    return (
      <div className="bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.14)] rounded-[16px] p-5 flex flex-col justify-between min-h-[140px]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[#9a0002]/10 dark:bg-[#9a0002]/20">
            <MaterialSymbol icon={icon} size={18} className="text-[#9a0002]" />
          </div>
        </div>
        <div>
          <p className="font-black text-2xl md:text-[28px] text-gray-900 dark:text-gray-100 tracking-tight tabular-nums leading-none">
            {value}
          </p>
          {delta && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-0.5 text-xs font-semibold",
                delta.direction === "up" ? "text-emerald-600" : "text-red-500"
              )}
            >
              <MaterialSymbol icon={delta.direction === "up" ? "trending_up" : "trending_down"} size={14} />
              <span>{delta.text}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.14)] rounded-[16px] px-4 py-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#9a0002]/10 dark:bg-[#9a0002]/20">
          <MaterialSymbol icon={icon} size={16} className="text-[#9a0002]" />
        </div>
      </div>
      <div>
        <p className="font-black text-xl sm:text-2xl text-gray-900 dark:text-gray-100 leading-tight tracking-tight tabular-nums">
          {value}
        </p>
        {delta && (
          <div
            className={cn(
              "mt-1.5 flex items-center gap-0.5 text-[11px] font-semibold",
              delta.direction === "up" ? "text-emerald-600" : "text-red-500"
            )}
          >
            <MaterialSymbol icon={delta.direction === "up" ? "trending_up" : "trending_down"} size={12} />
            <span className="truncate">{delta.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
