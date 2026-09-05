"use client";

import Link from "next/link";
import type { ActiveDriver } from "@/lib/delivery/types";

export function AssignDriverSelect({
  drivers,
  emptyHref,
  emptyLabel,
  label,
  disabled,
  onSelect,
}: {
  drivers: ActiveDriver[];
  emptyHref?: string;
  emptyLabel?: string;
  label: string;
  disabled?: boolean;
  onSelect: (driverId: string) => void;
}) {
  if (drivers.length === 0) {
    if (!emptyHref) return null;
    return (
      <Link
        href={emptyHref}
        className="text-[12px] font-semibold text-[#9a0002] hover:underline"
      >
        {emptyLabel ?? "Invitá repartidores"}
      </Link>
    );
  }

  return (
    <select
      value=""
      disabled={disabled}
      onChange={(e) => {
        const v = e.target.value;
        if (v) onSelect(v);
      }}
      className="h-9 max-w-[190px] cursor-pointer rounded-xl border border-stone-300 bg-white px-2.5 text-[12px] font-medium text-stone-700 outline-none focus:border-[#9a0002]/60 dark:border-[#3d3732] dark:bg-[#24201d] dark:text-stone-200"
    >
      <option value="" disabled>
        {label}
      </option>
      {drivers.map((d) => (
        <option key={d.userId} value={d.userId}>
          {d.displayName}
        </option>
      ))}
    </select>
  );
}