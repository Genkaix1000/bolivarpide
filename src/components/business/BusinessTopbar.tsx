"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const themeBtnRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (!showUserMenu) return;
    const onPointer = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [showUserMenu]);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    startThemeTransitionFrom(themeBtnRef.current, next);
  }, [isDark]);

  const handleToggleNotif = () => {
    setShowNotifDropdown((prev) => !prev);
    setShowUserMenu(false);
    setUnreadCount(0);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-20 h-[64px] flex-shrink-0 border-b border-[#e8e0d6] bg-[#faf6f1]/90 px-4 backdrop-blur-md dark:border-[#3d3732] dark:bg-[#1c1917]/90 md:px-8 relative">
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

          <div className="hidden h-10 w-full max-w-sm items-center gap-2.5 rounded-xl border border-[#e8e0d6] bg-white px-3.5 transition-colors focus-within:border-[#9a0002]/35 dark:border-[#3d3732] dark:bg-[#2a2623] md:flex">
            <MaterialSymbol icon="search" size={17} className="shrink-0 text-gray-400" />
            <SmoothInput
              placeholder="Buscar en el panel..."
              className="w-full text-[13px] font-medium text-gray-700 dark:text-gray-300"
            />
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#f5f1eb] dark:bg-[#1c1917] text-[10px] font-semibold text-gray-400 border border-[#e8e0d6] dark:border-[#3d3732]">
              ⌘F
            </kbd>
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

          {/* User card — logout from here */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowUserMenu((v) => !v);
                setShowNotifDropdown(false);
              }}
              className="flex items-center gap-2.5 rounded-2xl border border-[#e8e0d6] bg-white pl-1.5 pr-2.5 py-1.5 shadow-[0_1px_2px_rgba(61,43,31,0.04)] transition-colors hover:bg-[#faf6f1] dark:border-[#3d3732] dark:bg-[#231f1c] dark:hover:bg-[#2a2623] cursor-pointer max-w-[220px]"
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#9a0002] to-[#6b0001] text-[11px] font-bold text-white">
                CR
              </div>
              <div className="hidden min-w-0 text-left sm:block">
                <p className="truncate text-[13px] font-semibold leading-tight text-gray-900 dark:text-gray-100">
                  Carlos Rodríguez
                </p>
                <p className="truncate text-[11px] leading-tight text-gray-400">carlos@local.com</p>
              </div>
              <MaterialSymbol icon="unfold_more" size={16} className="shrink-0 text-gray-400" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  {...NOTIFICATION_POPOVER_MOTION}
                  role="menu"
                  className="absolute top-[52px] right-0 z-50 w-[220px] rounded-2xl border border-[#e8e0d6] bg-white p-2 shadow-xl dark:border-[#3d3732] dark:bg-[#231f1c]"
                >
                  <div className="px-2.5 py-2 border-b border-[#f0ebe4] dark:border-[#2a2623] mb-1">
                    <p className="text-[12px] font-semibold text-gray-900 dark:text-gray-100">Carlos Rodríguez</p>
                    <p className="text-[11px] text-gray-400">Plan Free</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-medium text-[#9a0002] hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                  >
                    <MaterialSymbol icon="logout" size={18} />
                    Desconectar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
            className="absolute inset-0 z-30 flex h-[64px] items-center gap-2 bg-[#faf6f1] px-4 dark:bg-[#1c1917] md:hidden"
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
