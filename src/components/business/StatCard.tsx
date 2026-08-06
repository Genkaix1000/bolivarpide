"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: string;
  /** @deprecated call-site compat — icons always use brand accent */
  iconBg?: string;
  /** @deprecated call-site compat — icons always use brand accent */
  iconColor?: string;
  value: string;
  label: string;
  delta?: { text: string; direction: "up" | "down" };
}

export function StatCard({ icon, value, label, delta }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_10px_40px_-16px_rgba(61,43,31,0.18)] rounded-[20px] px-2.5 py-3 flex items-center gap-2.5 min-w-0">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#9a0002]/10 dark:bg-[#9a0002]/20">
        <MaterialSymbol icon={icon} size={18} className="text-[#9a0002]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 truncate">{label}</p>
        <p className="font-black text-[15px] sm:text-base text-gray-900 dark:text-gray-100 leading-tight tracking-tight mt-0.5 tabular-nums">
          {value}
        </p>
        {delta && (
          <div
            className={cn(
              "mt-0.5 flex items-center gap-0.5 text-[10px] font-semibold",
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
