"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  delta?: { text: string; direction: "up" | "down" };
}

export function StatCard({ icon, iconBg, iconColor, value, label, delta }: StatCardProps) {
  return (
    <div className="bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-100 dark:border-[#3d3732] penpot-shadow rounded-[20px] p-4 flex items-center gap-3.5">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs", iconBg)}>
        <MaterialSymbol icon={icon} size={20} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="font-black text-xl text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
          {delta && (
            <div className={cn("flex items-center gap-0.5 text-[11px] font-bold", delta.direction === "up" ? "text-emerald-500" : "text-red-500")}>
              <MaterialSymbol icon={delta.direction === "up" ? "trending_up" : "trending_down"} size={13} />
              <span>{delta.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
