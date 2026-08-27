"use client";

import { useId } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

function smoothPath(points: { x: number; y: number }[], tension = 0.35): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    d += ` C ${p1.x + (p2.x - p0.x) * tension},${p1.y + (p2.y - p0.y) * tension} ${p2.x - (p3.x - p1.x) * tension},${p2.y - (p3.y - p1.y) * tension} ${p2.x},${p2.y}`;
  }
  return d;
}

function Sparkline({ data, color, className }: { data: number[]; color: string; className?: string }) {
  const gradId = useId().replace(/:/g, "");
  const W = 96;
  const H = 40;
  const pad = 2;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2),
    y: pad + (1 - (v - min) / range) * (H - pad * 2),
  }));

  const baseline = H - pad;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {pts.length > 1 && (
        <>
          <path d={`${smoothPath(pts)} L ${pts[pts.length - 1].x},${baseline} L ${pts[0].x},${baseline} Z`} fill={`url(#${gradId})`} />
          <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

interface StatCardProps {
  icon: string;
  /** @deprecated call-site compat */
  iconBg?: string;
  /** @deprecated call-site compat */
  iconColor?: string;
  value: string;
  label: string;
  delta?: { text: string; direction: "up" | "down" };
  /** Nexus-style horizontal card with sparkline */
  large?: boolean;
  sparkline?: number[];
  /** Sparkline + fill color (icon stays neutral) */
  sparkColor?: string;
}

export function StatCard({ icon, value, label, delta, large, sparkline, sparkColor = "#9a0002" }: StatCardProps) {
  if (large) {
    return (
      <div className="bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.14)] rounded-[16px] p-4 md:p-5 flex items-center gap-3 md:gap-4 min-h-[88px]">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#f3efe8] dark:bg-[#2a2623]">
          <MaterialSymbol icon={icon} size={20} className="text-gray-500 dark:text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-gray-400 dark:text-gray-500 truncate">{label}</p>
          <p className="font-bold text-xl md:text-2xl text-gray-900 dark:text-gray-100 tracking-tight tabular-nums leading-tight mt-0.5">
            {value}
          </p>
        </div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} color={sparkColor} className="w-[72px] md:w-[96px] h-10 shrink-0" />
        )}
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
