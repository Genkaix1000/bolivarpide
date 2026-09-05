"use client";

import Link from "next/link";
import { ArrowLeft, MagnifyingGlass, SignOut } from "@phosphor-icons/react";
import { signOut } from "@/lib/auth/actions";
import { ShellPageHeader } from "@/components/shell/ShellPageHeader";

export function HubHeader({
  activeCount,
  searchQuery,
  onSearchChange,
}: {
  activeCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/"
            className="group mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 transition-colors hover:text-[#9a0002] dark:text-stone-400"
          >
            <ArrowLeft
              weight="regular"
              size={14}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            <span>Ir al inicio</span>
          </Link>
          <ShellPageHeader
            title="Mis locales"
            description="Seleccioná un local para gestionar pedidos y catálogo, o agregá uno nuevo."
            badge={`${activeCount} ${activeCount === 1 ? "local" : "locales"}`}
          />
        </div>

        <form action={signOut} className="self-start sm:self-auto">
          <input type="hidden" name="next" value="/" />
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-[13px] font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-[#1f1b18] dark:text-stone-300 dark:hover:bg-[#2a2623]"
          >
            <SignOut weight="regular" size={16} />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>

      {activeCount > 2 && (
        <div className="relative max-w-md">
          <MagnifyingGlass
            weight="regular"
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar local por nombre o dirección..."
            className="w-full rounded-full border border-stone-200 bg-white py-2 pl-10 pr-4 text-[13px] font-medium text-stone-900 outline-none focus:ring-2 focus:ring-[#9a0002]/30 dark:border-stone-800 dark:bg-[#1c1917] dark:text-stone-100"
          />
        </div>
      )}
    </div>
  );
}
