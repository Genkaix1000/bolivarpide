"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";

const KEY = "bp_flash_toast";
const TOAST_EVENT = "bp-flash-toast-show";
const UNDO_TOAST_EVENT = "bp-flash-toast-undo";

export type UndoToastPayload = {
  message: string;
  onUndo: () => void | Promise<void>;
};

const TOAST_FROM_QUERY: Record<string, string> = {
  confirmed: "Cuenta confirmada. ¡Bienvenido!",
  login: "Sesión iniciada.",
  logout: "Sesión cerrada.",
};

export function flashToast(message: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, message);
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }));
}

export function flashToastUndo(payload: UndoToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(UNDO_TOAST_EVENT, { detail: payload }));
}

function FlashToastInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState<string | null>(null);
  const [undo, setUndo] = useState<UndoToastPayload | null>(null);

  useEffect(() => {
    const show = (message: string) => {
      sessionStorage.removeItem(KEY);
      setUndo(null);
      setMsg(message);
    };

    const onToastEvent = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail) show(detail);
    };

    const onUndoEvent = (event: Event) => {
      const detail = (event as CustomEvent<UndoToastPayload>).detail;
      if (detail) {
        setMsg(null);
        setUndo(detail);
      }
    };

    window.addEventListener(TOAST_EVENT, onToastEvent);
    window.addEventListener(UNDO_TOAST_EVENT, onUndoEvent);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToastEvent);
      window.removeEventListener(UNDO_TOAST_EVENT, onUndoEvent);
    };
  }, []);

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
    if (!msg && !undo) return;
    const t = window.setTimeout(() => {
      setMsg(null);
      setUndo(null);
    }, 4500);
    return () => window.clearTimeout(t);
  }, [msg, undo]);

  const active = undo ?? (msg ? { message: msg } : null);
  const isUndo = Boolean(undo);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          className="fixed bottom-6 left-1/2 z-[100] flex max-w-[min(92vw,420px)] -translate-x-1/2 items-center gap-3 rounded-full border border-[#9a0002]/12 bg-white px-3.5 py-2.5 text-stone-900 shadow-[0_14px_40px_-14px_rgba(61,43,31,0.4)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9a0002] text-white">
            <MaterialSymbol icon={isUndo ? "delete" : "check"} size={20} fill />
          </span>
          <p className="min-w-0 flex-1 pr-1 text-[13px] font-semibold leading-snug">{active.message}</p>
          {isUndo && undo && (
            <button
              type="button"
              onClick={() => {
                void undo.onUndo();
                setUndo(null);
              }}
              className="shrink-0 rounded-full bg-[#9a0002]/10 px-3 py-1.5 text-[12px] font-bold text-[#9a0002] hover:bg-[#9a0002]/15"
            >
              Deshacer
            </button>
          )}
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => {
              setMsg(null);
              setUndo(null);
            }}
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
