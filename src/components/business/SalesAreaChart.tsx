"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type Series = { label: string; values: number[]; color?: "primary" | "secondary" };

interface SalesAreaChartProps {
  labels: string[];
  series: Series[];
  className?: string;
  formatValue?: (n: number) => string;
}

const W = 720;
const H = 320;
const LEFT = 56;
const RIGHT = 20;
const TOP = 20;
const BOTTOM = 40;

const PRIMARY = "#9a0002";
const SECONDARY = "#c4bdb4";

function niceMax(max: number) {
  if (max <= 0) return 10000;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * mag;
}

function axisLabel(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

function defaultFormat(n: number) {
  return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Catmull-Rom → cubic Bézier for smooth spline */
function smoothPath(points: { x: number; y: number }[], tension = 0.35): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function areaPath(points: { x: number; y: number }[], baseline: number): string {
  if (points.length === 0) return "";
  const line = smoothPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x},${baseline} L ${first.x},${baseline} Z`;
}

export function SalesAreaChart({
  labels,
  series,
  className,
  formatValue = defaultFormat,
}: SalesAreaChartProps) {
  const gradId = useId().replace(/:/g, "");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const n = labels.length;
  const chartW = W - LEFT - RIGHT;
  const chartH = H - TOP - BOTTOM;
  const baseline = TOP + chartH;

  const allValues = series.flatMap((s) => s.values);
  const rawMax = Math.max(...allValues, 1);
  const axisMax = niceMax(rawMax);
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (axisMax / tickCount) * i);

  const toPoint = (value: number, i: number) => ({
    x: LEFT + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW),
    y: TOP + chartH - (value / axisMax) * chartH,
  });

  const primary = series[0];
  const secondary = series[1];
  const primaryPts = primary?.values.map(toPoint) ?? [];
  const secondaryPts = secondary?.values.map(toPoint) ?? [];

  const hoverX = hoverIdx !== null ? primaryPts[hoverIdx]?.x : null;
  const hoverPrimary = hoverIdx !== null ? primary?.values[hoverIdx] : null;
  const hoverY = hoverIdx !== null ? primaryPts[hoverIdx]?.y : null;

  return (
    <div className={cn("relative w-full min-h-[280px] md:min-h-[320px] select-none", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full min-h-[280px] md:min-h-[320px]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.22} />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Grid + Y labels */}
        {ticks.map((tick) => {
          const y = TOP + chartH - (tick / axisMax) * chartH;
          return (
            <g key={tick}>
              <line
                x1={LEFT}
                y1={y}
                x2={W - RIGHT}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeDasharray="4 4"
                className="text-gray-900 dark:text-gray-100"
              />
              <text
                x={LEFT - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-gray-400 dark:fill-gray-500 text-[10px] font-medium"
              >
                {axisLabel(tick)}
              </text>
            </g>
          );
        })}

        {/* Primary area fill */}
        {primaryPts.length > 1 && (
          <path d={areaPath(primaryPts, baseline)} fill={`url(#${gradId})`} />
        )}

        {/* Secondary line (behind primary) */}
        {secondaryPts.length > 1 && (
          <path
            d={smoothPath(secondaryPts)}
            fill="none"
            stroke={SECONDARY}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Primary line */}
        {primaryPts.length > 1 && (
          <path
            d={smoothPath(primaryPts)}
            fill="none"
            stroke={PRIMARY}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Hover vertical guide */}
        {hoverX !== null && hoverY !== null && (
          <>
            <line
              x1={hoverX}
              y1={TOP}
              x2={hoverX}
              y2={baseline}
              stroke="#9ca3af"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <circle cx={hoverX} cy={hoverY} r={5} fill={PRIMARY} stroke="white" strokeWidth={2} />
            <g>
              <rect
                x={hoverX - 52}
                y={hoverY - 38}
                width={104}
                height={26}
                rx={8}
                className="fill-gray-900 dark:fill-white"
              />
              <text
                x={hoverX}
                y={hoverY - 20}
                textAnchor="middle"
                className="fill-white dark:fill-gray-900 text-[11px] font-bold"
              >
                {hoverPrimary !== null && hoverPrimary !== undefined ? formatValue(hoverPrimary) : ""}
              </text>
            </g>
          </>
        )}

        {/* X labels */}
        {labels.map((label, i) => {
          const x = primaryPts[i]?.x ?? LEFT;
          const active = hoverIdx === i;
          return (
            <text
              key={label + i}
              x={x}
              y={H - 10}
              textAnchor="middle"
              className={cn(
                "text-[10px] font-medium transition-colors",
                active ? "fill-[#9a0002] font-semibold" : "fill-gray-400 dark:fill-gray-500"
              )}
            >
              {label}
            </text>
          );
        })}

        {/* Hover targets */}
        {primaryPts.map((pt, i) => (
          <rect
            key={i}
            x={pt.x - chartW / n / 2}
            y={TOP}
            width={chartW / n}
            height={chartH}
            fill="transparent"
            className="cursor-crosshair"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          />
        ))}
      </svg>
    </div>
  );
}

/** Legend pills for chart header */
export function SalesChartLegend({ series }: { series: Series[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {series.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: i === 0 ? PRIMARY : SECONDARY }}
          />
          <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
