"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MaterialSymbol } from "@/components/ui/material-symbol";

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
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

  // ── Dropdown state ─────────────────────────────────────────────────────────
  const [showLocationDropdown,     setShowLocationDropdown]     = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifScrollState, setNotifScrollState] = useState({ isAtTop: true, isAtBottom: false });
  const notifScrollRef = useRef<HTMLDivElement>(null);

  const checkNotifScroll = () => {
    const c = notifScrollRef.current;
    if (!c) return;
    setNotifScrollState({
      isAtTop:    c.scrollTop <= 5,
      isAtBottom: c.scrollTop + c.clientHeight >= c.scrollHeight - 5,
    });
  };

  useEffect(() => {
    if (showNotificationDropdown) {
      setTimeout(checkNotifScroll, 100);
    }
  }, [showNotificationDropdown]);

  const currentAddressName =
    savedAddresses.find(a => a.id === selectedAddressId)?.name || savedAddresses[0].name;

  const notifications = [
    { emoji: "🛵", title: "Tu pedido de Burger Beef está en camino",      time: "Hace 5 min"   },
    { emoji: "🎁", title: "¡Tienes un cupón de 15% de descuento!",        time: "Hace 1 hora"  },
    { emoji: "🍕", title: "Tu pizza favorita de Pizza Hut tiene 20% OFF", time: "Hace 3 horas" },
    { emoji: "🛒", title: "Perfil completado: obtienes envío gratis",      time: "Hace 1 día"   },
    { emoji: "🍩", title: "¡Nuevo local! 'Dunkin Donuts' se ha unido",    time: "Hace 2 días"  },
  ];

  return (
    <>
      {/* Backdrop */}
      {(showNotificationDropdown || showLocationDropdown) && (
        <div
          className="hidden md:block fixed inset-0 z-45 bg-black/15 dark:bg-black/45 backdrop-blur-[2.5px]"
          onClick={() => { setShowNotificationDropdown(false); setShowLocationDropdown(false); }}
        />
      )}

      {/* ── Mobile Bottom Navbar pill ─────────────────────────────────────── */}

      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <nav className="w-[328px] h-[64px] bg-[#faf6f1]/92 dark:bg-[#1c1917]/92 border-[1.5px] border-white/60 dark:border-[#3d3732] rounded-[32px] penpot-shadow backdrop-blur-md flex items-center justify-between px-4">
          {navItems.map(({ id, label, icon }) => {
            const isActive = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={cn(
                  "flex items-center gap-1.5 transition-all duration-300 rounded-full h-[40px] px-3.5 select-none cursor-pointer overflow-hidden",
                  isActive
                    ? "bg-[#9a0002]/10 text-[#9a0002] font-extrabold"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent"
                )}
              >
                <MaterialSymbol
                  icon={icon}
                  fill={isActive}
                  size={18}
                  className={isActive ? "text-[#9a0002]" : ""}
                />
                <span className={cn(
                  "text-[11px] tracking-tight transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden",
                  isActive ? "w-auto opacity-100 max-w-[80px]" : "w-0 opacity-0 max-w-0 pointer-events-none"
                )}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Desktop Top Header ────────────────────────────────────────────── */}
      <div className="hidden md:block w-full px-6 pt-4 sticky top-0 z-50">
        <header className="max-w-[1040px] h-[64px] mx-auto bg-[#faf6f1]/92 dark:bg-[#1c1917]/92 border-[1.5px] border-white/60 dark:border-[#3d3732] rounded-[32px] penpot-shadow backdrop-blur-md flex items-center justify-between px-6 relative">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] flex items-center justify-center text-white font-black text-base shadow-sm">D</div>
            <span className="font-extrabold text-base tracking-tight text-gray-800 dark:text-gray-100">DeliveryLocal</span>
          </div>


          {/* Desktop Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ id, label, icon }) => {
              const isActive = currentTab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={cn(
                    "flex items-center gap-1.5 transition-all duration-300 rounded-full h-[40px] px-3.5 select-none cursor-pointer",
                    isActive
                      ? "bg-[#9a0002]/10 text-[#9a0002] font-extrabold"
                      : "text-gray-600 dark:text-gray-400 hover:text-[#9a0002] hover:bg-[#9a0002]/5"
                  )}
                >
                  <MaterialSymbol
                    icon={icon}
                    fill={isActive}
                    size={16}
                    className={isActive ? "text-[#9a0002]" : ""}
                  />
                  <span className="text-xs font-bold tracking-tight whitespace-nowrap">{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions: Location | Theme | Bell */}
          <div className="flex items-center gap-2.5 relative z-50">

            {/* Location */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowLocationDropdown(!showLocationDropdown);
                  setShowNotificationDropdown(false);
                }}
                 className={cn(
                    "transition-all duration-300 flex items-center justify-center gap-1.5 h-[36px] px-3 rounded-full cursor-pointer",
                    showLocationDropdown
                      ? "bg-[#faf6f1]/90 dark:bg-[#1c1917]/85 border border-white/50 dark:border-[#3d3732]/80 text-[#9a0002] shadow-md backdrop-blur-md"
                      : "bg-[#faf6f1]/40 hover:bg-[#9a0002]/10 dark:bg-white/5 dark:hover:bg-[#9a0002]/10 border border-white/20 dark:border-white/5 hover:border-[#9a0002]/20 text-gray-600 dark:text-gray-400 hover:text-[#9a0002] backdrop-blur-md"
                )}
              >
                <MaterialSymbol
                  icon="location_home"
                  size={15}
                  className={showLocationDropdown ? "text-[#9a0002]" : "text-gray-500 dark:text-gray-400"}
                />
                <span className="text-xs font-bold">
                  {showLocationDropdown ? "Ubicación" : currentAddressName.split(",")[0]}
                </span>
                <MaterialSymbol
                  icon="expand_more"
                  size={12}
                  className={showLocationDropdown ? "text-[#9a0002]" : "text-gray-400"}
                />
              </button>

              {showLocationDropdown && (
                <div className="absolute top-[42px] right-0 w-[290px] bg-[#faf6f1]/96 dark:bg-[#231f1c]/96 border border-white/40 dark:border-[#3d3732] rounded-[20px] p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-300 z-50 text-gray-800 dark:text-[#ece8e2]">
                  <div className="space-y-2">
                    {savedAddresses.map((addr, idx) => {
                      const isSelected = addr.id === selectedAddressId;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => { setSelectedAddressId(addr.id); setShowLocationDropdown(false); }}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 animate-in fade-in slide-in-from-top-3 duration-300 fill-mode-both",
                            idx === 0 ? "delay-75" : "delay-150",
                            isSelected
                              ? "border-[1.5px] border-[#9a0002] bg-[#9a0002]/5 text-[#9a0002] font-bold"
                              : "border border-[#ddd4c8] dark:border-[#3d3732]/60 hover:bg-[#ede4d9]/50 dark:hover:bg-[#302c28]/60 text-gray-700 dark:text-[#d4cfc9]"
                          )}
                        >
                          <span className="text-[11px] truncate max-w-[80%]">{addr.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); alert(`Editar: ${addr.name}`); }} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-[#d4cfc9] hover:bg-gray-100 dark:hover:bg-[#302c28] cursor-pointer">
                            <MaterialSymbol icon="edit" size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => { alert("Agregar dirección"); setShowLocationDropdown(false); }}
                    className="w-full py-2.5 bg-[#ede4d9] dark:bg-[#2a2623] hover:bg-[#9a0002]/5 hover:text-[#9a0002] text-[10px] font-bold rounded-xl border border-dashed border-[#ddd4c8] dark:border-[#3d3732] flex items-center justify-center gap-1.5 transition-all mt-3 cursor-pointer animate-in fade-in slide-in-from-top-3 duration-300 delay-200 fill-mode-both"
                  >
                    <MaterialSymbol icon="add" size={12} />
                    <span>Agregar nueva dirección</span>
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggleNavBtn />

            {/* Bell — Cherry Cola circle with expanding label */}
            <div className="relative">
              <CherryBtn
                onClick={() => { setShowNotificationDropdown(!showNotificationDropdown); setShowLocationDropdown(false); }}
                aria-label="Notificaciones"
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  showNotificationDropdown ? "gap-1.5 px-3.5" : "w-[36px]"
                )}
              >
                <MaterialSymbol icon="notifications" size={15} className="text-white" />
                <span className={cn(
                  "text-xs font-bold tracking-tight transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden",
                  showNotificationDropdown ? "w-auto opacity-100 max-w-[100px]" : "w-0 opacity-0 max-w-0"
                )}>
                  Notificaciones
                </span>
                {!showNotificationDropdown && (
                  <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-[#ffeb3b] rounded-full ring-[1.5px] ring-[#9a0002] animate-pulse z-10" />
                )}
              </CherryBtn>

              <AnimatePresence>
                {showNotificationDropdown && (
                  <motion.div
                    {...NOTIFICATION_POPOVER_MOTION}
                    className="absolute top-[44px] right-0 w-[270px] bg-[#faf6f1]/96 dark:bg-[#231f1c]/96 border border-white/40 dark:border-[#3d3732] rounded-[20px] p-4 shadow-2xl backdrop-blur-md z-50 text-gray-800 dark:text-[#ece8e2]"
                  >
                    <div className="relative w-full">
                      <div className={cn("absolute top-0 left-0 right-[5px] h-6 bg-gradient-to-b from-[#faf6f1] dark:from-[#231f1c] to-transparent pointer-events-none z-10 transition-opacity duration-300", notifScrollState.isAtTop ? "opacity-0" : "opacity-100")} />
                      <div className={cn("absolute bottom-0 left-0 right-[5px] h-6 bg-gradient-to-t from-[#faf6f1] dark:from-[#231f1c] to-transparent pointer-events-none z-10 transition-opacity duration-300", notifScrollState.isAtBottom ? "opacity-0" : "opacity-100")} />
                      <div ref={notifScrollRef} onScroll={checkNotifScroll} className="max-h-[220px] overflow-y-auto custom-scrollbar pr-1.5 space-y-2">
                        {notifications.map((n, idx) => (
                          <div key={idx} className={cn("p-2.5 rounded-xl bg-[#ede4d9]/60 dark:bg-[#2a2623] hover:bg-[#ede4d9] dark:hover:bg-[#302c28]/60 transition-colors cursor-pointer flex gap-2 text-left animate-in fade-in slide-in-from-top-3 duration-300 fill-mode-both", idx === 0 ? "delay-75" : idx === 1 ? "delay-150" : "delay-200")}>
                            <span className="text-base select-none">{n.emoji}</span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold leading-tight text-gray-800 dark:text-[#d4cfc9]">{n.title}</span>
                              <span className="text-[8px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{n.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
      </div>
    </>
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