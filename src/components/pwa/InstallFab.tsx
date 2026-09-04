"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { setInstallCookie } from "@/lib/pwa/install-global";
import { usePwaInstall } from "@/lib/pwa/usePwaInstall";

const INTRO_KEY = "bp_pwa_fab_intro";
const FIRST_SHOW_DELAY_MS = 3500;

export function InstallFab() {
  const { isCapable, isIos, installed, dismissed, deferred, requestInstall } = usePwaInstall();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [iosInstructions, setIosInstructions] = useState(false);

  useEffect(() => {
    if (!isCapable || installed || dismissed) return;
    const firstTime = !localStorage.getItem(INTRO_KEY);
    const timer = window.setTimeout(() => {
      if (firstTime) {
        localStorage.setItem(INTRO_KEY, "1");
        setExpanded(true);
      }
      setVisible(true);
    }, firstTime ? FIRST_SHOW_DELAY_MS : 0);
    return () => window.clearTimeout(timer);
  }, [isCapable, installed, dismissed]);

  useEffect(() => {
    if (installed) queueMicrotask(() => setVisible(false));
  }, [installed]);

  useEffect(() => {
    if (isIos) queueMicrotask(() => setIosInstructions(true));
  }, [isIos]);

  const handleInstall = useCallback(async () => {
    const result = await requestInstall();
    if (result === "installed") {
      setVisible(false);
      setExpanded(false);
    } else if (result === "dismissed") {
      setExpanded(false);
    }
  }, [requestInstall]);

  const handleDismiss = useCallback(() => {
    setInstallCookie("dismissed");
    setExpanded(false);
    setVisible(false);
  }, []);

  const handleCollapse = useCallback(() => setExpanded(false), []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-end justify-end gap-3">
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-[min(78vw,340px)] overflow-hidden rounded-2xl border border-black/5 bg-white/95 shadow-lg shadow-black/10 backdrop-blur dark:border-white/10 dark:bg-[#231f1c]/95"
          >
            <div className="flex items-center gap-3 p-3 pb-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-sm font-bold text-white">
                B
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-tight text-gray-900 dark:text-gray-100">
                  Instalar BolivarPide
                </p>
                <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                  Acceso rápido de app sin abrir el navegador.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCollapse}
                aria-label="Colapsar sugerencia de instalación"
                className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
              >
                <MaterialSymbol icon="close" size={18} />
              </button>
            </div>

            <div className="p-3 pt-2">
              {iosInstructions ? (
                <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                  En Safari: tocá Compartir <span aria-hidden>⎋</span> y luego{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    “Agregar a pantalla de inicio”
                  </span>
                  .
                </p>
              ) : deferred ? (
                <button
                  type="button"
                  onClick={() => void handleInstall()}
                  className="w-full rounded-xl bg-[#9a0002] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#7d0001] active:scale-[0.98]"
                >
                  Instalar app
                </button>
              ) : (
                <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                  La opción de instalación se habilita al recargar la página una vez.
                </p>
              )}
            </div>

            <div className="px-3 pb-2.5">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-[10px] font-medium text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                Ocultar esta opción
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-label="Instalar BolivarPide"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 0.9 }}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-white shadow-xl shadow-black/20"
      >
        <MaterialSymbol icon="system_update_alt" size={22} />
      </motion.button>
    </div>
  );
}