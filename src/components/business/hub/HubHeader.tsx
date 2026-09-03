"use client";

import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { MaterialSymbol } from "@/components/ui/material-symbol";

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
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/"
            className="group mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 dark:text-stone-400 hover:text-[#9a0002] transition-colors"
          >
            <MaterialSymbol icon="arrow_back" size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Ir al inicio</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              Mis locales
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#9a0002]/10 text-[#9a0002] dark:bg-[#9a0002]/20">
              {activeCount} {activeCount === 1 ? "local" : "locales"}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Seleccioná un local para gestionar pedidos y catálogo, o agregá uno nuevo.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <form action={signOut}>
            <input type="hidden" name="next" value="/" />
            <button
              type="submit"
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1f1b18] px-4 py-2 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#2a2623] transition-colors shadow-sm"
            >
              <MaterialSymbol icon="logout" size={16} />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </div>

      {/* Filter / Search Bar if user has multiple businesses */}
      {activeCount > 2 && (
        <div className="relative max-w-md">
          <MaterialSymbol
            icon="search"
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar local por nombre o dirección..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1c1917] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#9a0002]/30"
          />
        </div>
      )}
    </div>
  );
}
