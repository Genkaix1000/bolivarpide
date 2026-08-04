"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MaterialSymbol } from "@/components/ui/material-symbol";

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onSearchFocus: () => void;
  searchQuery: string;
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  savedAddresses: Array<{ id: string; name: string }>;
}

/** Shared notification popover animation for desktop navbar and mobile header. */
export const NOTIFICATION_POPOVER_MOTION = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
  transition: { duration: 0.2 },
} as const;

// ─── Shared helper: origin-aware clip-path view-transition ────────────────────
export function startThemeTransitionFrom(el: HTMLElement | null, toDark: boolean) {
  const applyClass = () => {
    if (toDark) document.documentElement.classList.add("dark");
    else        document.documentElement.classList.remove("dark");
  };
  let cx = "50%", cy = "50%";
  if (el) {
    const r = el.getBoundingClientRect();
    cx = `${Math.round(r.left + r.width  / 2)}px`;
    cy = `${Math.round(r.top  + r.height / 2)}px`;
  }
  const styleId = "theme-vt";
  let style = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }
  style.textContent = `
    ::view-transition-group(root) {
      animation-duration: 1.2s;
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }
    ::view-transition-new(root) {
      animation: vt-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
      mix-blend-mode: normal;
    }
    ::view-transition-old(root) {
      animation: none;
      z-index: -1;
      mix-blend-mode: normal;
    }
    @keyframes vt-in {
      from { clip-path: circle(0px at ${cx} ${cy}); }
      to   { clip-path: circle(200vmax at ${cx} ${cy}); }
    }
  `;
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    (document as Document & { startViewTransition: (cb: () => void) => void })
      .startViewTransition(applyClass);
  } else {
    applyClass();
  }
}

// ─── Cherry Cola action button (shared style: theme toggle, bell) ─────────────
export function CherryBtn({
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
        "relative flex-shrink-0 h-[36px] rounded-full flex items-center justify-center",
        "bg-[#9a0002] text-white shadow-md shadow-[#9a0002]/30",
        "hover:brightness-110 active:brightness-90",
        "transition-all duration-300 ease-in-out cursor-pointer",
        className,
      )}
    >
      {children}
    </button>
  );
}

