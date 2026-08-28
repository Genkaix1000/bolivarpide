"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";

const KEY = "bp_flash_toast";

const TOAST_FROM_QUERY: Record<string, string> = {
  confirmed: "Cuenta confirmada. ¡Bienvenido!",
  login: "Sesión iniciada.",
  logout: "Sesión cerrada.",
};

export function flashToast(message: string) {
  sessionStorage.setItem(KEY, message);
}

function FlashToastInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const fromStore = sessionStorage.getItem(KEY);
    const toastKey = searchParams.get("toast");
    const fromQuery = toastKey ? TOAST_FROM_QUERY[toastKey] ?? null : null;
    const next = fromStore || fromQuery;
    if (!next) return;

    if (fromStore) sessionStorage.removeItem(KEY);
    if (toastKey) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("toast");
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    }
    setMsg(next);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 4500);
    return () => window.clearTimeout(t);
  }, [msg]);

  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          className="fixed bottom-6 left-1/2 z-[100] flex max-w-[min(92vw,420px)] -translate-x-1/2 items-center gap-3 rounded-full border border-[#9a0002]/12 bg-white px-3.5 py-2.5 text-stone-900 shadow-[0_14px_40px_-14px_rgba(61,43,31,0.4)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9a0002] text-white">
            <MaterialSymbol icon="check" size={20} fill />
          </span>
          <p className="min-w-0 flex-1 pr-1 text-[13px] font-semibold leading-snug">{msg}</p>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setMsg(null)}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <MaterialSymbol icon="close" size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FlashToast() {
  return (
    <Suspense fallback={null}>
      <FlashToastInner />
    </Suspense>
  );
}
