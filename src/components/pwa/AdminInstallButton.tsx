"use client";

import { useCallback } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { flashToast } from "@/components/FlashToast";
import { usePwaInstall } from "@/lib/pwa/usePwaInstall";

export function AdminInstallButton() {
  const { isCapable, requestInstall } = usePwaInstall();

  const handleInstall = useCallback(async () => {
    const result = await requestInstall();
    if (result === "ios") {
      flashToast("En Safari: tocá Compartir → “Agregar a pantalla de inicio”.");
    } else if (result === "pending") {
      flashToast("Usá la opción de instalar de tu navegador (recargá si no aparece).");
    }
  }, [requestInstall]);

  if (!isCapable) return null;

  return (
    <button
      type="button"
      onClick={() => void handleInstall()}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
    >
      <MaterialSymbol icon="system_update_alt" size={18} />
      Instalar app
    </button>
  );
}