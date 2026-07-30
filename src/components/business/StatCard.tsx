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
    <div className="bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-100 dark:border-[#3d3732] penpot-shadow rounded-[24px] p-5 flex flex-col gap-3">
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", iconBg)}>
        <MaterialSymbol icon={icon} size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="font-black text-2xl text-gray-800 dark:text-gray-100 mt-0.5">{value}</p>
      </div>
      {delta ? (
        <div className={cn("flex items-center gap-1 text-xs font-bold", delta.direction === "up" ? "text-emerald-500" : "text-red-500")}>
          <MaterialSymbol icon={delta.direction === "up" ? "trending_up" : "trending_down"} size={14} />
          <span>{delta.text}</span>
        </div>
      ) : (
        <span className="text-xs font-bold text-gray-300 dark:text-gray-600">—</span>
      )}
    </div>
  );
}
