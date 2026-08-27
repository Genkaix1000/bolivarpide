"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useUserProfile } from "@/components/UserProfileProvider";
import { UserAvatarView } from "@/components/UserAvatarView";

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onSearchFocus: () => void;
  searchQuery: string;
  locationLabel?: string;
  savedAddresses?: Array<{ id: string; name: string }>;
  selectedAddressId?: string;
  onSelectAddress?: (id: string) => void;
  showLocationDropdown?: boolean;
  onLocationClick?: () => void;
}

/** Shared notification popover animation for desktop navbar and mobile header. */
export const NOTIFICATION_POPOVER_MOTION = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
  transition: { duration: 0.2 },
} as const;

const DRAWER_TABS = [
  { id: "home", label: "Inicio", icon: "home" },
  { id: "profile", label: "Mi Perfil", icon: "badge" },
] as const;

const MOCK_NOTIFICATIONS = [
  { emoji: "🛵", title: "Tu pedido de Burger Beef está en camino", time: "Hace 5 min" },
  { emoji: "🎁", title: "¡Tienes un cupón de 15% de descuento!", time: "Hace 1 hora" },
  { emoji: "🍕", title: "Tu pizza favorita de Pizza Hut tiene 20% OFF", time: "Hace 3 horas" },
];

// ─── Shared helper: origin-aware clip-path view-transition ────────────────────
export function startThemeTransitionFrom(el: HTMLElement | null, toDark: boolean) {
  const applyClass = () => {
    if (toDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };
  let cx = "50%", cy = "50%";
  if (el) {
    const r = el.getBoundingClientRect();
    cx = `${Math.round(r.left + r.width / 2)}px`;
    cy = `${Math.round(r.top + r.height / 2)}px`;
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

// ─── Cherry Cola action button (shared: landing + negocio theme/bell) ─────────
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
        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
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
  locationLabel,
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  showLocationDropdown,
  onLocationClick,
}: NavbarProps) {
  const handleTabChange = useCallback((id: string) => {
    onTabChange(id);
  }, [onTabChange]);

  const { profile, resetProfile } = useUserProfile();
  const [showDashboard, setShowDashboard] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const shortLocation = locationLabel ? (locationLabel.split(",")[0] || locationLabel) : "St. Abigail";

  const notificationPanel = (
    <motion.div
      {...NOTIFICATION_POPOVER_MOTION}
      className="absolute top-[48px] right-0 z-50 w-[270px] rounded-2xl border border-[#e8e0d6] bg-white p-3 shadow-xl dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-[#ece8e2]"
    >
      <div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
        {MOCK_NOTIFICATIONS.map((n, idx) => (
          <div
            key={idx}
            className="flex cursor-pointer gap-2 rounded-xl bg-[#f5f1eb] p-2.5 text-left transition-colors hover:bg-[#ede4d9] dark:bg-[#2a2623] dark:hover:bg-[#302c28]/60"
          >
            <span className="select-none text-base">{n.emoji}</span>
            <div className="flex min-w-0 flex-col">
              <span className="text-[12px] font-semibold leading-tight text-gray-800 dark:text-[#d4cfc9]">{n.title}</span>
              <span className="mt-0.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">{n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-x-0 top-0 z-50 md:sticky">
      <header className="relative h-[64px] border-b border-[#e8e0d6] bg-[#faf6f1]/90 px-4 backdrop-blur-md dark:border-[#3d3732] dark:bg-[#1c1917]/90 md:px-8">
        <div className="mx-auto flex h-full w-full max-w-[1040px] items-center gap-3">
          {/* Left cluster: brand · location · search · (mobile bell) */}
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => setShowDashboard(true)}
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
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-sm font-bold text-white shadow-sm">B</span>
              <span className="text-[15px] font-bold tracking-tight text-gray-900 dark:text-gray-100">BolivarPide</span>
            </button>

            {/* Location selector — popover under the button, no blur scrim */}
            {locationLabel && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={onLocationClick}
                  className={cn(
                    "flex h-10 items-center gap-1.5 rounded-xl border border-[#e8e0d6] dark:border-[#3d3732] bg-white dark:bg-[#2a2623] px-3 transition-all hover:border-[#9a0002]/35 text-left cursor-pointer",
                    showLocationDropdown && "ring-2 ring-[#9a0002]/25 border-[#9a0002]"
                  )}
                >
                  <MaterialSymbol icon="near_me" size={14} className="text-[#9a0002] shrink-0" fill={showLocationDropdown} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 leading-none">Ubicación</span>
                    <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[95px] sm:max-w-[140px] leading-tight">
                      {shortLocation}
                    </span>
                  </div>
                  <MaterialSymbol icon="expand_more" size={14} className={cn("text-gray-400 shrink-0 transition-transform duration-200", showLocationDropdown && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {showLocationDropdown && savedAddresses && savedAddresses.length > 0 && (
                    <motion.div
                      {...NOTIFICATION_POPOVER_MOTION}
                      className="absolute left-0 top-[48px] z-50 w-[min(290px,calc(100vw-2rem))] rounded-xl border border-[#e8e0d6] bg-white p-3 shadow-xl dark:border-[#3d3732] dark:bg-[#231f1c]"
                    >
                      <div className="space-y-1.5">
                        {savedAddresses.map((addr) => {
                          const isSelected = addr.id === selectedAddressId;
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => onSelectAddress?.(addr.id)}
                              className={cn(
                                "flex w-full cursor-pointer items-center justify-between rounded-xl p-2.5 text-left transition-all duration-200",
                                isSelected
                                  ? "border border-[#9a0002] bg-[#9a0002]/5 font-semibold text-[#9a0002]"
                                  : "border border-[#e8e0d6] text-gray-700 hover:bg-[#f5f1eb] dark:border-[#3d3732] dark:text-gray-300 dark:hover:bg-[#2a2623]",
                              )}
                            >
                              <span className="truncate text-[12px]">{addr.name}</span>
                              {isSelected && <MaterialSymbol icon="check" size={14} className="shrink-0 text-[#9a0002]" />}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          alert("Agregar dirección");
                          onLocationClick?.();
                        }}
                        className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#e8e0d6] bg-[#f5f1eb] py-2.5 text-[11px] font-semibold text-gray-600 transition-all hover:border-[#9a0002]/40 hover:text-[#9a0002] dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-gray-300"
                      >
                        <MaterialSymbol icon="add" size={14} />
                        <span>Agregar nueva dirección</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button
              type="button"
              onClick={onSearchFocus}
              className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[#e8e0d6] bg-white px-3.5 text-left transition-colors hover:border-[#9a0002]/35 dark:border-[#3d3732] dark:bg-[#2a2623] md:max-w-sm"
            >
              <MaterialSymbol icon="search" size={17} className="shrink-0 text-gray-400" />
              <span className="truncate text-[13px] font-medium text-gray-400">
                {searchQuery || "Buscar comida..."}
              </span>
              <kbd className="ml-auto hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#f5f1eb] dark:bg-[#1c1917] text-[10px] font-semibold text-gray-400 border border-[#e8e0d6] dark:border-[#3d3732]">
                ⌘F
              </kbd>
            </button>

            {/* Mobile: notifications only — profile lives in the drawer */}
            <div className="relative shrink-0 md:hidden">
              <CherryBtn
                onClick={() => setShowNotifications((o) => !o)}
                aria-label="Notificaciones"
                className="h-10 w-10"
              >
                <MaterialSymbol icon="notifications" size={17} className="text-white" />
                {!showNotifications && (
                  <span className="absolute -top-1.5 -right-1.5 z-10 h-2.5 w-2.5 animate-pulse rounded-full bg-[#ffeb3b] ring-[1.5px] ring-[#9a0002]" />
                )}
              </CherryBtn>
              <AnimatePresence>{showNotifications && notificationPanel}</AnimatePresence>
            </div>
          </div>

          {/* Desktop right cluster */}
          <div className="relative z-50 hidden shrink-0 items-center gap-2.5 md:flex">
            <ThemeToggleNavBtn clipId="nav-theme-desk" />

            <div className="relative">
              <CherryBtn
                onClick={() => setShowNotifications((o) => !o)}
                aria-label="Notificaciones"
              >
                <MaterialSymbol icon="notifications" size={17} className="text-white" />
                {!showNotifications && (
                  <span className="absolute -top-1.5 -right-1.5 z-10 h-2.5 w-2.5 animate-pulse rounded-full bg-[#ffeb3b] ring-[1.5px] ring-[#9a0002]" />
                )}
              </CherryBtn>
              <AnimatePresence>{showNotifications && notificationPanel}</AnimatePresence>
            </div>

            <div className="mx-0.5 h-7 w-px bg-[#e8e0d6] dark:bg-[#3d3732]" />

            <button
              type="button"
              onClick={() => handleTabChange("profile")}
              aria-label="Mi perfil"
              className={cn(
                "relative flex items-center justify-center rounded-full transition-transform duration-200 cursor-pointer active:scale-95 hover:scale-108 p-0.5",
                currentTab === "profile" && "ring-2 ring-[#9a0002] ring-offset-2 ring-offset-[#faf6f1] dark:ring-offset-[#1c1917]",
              )}
            >
              <UserAvatarView avatar={profile.avatar} size="md" showFrame />
            </button>
          </div>

          {(showNotifications || showLocationDropdown) && (
            <button
              type="button"
              aria-label="Cerrar panel"
              className="fixed inset-x-0 bottom-0 top-[64px] z-40"
              onClick={() => {
                setShowNotifications(false);
                if (showLocationDropdown) onLocationClick?.();
              }}
            />
          )}
        </div>

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
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
                />
                <motion.aside
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-y-0 left-0 z-[60] flex w-[275px] flex-col overflow-y-auto bg-[#f5f1eb] p-3 shadow-2xl dark:bg-[#161412] md:hidden custom-scrollbar"
                >
                  <div className="mb-2 flex items-center justify-between border-b border-[#e8e0d6] px-1 pb-3 dark:border-[#3d3732]">
                    <button
                      type="button"
                      onClick={() => {
                        handleTabChange("profile");
                        setShowDashboard(false);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-xl text-left transition-colors hover:bg-[#ede4d9]/60 dark:hover:bg-[#2a2623] p-1"
                    >
                      <UserAvatarView avatar={profile.avatar} size="md" showFrame />
                      <div className="min-w-0 text-left">
                        <p className="truncate text-[14px] font-bold text-gray-900 dark:text-gray-100">{profile.name}</p>
                        <p className="truncate text-[11px] text-gray-400">{profile.email}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDashboard(false)}
                      aria-label="Cerrar menú"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#ede4d9] hover:text-gray-700 dark:hover:bg-[#2a2623]"
                    >
                      <MaterialSymbol icon="close" size={18} />
                    </button>
                  </div>

                  <nav className="flex flex-col gap-0.5 px-1">
                    <p className="px-3 mb-1 text-[11px] font-medium text-gray-400">General</p>
                    {DRAWER_TABS.map(({ id, label, icon }) => {
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
                            "my-0.5 flex h-10 cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-[13px] tracking-tight transition-all duration-200",
                            isActive
                              ? "bg-[#9a0002]/10 text-[#9a0002] font-semibold"
                              : "text-gray-500 hover:bg-[#ede4d9]/60 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-[#2a2623] dark:hover:text-gray-200 font-medium",
                          )}
                        >
                          <MaterialSymbol icon={icon} size={20} fill={isActive} className="flex-shrink-0" />
                          <span className="flex-1">{label}</span>
                        </button>
                      );
                    })}
                  </nav>

                  {/* Catchy Promotion Cards in Mobile Drawer */}
                  <div className="my-3 space-y-2.5 px-1">
                    {/* Card Comercio */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#9a0002] via-[#850002] to-[#450001] p-3.5 text-white shadow-md">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs flex items-center gap-1">
                          <span>🚀</span>
                          <span>Impulsá tus ventas</span>
                        </span>
                      </div>
                      <h5 className="text-[12px] font-bold text-white leading-tight">
                        ¿Tenés un comercio?
                      </h5>
                      <p className="text-[10px] text-white/80 mt-0.5 leading-snug">
                        Publicá tu carta y recibí pedidos directos por WhatsApp
                      </p>
                      <Link
                        href="/negocio/registro"
                        onClick={() => setShowDashboard(false)}
                        className="mt-2.5 block w-full py-1.5 px-2.5 bg-white text-[#9a0002] text-center text-[11px] font-bold rounded-xl shadow-xs hover:bg-gray-100 transition-all active:scale-95"
                      >
                        Adherir mi negocio →
                      </Link>
                    </div>

                    {/* Card Repartidor */}
                    <div className="relative overflow-hidden rounded-2xl bg-[#201c1a] dark:bg-[#231f1c] border border-amber-500/25 p-3.5 text-white shadow-sm">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <span>🛵</span>
                          <span>Ingresos flexibles</span>
                        </span>
                      </div>
                      <h5 className="text-[12px] font-bold text-gray-100 leading-tight">
                        ¿Querés repartir?
                      </h5>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                        Generá ingresos semanales con tus propios horarios
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          handleTabChange("profile");
                          setShowDashboard(false);
                        }}
                        className="mt-2.5 block w-full py-1.5 px-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 text-center text-[11px] font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
                      >
                        Sumarme como repartidor →
                      </button>
                    </div>
                  </div>

                  {/* Drawer Footer al fondo a la izquierda */}
                  <div className="mt-auto border-t border-[#e8e0d6] px-1 pt-2.5 space-y-1 dark:border-[#3d3732]">
                    <div className="flex h-9 items-center justify-between rounded-xl px-3">
                      <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">Apariencia</span>
                      <ThemeToggleNavBtn className="h-7 w-7" clipId="nav-theme-drawer" />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleTabChange("profile");
                        setShowDashboard(false);
                      }}
                      className="flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-[12px] font-medium text-gray-600 hover:bg-[#ede4d9]/70 dark:text-gray-400 dark:hover:bg-[#2a2623]"
                    >
                      <MaterialSymbol icon="settings" size={16} className="text-gray-400" />
                      <span>Configuración de cuenta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        resetProfile();
                        setShowDashboard(false);
                      }}
                      className="flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-[12px] font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <MaterialSymbol icon="logout" size={16} />
                      <span>Cerrar sesión</span>
                    </button>
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
function ThemeToggleNavBtn({ className = "", clipId = "skipper-clip" }: { className?: string; clipId?: string }) {
  const [isDark, setIsDark] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setIsDark(document.documentElement.classList.contains("dark")); }, []);

  const toggle = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    startThemeTransitionFrom(btnRef.current, next);
  }, [isDark]);

  return (
    <CherryBtn onClick={toggle} btnRef={btnRef} aria-label={isDark ? "Modo claro" : "Modo oscuro"} className={cn("overflow-hidden", className)}>
      <SkiperSunMoon isDark={isDark} clipId={clipId} />
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
