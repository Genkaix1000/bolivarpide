"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SimpleBarChartProps {
  data: number[];
  labels: string[];
  className?: string;
}

const W = 350;
const H = 170;
const BAR_GAP = 14;
const LEFT_PAD = 22;
const BOTTOM_PAD = 22;
const TOP_PAD = 14;

function niceMax(max: number) {
  return Math.max(10, Math.ceil(max / 10) * 10);
}

export function SimpleBarChart({ data, labels, className }: SimpleBarChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const rawMax = Math.max(...data, 1);
  const axisMax = niceMax(rawMax);
  const chartW = W - LEFT_PAD;
  const chartH = H - BOTTOM_PAD - TOP_PAD;
  const barWidth = (chartW - BAR_GAP * (data.length - 1)) / data.length;
  const ticks = [0, axisMax / 2, axisMax];

  return (
    <div className={cn("relative w-full", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[170px] overflow-visible" preserveAspectRatio="none">
        {/* Y-axis gridlines + labels */}
        {ticks.map((t) => {
          const y = H - BOTTOM_PAD - (t / axisMax) * chartH;
          return (
            <g key={t}>
              <line x1={LEFT_PAD} y1={y} x2={W} y2={y} className="stroke-gray-100 dark:stroke-[#2a2623]" strokeWidth={1} />
              <text x={0} y={y + 3} className="fill-gray-300 dark:fill-gray-600 text-[8px] font-bold select-none">
                {t}
              </text>
            </g>
          );
        })}

        {data.map((v, i) => {
          const barH = (v / axisMax) * chartH;
          const x = LEFT_PAD + i * (barWidth + BAR_GAP);
          const y = H - BOTTOM_PAD - barH;
          const isHover = hoverIdx === i;
          const isPeak = v === rawMax;
          return (
            <g
              key={i}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              <rect x={x} y={0} width={barWidth} height={H - BOTTOM_PAD} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={6}
                className={cn("transition-all duration-200", isHover || isPeak ? "fill-[#9a0002]" : "fill-[#9a0002]/25")}
              />
              <text
                x={x + barWidth / 2}
                y={H - 4}
                textAnchor="middle"
                className="fill-gray-400 dark:fill-gray-500 text-[9px] font-bold select-none"
              >
                {labels[i]}
              </text>
              {isHover && (
                <g>
                  <rect x={x + barWidth / 2 - 17} y={y - 26} width={34} height={18} rx={5} className="fill-gray-900 dark:fill-white" />
                  <text
                    x={x + barWidth / 2}
                    y={y - 13}
                    textAnchor="middle"
                    className="fill-white dark:fill-gray-900 text-[9px] font-black select-none"
                  >
                    {v}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
