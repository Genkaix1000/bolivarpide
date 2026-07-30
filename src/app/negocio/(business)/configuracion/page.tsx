import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto bg-[#faf6f1] dark:bg-[#1c1917] rounded-[24px] border border-gray-100 dark:border-[#3d3732] penpot-shadow">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2623] text-gray-500 dark:text-gray-400 flex items-center justify-center mb-4 shadow-inner border border-gray-200 dark:border-[#3d3732]">
        <MaterialSymbol icon="settings" size={28} />
      </div>
      <h3 className="font-extrabold text-base mb-1 text-gray-800 dark:text-gray-200">Configuración</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[280px]">
        Horarios, medios de pago y datos del negocio estarán disponibles en la siguiente fase.
      </p>
      <Link
        href="/negocio/dashboard"
        className="mt-6 px-6 py-2 bg-gradient-to-r from-[#9a0002] to-[#6b0001] text-white text-xs font-bold rounded-full hover:opacity-95 transition-all shadow-md shadow-red-500/20 cursor-pointer"
      >
        Volver al Dashboard
      </Link>
    </div>
  );
}
