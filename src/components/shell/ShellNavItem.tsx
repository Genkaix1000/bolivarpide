"use client";

import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function ShellSectionLabel({
  label,
  collapsed,
}: {
  label: string;
  collapsed?: boolean;
}) {
  if (collapsed) return null;
  return (
    <p className="mb-1.5 mt-5 px-4 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400 first:mt-0 dark:text-stone-500">
      {label}
    </p>
  );
}

/**
 * Active: rail flush left + soft glow (ref). Edge-to-edge; no rounded pill.
 */
export function ShellNavItem({
  href,
  label,
  icon: IconCmp,
  active,
  collapsed,
  badge,
  onClick,
}: {
  href?: string;
  label: string;
  icon: Icon;
  active?: boolean;
  collapsed?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  const cls = cn(
    "group relative flex w-full cursor-pointer items-center overflow-hidden transition-colors duration-150",
    collapsed ? "h-12 justify-center px-0" : "h-11 gap-3 pl-4 pr-3",
    !active &&
      "font-medium text-stone-500 hover:bg-black/[0.03] hover:text-stone-800 dark:text-stone-400 dark:hover:bg-white/[0.04] dark:hover:text-stone-100",
    active && "font-medium text-[#9a0002]",
  );

  const inner = (
    <>
      {active && (
        <>
          {/* Soft illuminate — washes from the rail into the row */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.14),rgba(154,0,2,0.05)_42%,transparent_72%)] dark:bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.28),rgba(154,0,2,0.1)_45%,transparent_75%)]"
          />
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 z-[1] w-[3px] bg-[#9a0002]"
          />
        </>
      )}
      <span
        className={cn(
          "relative z-[1] flex shrink-0 items-center justify-center",
          collapsed && "h-10 w-10",
        )}
      >
        <IconCmp
          weight={active ? "fill" : "regular"}
          size={collapsed ? 24 : 22}
          className="shrink-0"
          aria-hidden
        />
        {collapsed && badge != null && badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-sm bg-[#9a0002] px-0.5 text-[9px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {!collapsed && (
        <span className="relative z-[1] flex flex-1 items-center justify-between text-[13px] tracking-tight">
          <span>{label}</span>
          {badge != null && badge > 0 && (
            <span className="rounded-sm bg-[#9a0002] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>
      )}
      {collapsed && (
        <span className="pointer-events-none absolute left-full z-50 ml-3 scale-95 whitespace-nowrap rounded-md bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition group-hover:scale-100 group-hover:opacity-100 dark:bg-[#302c28]">
          {label}
          {badge ? ` (${badge})` : ""}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} title={collapsed ? label : undefined} className={cls}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} title={collapsed ? label : undefined} className={cls}>
      {inner}
    </button>
  );
}
