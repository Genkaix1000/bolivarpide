import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export default function EquipoPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto bg-[#faf6f1] dark:bg-[#1c1917] rounded-[24px] border border-gray-100 dark:border-[#3d3732] penpot-shadow">
      <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mb-4 shadow-inner border border-blue-100 dark:border-blue-900/30">
        <MaterialSymbol icon="group" size={28} />
      </div>
      <h3 className="font-extrabold text-base mb-1 text-gray-800 dark:text-gray-200">Tu Equipo</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[280px]">
        Muy pronto vas a poder invitar empleados, asignar roles y gestionar permisos desde acá.
      </p>
      <Link
        href="/negocio/dashboard"
        className="mt-6 px-6 py-2 bg-[#9a0002] hover:bg-[#850002] text-white text-xs font-bold rounded-full transition-all shadow-sm cursor-pointer"
      >
        Volver al Dashboard
      </Link>
    </div>
  );
}
