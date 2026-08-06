"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  CherryBtn,
  NOTIFICATION_POPOVER_MOTION,
  SkiperSunMoon,
  startThemeTransitionFrom,
} from "@/components/Navbar";
import { SmoothInput } from "@/components/SmoothInput";

const NOTIFICATIONS = [
  { emoji: "🛒", title: "Nuevo pedido #1042 de Juan Pérez", time: "Hace 2 min" },
  { emoji: "⭐", title: "Recibiste una reseña de 5 estrellas", time: "Hace 20 min" },
  { emoji: "📦", title: "Stock bajo: Torta Oreo", time: "Hace 1 hora" },
];

interface BusinessTopbarProps {
  onMenuClick: () => void;
}

export function BusinessTopbar({ onMenuClick }: BusinessTopbarProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const themeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    startThemeTransitionFrom(themeBtnRef.current, next);
  }, [isDark]);

  const handleToggleNotif = () => {
    setShowNotifDropdown((prev) => !prev);
    setUnreadCount(0);
  };

  return (
    <header className="sticky top-0 z-20 h-[72px] flex-shrink-0 border-b border-gray-100 bg-[#faf6f1]/90 px-4 backdrop-blur-md dark:border-[#3d3732] dark:bg-[#1c1917]/90 md:px-8 relative">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between gap-3">
        {/* Left */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={onMenuClick}
            aria-label="Abrir menú"
            className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-[#ede4d9] dark:text-gray-400 dark:hover:bg-[#2a2623] cursor-pointer"
          >
            <MaterialSymbol icon="menu" size={20} />
          </button>

          <div className="hidden h-11 w-full max-w-md items-center gap-2.5 rounded-full border border-gray-200 bg-white px-4.5 shadow-sm transition-colors focus-within:border-[#9a0002]/40 dark:border-[#3d3732] dark:bg-[#2a2623] md:flex">
            <MaterialSymbol icon="search" size={17} className="shrink-0 text-[#9a0002]" />
            <SmoothInput
              placeholder="Buscar en el panel..."
              className="w-full text-xs font-semibold text-gray-700 dark:text-gray-300"
            />
          </div>
        </div>

        {/* Right — same cluster as landing: theme · notif · | · user */}
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Buscar"
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-[#ede4d9] dark:text-gray-400 dark:hover:bg-[#2a2623] cursor-pointer"
          >
            <MaterialSymbol icon="search" size={18} />
          </button>

          <CherryBtn
            onClick={toggleTheme}
            btnRef={themeBtnRef}
            aria-label={isDark ? "Modo claro" : "Modo oscuro"}
            className="hidden md:flex overflow-hidden"
          >
            <SkiperSunMoon isDark={isDark} clipId="biz-theme" />
          </CherryBtn>

          <div className="relative">
            <CherryBtn onClick={handleToggleNotif} aria-label="Notificaciones">
              <MaterialSymbol icon="notifications" size={17} className="text-white" />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ffeb3b] px-[4px] text-[9px] font-black text-[#6b0001] ring-[1.5px] ring-[#9a0002]">
                  {unreadCount}
                </span>
              )}
            </CherryBtn>

            <AnimatePresence>
              {showNotifDropdown && (
                <motion.div
                  {...NOTIFICATION_POPOVER_MOTION}
                  className="absolute top-[48px] right-0 z-50 w-[270px] rounded-[20px] border border-white/40 bg-[#faf6f1]/96 p-4 text-gray-800 shadow-2xl backdrop-blur-md dark:border-[#3d3732] dark:bg-[#231f1c]/96 dark:text-[#ece8e2]"
                >
                  <div className="space-y-2">
                    {NOTIFICATIONS.map((n, idx) => (
                      <div
                        key={idx}
                        className="flex cursor-pointer gap-2 rounded-xl bg-[#ede4d9]/60 p-2.5 text-left transition-colors hover:bg-[#ede4d9] dark:bg-[#2a2623] dark:hover:bg-[#302c28]/60"
                      >
                        <span className="select-none text-base">{n.emoji}</span>
                        <div className="flex min-w-0 flex-col">
                          <span className="text-[10px] font-bold leading-tight text-gray-800 dark:text-[#d4cfc9]">
                            {n.title}
                          </span>
                          <span className="mt-0.5 text-[8px] font-medium text-gray-400 dark:text-gray-500">
                            {n.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mx-0.5 hidden h-7 w-px bg-gray-200 dark:bg-[#3d3732] md:block" />

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#9a0002] to-[#6b0001] text-xs font-extrabold text-white shadow-sm ring-2 ring-white dark:ring-[#2a2623]">
              CR
            </div>
            <span className="hidden max-w-[140px] truncate text-sm font-bold text-gray-800 dark:text-gray-200 md:inline">
              Carlos Rodríguez
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-30 flex h-[72px] items-center gap-2 bg-[#faf6f1] px-4 dark:bg-[#1c1917] md:hidden"
          >
            <MaterialSymbol icon="search" size={16} className="shrink-0 text-[#9a0002]" />
            <SmoothInput
              autoFocus
              placeholder="Buscar en el panel..."
              className="flex-1 text-xs font-bold text-gray-700 dark:text-gray-300"
            />
            <button
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Cerrar búsqueda"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#ede4d9] dark:hover:bg-[#2a2623]"
            >
              <MaterialSymbol icon="close" size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
