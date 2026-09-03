"use client";

import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export function CreateBusinessCard() {
  return (
    <Link
      href="/negocio/registro"
      className="group relative flex flex-col items-center justify-center min-h-[310px] p-6 rounded-[24px] border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-[#9a0002] dark:hover:border-[#9a0002] bg-stone-50/50 dark:bg-[#1a1715]/50 hover:bg-white dark:hover:bg-[#1f1b18] transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer text-center"
    >
      {/* Circle with Plus icon - styled closely to user's reference */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Outer dashed ring */}
        <div className="absolute inset-0 -m-2 rounded-full border-2 border-dashed border-[#9a0002]/40 dark:border-[#9a0002]/40 group-hover:border-[#9a0002] group-hover:scale-105 transition-all duration-300" />
        
        {/* Brand filled circle */}
        <div className="w-14 h-14 rounded-full bg-[#9a0002] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
          <MaterialSymbol icon="add" size={28} className="transition-transform duration-300 group-hover:rotate-90" />
        </div>
      </div>

      <h3 className="text-[15px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#9a0002] transition-colors">
        Registrar nuevo comercio
      </h3>

      <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 max-w-[200px] leading-relaxed">
        Abrí una nueva sucursal o sumá otro local con el asistente de registro
      </p>

      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#9a0002] bg-[#9a0002]/10 dark:bg-[#9a0002]/20 px-3 py-1.5 rounded-full group-hover:bg-[#9a0002] group-hover:text-white transition-colors">
        <span>Comenzar</span>
        <MaterialSymbol icon="arrow_forward" size={14} />
      </span>
    </Link>
  );
}
