"use client";

import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export default function CartaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center dark:border-[#3d3732] dark:bg-[#1c1917]">
      <MaterialSymbol icon="error" size={40} className="mx-auto text-stone-400" />
      <p className="mt-4 text-[15px] font-bold text-stone-800 dark:text-stone-100">
        No pudimos cargar tu carta
      </p>
      <p className="mt-2 text-[13px] text-stone-500 max-w-md mx-auto">
        Si tenías productos de prueba, los limpiamos al entrar. Volvé a intentar o empezá una carta nueva.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[#9a0002] px-5 py-2.5 text-[13px] font-bold text-white cursor-pointer"
        >
          Reintentar
        </button>
        <Link
          href="../dashboard"
          className="rounded-full border border-stone-300 px-5 py-2.5 text-[13px] font-bold text-stone-700 dark:border-[#3d3732] dark:text-stone-200"
        >
          Ir al panel
        </Link>
      </div>
      {process.env.NODE_ENV === "development" && (
        <p className="mt-4 text-[11px] text-red-600 font-mono">{error.message}</p>
      )}
    </div>
  );
}
