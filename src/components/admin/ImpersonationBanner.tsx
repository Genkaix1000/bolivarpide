import { endImpersonationAndGo } from "@/lib/admin/impersonateActions";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export function ImpersonationBanner({ businessName }: { businessName: string }) {
  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-[#7a0001] bg-[#9a0002] px-4 py-2.5 text-white shadow-lg shadow-[#9a0002]/30">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <MaterialSymbol icon="shield_person" size={20} fill />
        <span>
          Modo Superadmin activo: navegás como titular en <strong>{businessName}</strong>
        </span>
      </p>
      <form action={endImpersonationAndGo}>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#9a0002] hover:bg-white/90"
        >
          Salir y volver al Panel Admin
        </button>
      </form>
    </div>
  );
}