export default function Navbar({
  currentTab,
  onTabChange,
  onSearchFocus,
  searchQuery,
  selectedAddressId,
  setSelectedAddressId,
  savedAddresses,
}: NavbarProps) {
  const navItems = React.useMemo(() => [
    { id: "home",     label: "Inicio",     icon: "home" },
    { id: "discover", label: "Explorar",   icon: "explore" },
    { id: "cart",     label: "Mi Carrito", icon: "shopping_cart" },
    { id: "profile",  label: "Mi Perfil",  icon: "badge" },
  ], []);

  const handleTabChange = useCallback((id: string) => {
    onTabChange(id);
  }, [onTabChange]);

  const [showDashboard, setShowDashboard] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);

  const currentAddressName =
    savedAddresses.find(a => a.id === selectedAddressId)?.name || savedAddresses[0].name;

  return (
    <div className="fixed inset-x-0 top-0 z-50 md:sticky">
      <header className="relative flex h-16 items-center gap-2 border-b border-gray-100 bg-[#faf6f1]/90 px-4 backdrop-blur-md dark:border-[#3d3732] dark:bg-[#1c1917]/90 md:h-[72px] md:gap-4 md:px-7">
        <button
          type="button"
          onClick={() => {
            setShowDashboard(true);
            setShowAddresses(false);
          }}
          aria-label="Abrir menú"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-[#ede4d9] dark:text-gray-400 dark:hover:bg-[#2a2623] md:hidden"
        >
          <MaterialSymbol icon="menu" size={20} />
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("home")}
          aria-label="Ir al inicio"
          className="hidden shrink-0 items-center gap-2 rounded-xl transition-transform active:scale-95 md:flex"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-base font-black text-white shadow-sm">B</span>
          <span className="text-base font-extrabold tracking-tight text-gray-800 dark:text-gray-100">BolivarPide</span>
        </button>

        <button
          type="button"
          onClick={onSearchFocus}
          className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 text-left shadow-sm transition-colors hover:border-[#9a0002]/30 dark:border-[#3d3732] dark:bg-[#2a2623] md:h-11 md:px-4.5"
        >
          <MaterialSymbol icon="search" size={17} className="shrink-0 text-[#9a0002]" />
          <span className="truncate text-[11px] font-medium text-gray-400 md:text-xs">
            {searchQuery || 'Buscar "comida", locales...'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("cart")}
          aria-label="Mi carrito"
          className={cn(
            "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors bg-white dark:bg-[#2a2623] shadow-sm",
            currentTab === "cart"
              ? "border-2 border-[#9a0002] text-[#9a0002] ring-1 ring-[#9a0002]/30"
              : "border border-gray-200 dark:border-[#3d3732] text-gray-700 dark:text-gray-300 hover:text-[#9a0002] hover:border-[#9a0002]/30",
          )}
        >
          <MaterialSymbol icon="shopping_cart" size={17} fill={currentTab === "cart"} />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#ffeb3b] ring-[1.5px] ring-[#faf6f1] dark:ring-[#1c1917]" />
        </button>

        <button
          type="button"
          onClick={() => {
            setShowDashboard((open) => !open);
            setShowAddresses(false);
          }}
          aria-label="Abrir menú"
          aria-expanded={showDashboard}
          className={cn(
            "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2 py-1 transition-colors bg-white dark:bg-[#2a2623] shadow-sm border",
            showDashboard
              ? "border-2 border-[#9a0002] text-[#9a0002]"
              : "border-gray-200 dark:border-[#3d3732] text-gray-700 dark:text-gray-300 hover:border-[#9a0002]/40",
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9a0002] text-[9px] font-black text-white">SA</span>
          <MaterialSymbol icon="expand_more" size={15} className={cn("transition-transform", showDashboard && "rotate-180")} />
        </button>

        {typeof document !== "undefined" && createPortal(
          <AnimatePresence>
            {showDashboard && (
            <>
              <motion.button
                type="button"
                aria-label="Cerrar menú"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDashboard(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
              />
              <motion.aside
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-y-0 left-0 z-[60] flex w-[260px] flex-col overflow-y-auto bg-[#faf6f1] p-3 shadow-2xl dark:bg-[#1c1917] md:inset-y-auto md:left-auto md:right-7 md:top-[80px] md:w-[280px] md:rounded-[22px] md:border md:border-white/50 md:bg-[#faf6f1]/98 md:backdrop-blur-md dark:md:border-[#3d3732] dark:md:bg-[#1c1917]/98"
              >
              <div className="mb-3 flex items-center justify-between border-b border-gray-200/60 pb-3 dark:border-[#3d3732] px-2">
                <button
                  type="button"
                  onClick={() => handleTabChange("home")}
                  className="flex items-center gap-2.5 overflow-hidden"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-xs font-black text-white shadow-sm">SA</span>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-xs font-extrabold text-gray-800 dark:text-gray-100">St. Abigail</p>
                    <p className="truncate text-[10px] text-gray-400">client.abigail@delivery.com</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDashboard(false)}
                  aria-label="Cerrar menú"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <MaterialSymbol icon="close" size={18} />
                </button>
              </div>

              <nav className="flex flex-col gap-1 px-1">
                {navItems.map(({ id, label, icon }) => {
                  const isActive = currentTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        handleTabChange(id);
                        setShowDashboard(false);
                      }}
                      className={cn(
                        "group relative flex h-11 items-center gap-3 rounded-xl px-3.5 border-l-2 my-0.5 transition-all duration-200 cursor-pointer text-sm font-bold tracking-tight text-left",
                        isActive
                          ? "bg-[#9a0002]/10 text-[#9a0002] font-bold border-[#9a0002]"
                          : "text-gray-500 dark:text-gray-400 hover:bg-[#ede4d9]/60 dark:hover:bg-[#2a2623] hover:text-gray-800 dark:hover:text-gray-200 border-transparent",
                      )}
                    >
                      <MaterialSymbol icon={icon} size={20} fill={isActive} className="flex-shrink-0" />
                      <span className="flex-1">{label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-3 border-t border-gray-200/60 pt-2 dark:border-[#3d3732] px-1">
                <button
                  type="button"
                  onClick={() => setShowAddresses((open) => !open)}
                  className="flex w-full h-10 items-center gap-2.5 rounded-xl px-3 text-left text-xs font-bold text-gray-600 transition-colors hover:bg-[#ede4d9]/60 dark:text-gray-300 dark:hover:bg-[#2a2623]"
                >
                  <MaterialSymbol icon="location_home" size={18} className="text-[#9a0002]" />
                  <span className="min-w-0 flex-1 truncate">{currentAddressName}</span>
                  <MaterialSymbol icon="expand_more" size={16} className={cn("transition-transform", showAddresses && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {showAddresses && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1 overflow-hidden px-1 pt-1"
                    >
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(address.id);
                            setShowAddresses(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium transition-colors border-l-2",
                            selectedAddressId === address.id
                              ? "bg-[#9a0002]/10 text-[#9a0002] border-[#9a0002] font-bold"
                              : "text-gray-500 hover:bg-[#ede4d9]/60 dark:text-gray-400 dark:hover:bg-[#2a2623] border-transparent",
                          )}
                        >
                          <MaterialSymbol icon="location_on" size={14} fill={selectedAddressId === address.id} />
                          <span className="truncate">{address.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-2 flex h-10 items-center justify-between rounded-xl px-3">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Apariencia</span>
                  <ThemeToggleNavBtn className="h-8 w-8" />
                </div>
              </div>
              </motion.aside>
            </>
            )}
          </AnimatePresence>,
          document.body,
        )}
      </header>
    </div>
  );
}

// ─── Skiper sun/moon toggle (shared design) ───────────────────────────────────
function ThemeToggleNavBtn({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setIsDark(document.documentElement.classList.contains("dark")); }, []);

  const toggle = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    startThemeTransitionFrom(btnRef.current, next);
  }, [isDark]);

  return (
    <CherryBtn onClick={toggle} btnRef={btnRef} aria-label={isDark ? "Modo claro" : "Modo oscuro"} className={cn("w-[36px] overflow-hidden", className)}>
      <SkiperSunMoon isDark={isDark} />
    </CherryBtn>
  );
}

// ─── Skiper clip-path SVG (reused in mobile too) ──────────────────────────────
export function SkiperSunMoon({
  isDark,
  color = "white",
  clipId = "skipper-clip",
}: {
  isDark: boolean;
  color?: string;
  clipId?: string;
}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill={color} strokeLinecap="round" viewBox="0 0 32 32" className="w-[18px] h-[18px]">
      <clipPath id={clipId}>
        <motion.path
          initial={false}
          animate={{ y: isDark ? 10 : 0, x: isDark ? -12 : 0 }}
          transition={{ ease: "easeInOut", duration: 0.45 }}
          d="M0-5h30a1 1 0 0 0 9 13v24H0Z"
        />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <circle cx="16" cy="16" r={isDark ? 10 : 8} />
        <motion.g
          initial={false}
          animate={{ rotate: isDark ? -100 : 0, scale: isDark ? 0.5 : 1, opacity: isDark ? 0 : 1 }}
          transition={{ ease: "easeInOut", duration: 0.45 }}
          stroke={color}
          strokeWidth="1.5"
          style={{ transformOrigin: "16px 16px" }}
        >
          <path d="M16 5.5v-4" /><path d="M16 30.5v-4" />
          <path d="M1.5 16h4" />  <path d="M26.5 16h4" />
          <path d="m23.4 8.6 2.8-2.8" /> <path d="m5.7 26.3 2.9-2.9" />
          <path d="m5.8 5.8 2.8 2.8" />  <path d="m23.4 23.4 2.9 2.9" />
        </motion.g>
      </g>
    </svg>
  );
}