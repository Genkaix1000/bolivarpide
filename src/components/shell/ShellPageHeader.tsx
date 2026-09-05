import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared shell typography — match sidebar / SettingsSubnav. */
export const shellType = {
  title:
    "text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-[1.75rem]",
  titleSm: "text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-100",
  section:
    "text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500",
  muted: "mt-1 text-[13px] font-medium text-stone-500 dark:text-stone-400",
  badge:
    "rounded-full bg-[#9a0002]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#9a0002] dark:bg-[#9a0002]/20",
  kpi: "text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50",
} as const;

export function ShellPageHeader({
  title,
  description,
  badge,
  actions,
  className,
  as: Tag = "h1",
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <Tag className={shellType.title}>{title}</Tag>
          {badge != null && badge !== false && <span className={shellType.badge}>{badge}</span>}
        </div>
        {description ? <p className={shellType.muted}>{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
