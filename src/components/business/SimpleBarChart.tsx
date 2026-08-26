"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SimpleBarChartProps {
  data: number[];
  labels: string[];
  className?: string;
}

const W = 420;
const H = 200;
const BAR_GAP = 18;
const LEFT_PAD = 8;
const RIGHT_PAD = 8;
const BOTTOM_PAD = 28;
const TOP_PAD = 20;

function niceMax(max: number) {
  return Math.max(10, Math.ceil(max / 10) * 10);
}

export function SimpleBarChart({ data, labels, className }: SimpleBarChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const rawMax = Math.max(...data, 1);
  const axisMax = niceMax(rawMax);
  const chartW = W - LEFT_PAD - RIGHT_PAD;
  const chartH = H - BOTTOM_PAD - TOP_PAD;
  const barWidth = Math.min(28, (chartW - BAR_GAP * (data.length - 1)) / data.length);

  return (
    <div className={cn("relative w-full", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[200px] overflow-visible" preserveAspectRatio="xMidYMid meet">
        {data.map((v, i) => {
          const barH = Math.max(8, (v / axisMax) * chartH);
          const totalBarsW = data.length * barWidth + (data.length - 1) * BAR_GAP;
          const startX = LEFT_PAD + (chartW - totalBarsW) / 2;
          const x = startX + i * (barWidth + BAR_GAP);
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
              <rect x={x - 4} y={TOP_PAD} width={barWidth + 8} height={chartH} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={barWidth / 2}
                className={cn(
                  "transition-all duration-200",
                  isHover || isPeak ? "fill-[#9a0002]" : "fill-[#9a0002]/35"
                )}
              />
              <text
                x={x + barWidth / 2}
                y={H - 8}
                textAnchor="middle"
                className="fill-gray-400 dark:fill-gray-500 text-[10px] font-medium select-none"
              >
                {labels[i]}
              </text>
              {isHover && (
                <g>
                  <rect
                    x={x + barWidth / 2 - 20}
                    y={y - 28}
                    width={40}
                    height={20}
                    rx={6}
                    className="fill-gray-900 dark:fill-white"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 14}
                    textAnchor="middle"
                    className="fill-white dark:fill-gray-900 text-[10px] font-bold select-none"
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
