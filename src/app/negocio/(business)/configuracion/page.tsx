"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import Link from "next/link";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Configuración</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Ajustes operativos, horarios y preferencias del local.
        </p>
      </div>

      <div className="bg-white dark:bg-[#1c1917] rounded-[24px] p-8 border border-gray-100 dark:border-[#3d3732] penpot-shadow space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100 dark:border-[#3d3732]">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <MaterialSymbol icon="storefront" size={28} />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">Ajustes del Negocio</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Configuración operativa, horarios de atención y opciones de pago.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#231f1c] border border-gray-100 dark:border-[#3d3732] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MaterialSymbol icon="schedule" size={20} className="text-gray-500" />
              <div>
                <h4 className="text-xs font-extrabold text-gray-800 dark:text-gray-200">Horarios de Atención</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Lunes a Domingo — 11:30 a 23:30 hs</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
              Abierto
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#231f1c] border border-gray-100 dark:border-[#3d3732] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MaterialSymbol icon="payments" size={20} className="text-gray-500" />
              <div>
                <h4 className="text-xs font-extrabold text-gray-800 dark:text-gray-200">Medios de Pago Habilitados</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Mercado Pago, Efectivo y Transferencia</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full">
              Activo
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#231f1c] border border-gray-100 dark:border-[#3d3732] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MaterialSymbol icon="location_on" size={20} className="text-gray-500" />
              <div>
                <h4 className="text-xs font-extrabold text-gray-800 dark:text-gray-200">Dirección & Zona de Cobertura</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Av. San Martín 452 — Radio 5.5 km</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-gray-500 bg-gray-200 dark:bg-gray-800 px-2.5 py-1 rounded-full">
              Configurado
            </span>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Link
            href="/negocio/dashboard"
            className="px-6 py-2.5 bg-[#9a0002] hover:bg-[#850002] text-white text-xs font-bold rounded-full transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <MaterialSymbol icon="arrow_back" size={16} />
            <span>Volver al Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
