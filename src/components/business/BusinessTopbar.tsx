"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { NOTIFICATION_POPOVER_MOTION, SkiperSunMoon, startThemeTransitionFrom } from "@/components/Navbar";
import { SmoothInput } from "@/components/SmoothInput";
import { cn } from "@/lib/utils";
import { MOCK_BUSINESS } from "@/lib/mockData";

const NOTIFICATIONS = [
  { emoji: "🛒", title: "Nuevo pedido #1042 de Juan Pérez", time: "Hace 2 min" },
  { emoji: "⭐", title: "Recibiste una reseña de 5 estrellas", time: "Hace 20 min" },
  { emoji: "📦", title: "Stock bajo: Torta Oreo", time: "Hace 1 hora" },
];

/** Plain bordered circle icon button — minimal style matching the reference topbar. */
function TopbarIconBtn({
  onClick,
  children,
  className,
  btnRef,
  "aria-label": ariaLabel,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  btnRef?: React.RefObject<HTMLButtonElement | null>;
  "aria-label"?: string;
}) {
  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
        "bg-white dark:bg-[#2a2623] border border-gray-200 dark:border-[#3d3732] shadow-sm",
        "text-gray-500 dark:text-gray-400 hover:text-[#9a0002] hover:border-[#9a0002]/30",
        "transition-all duration-200 ease-in-out cursor-pointer",
        className
      )}
    >
      {children}
    </button>
  );
}

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
    <header className="sticky top-0 z-20 h-[72px] flex-shrink-0 flex items-center justify-between gap-3 px-4 md:px-7 bg-[#faf6f1]/90 dark:bg-[#1c1917]/90 backdrop-blur-md border-b border-gray-100 dark:border-[#3d3732] relative">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] transition-colors cursor-pointer flex-shrink-0"
        >
          <MaterialSymbol icon="menu" size={20} />
        </button>

        {/* Desktop searchbar — wide pill, minimal fill (reference style) */}
        <div className="hidden md:flex items-center gap-2.5 bg-white dark:bg-[#2a2623] border border-gray-200 dark:border-[#3d3732] focus-within:border-[#9a0002]/40 rounded-full h-11 px-4.5 w-full max-w-[340px] shadow-sm transition-colors">
          <MaterialSymbol icon="search" size={17} className="text-gray-400 flex-shrink-0" />
          <SmoothInput placeholder="Buscar en el panel..." className="text-xs font-semibold text-gray-700 dark:text-gray-300" />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* Mobile search trigger */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Buscar"
          className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] transition-colors cursor-pointer"
        >
          <MaterialSymbol icon="search" size={18} />
        </button>

        {/* Theme toggle — desktop only, plain bordered circle */}
        <TopbarIconBtn onClick={toggleTheme} btnRef={themeBtnRef} aria-label={isDark ? "Modo claro" : "Modo oscuro"} className="hidden md:flex">
          <SkiperSunMoon isDark={isDark} color="currentColor" />
        </TopbarIconBtn>

        {/* Notifications */}
        <div className="relative">
          <TopbarIconBtn onClick={handleToggleNotif} aria-label="Notificaciones">
            <MaterialSymbol icon="notifications" size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#ffeb3b] text-[#6b0001] text-[9px] font-black rounded-full flex items-center justify-center px-[4px] ring-2 ring-[#faf6f1] dark:ring-[#1c1917]">
                {unreadCount}
              </span>
            )}
          </TopbarIconBtn>

          <AnimatePresence>
            {showNotifDropdown && (
              <motion.div
                {...NOTIFICATION_POPOVER_MOTION}
                className="absolute top-[48px] right-0 w-[270px] bg-[#faf6f1]/96 dark:bg-[#231f1c]/96 border border-white/40 dark:border-[#3d3732] rounded-[20px] p-4 shadow-2xl backdrop-blur-md z-50 text-gray-800 dark:text-[#ece8e2]"
              >
                <div className="space-y-2">
                  {NOTIFICATIONS.map((n, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#ede4d9]/60 dark:bg-[#2a2623] hover:bg-[#ede4d9] dark:hover:bg-[#302c28]/60 transition-colors cursor-pointer flex gap-2 text-left"
                    >
                      <span className="text-base select-none">{n.emoji}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold leading-tight text-gray-800 dark:text-[#d4cfc9]">{n.title}</span>
                        <span className="text-[8px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vertical divider — matches reference's icons | avatar separation */}
        <div className="hidden md:block h-7 w-px bg-gray-200 dark:bg-[#3d3732] mx-0.5" />

        {/* Avatar + user name (logged-in user, NOT the business) */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#9a0002] to-[#6b0001] flex items-center justify-center text-white font-extrabold text-xs shadow-sm flex-shrink-0 ring-2 ring-white dark:ring-[#2a2623]">
            CR
          </div>
          <span className="hidden md:inline text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[140px]">
            Carlos Rodríguez
          </span>
        </div>
      </div>

      {/* Mobile search overlay */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute inset-0 h-[72px] bg-[#faf6f1] dark:bg-[#1c1917] flex items-center gap-2 px-4 z-30"
          >
            <MaterialSymbol icon="search" size={16} className="text-gray-400 flex-shrink-0" />
            <SmoothInput autoFocus placeholder="Buscar en el panel..." className="flex-1 text-xs font-bold text-gray-700 dark:text-gray-300" />
            <button
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Cerrar búsqueda"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] transition-colors cursor-pointer flex-shrink-0"
            >
              <MaterialSymbol icon="close" size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
