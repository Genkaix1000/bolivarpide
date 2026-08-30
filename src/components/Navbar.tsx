"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useUserProfile } from "@/components/UserProfileProvider";
import { useCart } from "@/components/CartProvider";
import { UserAvatarView } from "@/components/UserAvatarView";
import { CockpitUserProfileBar } from "@/components/profile/CockpitUserProfileBar";
import { LogoutNavRail } from "@/components/shared/LogoutNavRail";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import {
  NotificationPopover,
  NOTIFICATION_POPOVER_MOTION,
} from "@/components/notifications/NotificationPopover";
import { useNotifications } from "@/hooks/useNotifications";
import type { UserAddressSummary } from "@/lib/addresses/types";

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onSearchFocus: () => void;
  searchQuery: string;
  locationLabel?: string;
  savedAddresses?: UserAddressSummary[];
  selectedAddressId?: string;
  onSelectAddress?: (id: string) => void;
  onEditAddress?: (id: string) => void;
  onAddAddress?: () => void;
  maxAddresses?: number;
  showLocationDropdown?: boolean;
  onLocationClick?: () => void;
}

/** @deprecated Import from `@/components/notifications/NotificationPopover` */
export { NOTIFICATION_POPOVER_MOTION } from "@/components/notifications/NotificationPopover";

const DRAWER_TABS = [
  { id: "home", label: "Inicio", icon: "home" },
  { id: "profile", label: "Mi Perfil", icon: "badge" },
] as const;

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
  onEditAddress,
  onAddAddress,
  maxAddresses = 3,
  showLocationDropdown,
  onLocationClick,
}: NavbarProps) {
  const { profile, isAuthenticated, hasActiveBusiness, logout } = useUserProfile();
  const { activeOrder } = useCart();
  const handleTabChange = useCallback((id: string) => {
    if (id === "profile" && !isAuthenticated) return;
    onTabChange(id);
  }, [onTabChange, isAuthenticated]);

  const [showDashboard, setShowDashboard] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const drawerFooterRef = useRef<HTMLDivElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { items: notifications, unreadCount, markRead } = useNotifications({
    enabled: isAuthenticated,
  });

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

  useEffect(() => {
    if (!showDashboard) setLogoutConfirm(false);
  }, [showDashboard]);

  async function handleLogout() {
    setShowUserMenu(false);
    setShowDashboard(false);
    setLogoutConfirm(false);
    await logout();
  }

  const shortLocation = locationLabel
    ? locationLabel.split(",")[0] || locationLabel
    : "Elegí dirección";

  const notificationPanel = (
    <NotificationPanel
      items={notifications}
      variant="customer"
      activeOrder={activeOrder}
      onMarkRead={markRead}
      onClose={() => setShowNotifications(false)}
      settingsHref="/?tab=profile&section=notifications"
    />
  );

  const hasOrderNotification = unreadCount > 0 || Boolean(activeOrder);

  return (
    <div className="fixed inset-x-0 top-0 z-50 md:sticky">
      <header className="relative h-[64px] border-b border-[#e8e0d6] bg-[#faf6f1]/90 px-4 backdrop-blur-md dark:border-[#3d3732] dark:bg-[#1c1917]/90 md:px-8">
        <div className="mx-auto flex h-full w-full max-w-[1040px] items-center gap-3 md:gap-5">
          {/* ── Left: menu (mobile) + brand + location ── */}
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => setShowDashboard(true)}
              aria-label="Abrir menú"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-[#ede4d9] dark:text-gray-400 dark:hover:bg-[#2a2623] md:hidden"
            >
              <MaterialSymbol icon="menu" size={20} />
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("home")}
              aria-label="Ir al inicio"
              className="flex shrink-0 items-center gap-2 rounded-xl transition-transform active:scale-95"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-sm font-bold text-white shadow-sm md:h-10 md:w-10">B</span>
              <span
                className={cn(
                  "hidden text-[15px] font-bold tracking-tight text-gray-900 dark:text-gray-100 md:inline",
                  isAuthenticated && locationLabel && "md:hidden lg:inline",
                )}
              >
                BolivarPide
              </span>
            </button>

            {isAuthenticated && locationLabel && (
              <div className="relative hidden shrink-0 md:block">
                <button
                  type="button"
                  onClick={onLocationClick}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-xl border border-[#e8e0d6] bg-white px-3.5 transition-all hover:border-[#9a0002]/35 text-left cursor-pointer dark:border-[#3d3732] dark:bg-[#2a2623]",
                    showLocationDropdown && "ring-2 ring-[#9a0002]/25 border-[#9a0002]",
                  )}
                >
                  <MaterialSymbol icon="near_me" size={15} className="shrink-0 text-[#9a0002]" fill={showLocationDropdown} />
                  <div className="flex min-w-0 flex-col">
                    <span className="text-[10px] font-medium leading-none text-gray-400 dark:text-gray-500">Ubicación</span>
                    <span className="max-w-[100px] truncate text-[12px] font-semibold leading-tight text-gray-800 dark:text-gray-200 lg:max-w-[140px]">
                      {shortLocation}
                    </span>
                  </div>
                  <MaterialSymbol
                    icon="expand_more"
                    size={15}
                    className={cn("shrink-0 text-gray-400 transition-transform duration-200", showLocationDropdown && "rotate-180")}
                  />
                </button>

                <AnimatePresence>
                  {showLocationDropdown && savedAddresses && savedAddresses.length > 0 && (
                    <motion.div
                      {...NOTIFICATION_POPOVER_MOTION}
                      className="absolute left-0 top-[48px] z-50 w-[min(310px,calc(100vw-2rem))] rounded-xl border border-[#e8e0d6] bg-white p-3 shadow-xl dark:border-[#3d3732] dark:bg-[#231f1c]"
                    >
                      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        Mis direcciones
                      </p>
                      <div className="space-y-1.5">
                        {savedAddresses.map((addr) => {
                          const isSelected = addr.id === selectedAddressId;
                          return (
                            <div
                              key={addr.id}
                              className={cn(
                                "flex items-center gap-2 rounded-xl border p-2 transition-all duration-200",
                                isSelected
                                  ? "border-[#9a0002] bg-[#9a0002]/5"
                                  : "border-[#e8e0d6] dark:border-[#3d3732]",
                              )}
                            >
                              <button
                                type="button"
                                aria-label={isSelected ? "Dirección seleccionada" : "Seleccionar dirección"}
                                onClick={() => onSelectAddress?.(addr.id)}
                                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition"
                                style={{
                                  borderColor: isSelected ? "#9a0002" : "#d6d3d1",
                                  background: isSelected ? "#9a0002" : "transparent",
                                }}
                              >
                                {isSelected && (
                                  <MaterialSymbol icon="check" size={14} className="text-white" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => onSelectAddress?.(addr.id)}
                                className="min-w-0 flex-1 cursor-pointer truncate text-left text-[12px] font-semibold text-gray-800 dark:text-gray-200"
                              >
                                {addr.label}
                              </button>
                              <button
                                type="button"
                                aria-label="Editar dirección"
                                onClick={() => {
                                  onEditAddress?.(addr.id);
                                  onLocationClick?.();
                                }}
                                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#f5f1eb] hover:text-[#9a0002] dark:hover:bg-[#2a2623]"
                              >
                                <MaterialSymbol icon="edit" size={15} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {savedAddresses.length < maxAddresses ? (
                        <button
                          type="button"
                          onClick={() => {
                            onAddAddress?.();
                            onLocationClick?.();
                          }}
                          className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#e8e0d6] bg-[#f5f1eb] py-2.5 text-[11px] font-semibold text-gray-600 transition-all hover:border-[#9a0002]/40 hover:text-[#9a0002] dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-gray-300"
                        >
                          <MaterialSymbol icon="add" size={14} />
                          <span>Agregar nueva dirección</span>
                        </button>
                      ) : (
                        <p className="mt-2 px-1 text-center text-[10px] text-gray-400">
                          Máximo {maxAddresses} direcciones
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── Center: search ── */}
          <div className="flex min-w-0 flex-1 justify-center px-1 md:px-4">
            <button
              type="button"
              onClick={onSearchFocus}
              className="flex h-10 w-full max-w-none items-center gap-2.5 rounded-xl border border-[#e8e0d6] bg-white px-3.5 text-left transition-colors hover:border-[#9a0002]/35 dark:border-[#3d3732] dark:bg-[#2a2623] md:max-w-md"
            >
              <MaterialSymbol icon="search" size={17} className="shrink-0 text-gray-400" />
              <span className="truncate text-[13px] font-medium text-gray-400">
                {searchQuery || "Buscar comida..."}
              </span>
              <kbd className="ml-auto hidden shrink-0 items-center rounded-md border border-[#e8e0d6] bg-[#f5f1eb] px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 dark:border-[#3d3732] dark:bg-[#1c1917] md:inline-flex">
                ⌘F
              </kbd>
            </button>
          </div>

          {/* ── Right: auth actions ── */}
          <div className="relative z-50 flex shrink-0 items-center gap-2.5 md:gap-3">
            {isAuthenticated ? (
              <>
                <div className="relative">
                  <CherryBtn
                    onClick={() => setShowNotifications((o) => !o)}
                    aria-label="Notificaciones"
                  >
                    <MaterialSymbol icon="notifications" size={17} className="text-white" />
                    {!showNotifications && hasOrderNotification && (
                      <span className="absolute top-0.5 right-0.5 z-10 h-2.5 w-2.5 animate-pulse rounded-full bg-[#ffeb3b] ring-[1.5px] ring-[#9a0002]" />
                    )}
                  </CherryBtn>
                  <NotificationPopover open={showNotifications}>
                    {notificationPanel}
                  </NotificationPopover>
                </div>

                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu((v) => !v);
                      setShowNotifications(false);
                    }}
                    aria-label="Mi perfil"
                    aria-expanded={showUserMenu}
                    aria-haspopup="menu"
                    className={cn(
                      "relative shrink-0 rounded-full shadow-md shadow-[#9a0002]/30 transition-transform duration-200 cursor-pointer active:scale-95 hover:scale-105",
                      (currentTab === "profile" || showUserMenu) &&
                        "outline outline-2 outline-[#9a0002] outline-offset-2",
                    )}
                  >
                    <UserAvatarView avatar={profile.avatar} variant="button" />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        {...NOTIFICATION_POPOVER_MOTION}
                        role="menu"
                        className="absolute top-[52px] right-0 z-50 w-[220px] rounded-2xl border border-[#e8e0d6] bg-white p-2 shadow-xl dark:border-[#3d3732] dark:bg-[#231f1c]"
                      >
                        <div className="mb-1 border-b border-[#f0ebe4] px-2.5 py-2 dark:border-[#2a2623]">
                          <p className="truncate text-[12px] font-semibold text-gray-900 dark:text-gray-100">
                            {profile.name}
                          </p>
                          <p className="truncate text-[11px] text-gray-400">{profile.email}</p>
                        </div>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            handleTabChange("profile");
                            setShowUserMenu(false);
                          }}
                          className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-medium text-gray-700 hover:bg-[#f5f1eb] dark:text-gray-200 dark:hover:bg-[#2a2623]"
                        >
                          <MaterialSymbol icon="badge" size={18} />
                          Mi perfil
                        </button>
                        {hasActiveBusiness && (
                          <Link
                            href="/negocio"
                            role="menuitem"
                            onClick={() => setShowUserMenu(false)}
                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-medium text-gray-700 hover:bg-[#f5f1eb] dark:text-gray-200 dark:hover:bg-[#2a2623]"
                          >
                            <MaterialSymbol icon="storefront" size={18} />
                            Ir a mi negocio
                          </Link>
                        )}
                        <div className="flex items-center justify-between rounded-xl px-2.5 py-2">
                          <span className="text-[13px] font-medium text-gray-600 dark:text-gray-400">Apariencia</span>
                          <ThemeToggleNavBtn className="h-8 w-8" clipId="nav-theme-desk" />
                        </div>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void handleLogout()}
                          className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-medium text-[#9a0002] hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <MaterialSymbol icon="logout" size={18} />
                          Cerrar sesión
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#9a0002] px-4 text-[13px] font-semibold text-white shadow-md shadow-[#9a0002]/25 transition-all hover:brightness-110 active:brightness-90"
              >
                <MaterialSymbol icon="login" size={16} />
                <span>Iniciar sesión</span>
              </Link>
            )}
          </div>

          {isAuthenticated && (showNotifications || showLocationDropdown) && (
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
                  className="fixed inset-y-0 left-0 z-[60] flex w-[275px] flex-col overflow-hidden bg-[#f5f1eb] p-3 shadow-2xl dark:bg-[#161412] md:hidden"
                >
                  <div className="mb-2 flex shrink-0 items-center justify-between border-b border-[#e8e0d6] px-1 pb-3 dark:border-[#3d3732]">
                    <button
                      type="button"
                      onClick={() => {
                        handleTabChange("home");
                        setShowDashboard(false);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1 text-left transition-colors hover:bg-[#ede4d9]/60 dark:hover:bg-[#2a2623]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-sm font-bold text-white shadow-sm">
                        B
                      </span>
                      <span className="text-[16px] font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        BolivarPide
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoutConfirm(false);
                        setShowDashboard(false);
                      }}
                      aria-label="Cerrar menú"
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#ede4d9] hover:text-gray-700 dark:hover:bg-[#2a2623]"
                    >
                      <MaterialSymbol icon="close" size={18} />
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                  {/* ── Location panel in mobile sidebar ── */}
                  {isAuthenticated && (
                    <div className="mx-1 mb-3 rounded-2xl border border-[#e8e0d6] bg-white p-3 shadow-xs dark:border-[#3d3732] dark:bg-[#1c1917]">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          <MaterialSymbol icon="near_me" size={14} className="text-[#9a0002]" fill />
                          <span>Ubicación de entrega</span>
                        </div>
                        {savedAddresses && savedAddresses.length < maxAddresses && (
                          <button
                            type="button"
                            onClick={() => {
                              onAddAddress?.();
                              setShowDashboard(false);
                            }}
                            className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#9a0002] hover:underline"
                          >
                            <MaterialSymbol icon="add" size={14} />
                            <span>Nueva</span>
                          </button>
                        )}
                      </div>

                      {savedAddresses && savedAddresses.length > 0 ? (
                        <div className="space-y-1.5">
                          {savedAddresses.map((addr) => {
                            const isSelected = addr.id === selectedAddressId;
                            return (
                              <div
                                key={addr.id}
                                className={cn(
                                  "flex items-center gap-2 rounded-xl border p-2 transition-all duration-200",
                                  isSelected
                                    ? "border-[#9a0002] bg-[#9a0002]/5 dark:bg-[#9a0002]/15"
                                    : "border-[#e8e0d6] dark:border-[#3d3732] bg-[#faf6f1]/50 dark:bg-[#231f1c]",
                                )}
                              >
                                <button
                                  type="button"
                                  aria-label={isSelected ? "Dirección seleccionada" : "Seleccionar dirección"}
                                  onClick={() => {
                                    onSelectAddress?.(addr.id);
                                  }}
                                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition"
                                  style={{
                                    borderColor: isSelected ? "#9a0002" : "#d6d3d1",
                                    background: isSelected ? "#9a0002" : "transparent",
                                  }}
                                >
                                  {isSelected && (
                                    <MaterialSymbol icon="check" size={13} className="text-white" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectAddress?.(addr.id);
                                  }}
                                  className="min-w-0 flex-1 cursor-pointer truncate text-left text-[12px] font-semibold text-gray-800 dark:text-gray-200"
                                >
                                  {addr.label}
                                </button>
                                <button
                                  type="button"
                                  aria-label="Editar dirección"
                                  onClick={() => {
                                    onEditAddress?.(addr.id);
                                    setShowDashboard(false);
                                  }}
                                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#ede4d9] hover:text-[#9a0002] dark:hover:bg-[#2a2623]"
                                >
                                  <MaterialSymbol icon="edit" size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onAddAddress?.();
                            setShowDashboard(false);
                          }}
                          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#e8e0d6] bg-[#faf6f1] py-2 text-[11px] font-semibold text-gray-600 transition-all hover:border-[#9a0002]/40 hover:text-[#9a0002] dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-300"
                        >
                          <MaterialSymbol icon="add" size={14} />
                          <span>Agregar dirección</span>
                        </button>
                      )}
                    </div>
                  )}

                  <nav className="flex flex-col gap-0.5 px-1">
                    <p className="px-3 mb-1 text-[11px] font-medium text-gray-400">General</p>
                    {DRAWER_TABS.filter((t) => t.id !== "profile" || isAuthenticated).map(({ id, label, icon }) => {
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

                  <div className="mt-3 border-t border-[#e8e0d6] px-1 pt-3 space-y-2 dark:border-[#3d3732]">
                    <div className="space-y-1.5">
                      {hasActiveBusiness && (
                        <Link
                          href="/negocio"
                          onClick={() => setShowDashboard(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#9a0002]/8 hover:bg-[#9a0002]/15 border border-[#9a0002]/15 text-[#9a0002] dark:text-red-300 transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <MaterialSymbol icon="storefront" size={16} fill />
                            <span className="text-[12px] font-bold">Ir a mi negocio</span>
                          </div>
                          <MaterialSymbol icon="arrow_forward" size={15} className="text-[#9a0002]/60 dark:text-red-400/60 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                      <Link
                        href="/negocio/registro"
                        onClick={() => setShowDashboard(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#ede4d9]/70 border border-transparent text-gray-600 dark:text-gray-300 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <MaterialSymbol icon="add_business" size={16} />
                          <span className="text-[12px] font-bold">Adherir negocio</span>
                        </div>
                        <MaterialSymbol icon="arrow_forward" size={15} className="opacity-50 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      {!isAuthenticated ? (
                        <Link
                          href="/login"
                          onClick={() => setShowDashboard(false)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-800 dark:text-amber-300 transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <MaterialSymbol icon="sports_motorsports" size={16} fill />
                            <span className="text-[12px] font-bold">Sumarme como repartidor</span>
                          </div>
                          <MaterialSymbol icon="arrow_forward" size={15} className="text-amber-600/60 dark:text-amber-400/60 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      ) : (
                      <button
                        type="button"
                        onClick={() => {
                          handleTabChange("profile");
                          setShowDashboard(false);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-800 dark:text-amber-300 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <MaterialSymbol icon="sports_motorsports" size={16} fill />
                          <span className="text-[12px] font-bold">Sumarme como repartidor</span>
                        </div>
                        <MaterialSymbol icon="arrow_forward" size={15} className="text-amber-600/60 dark:text-amber-400/60 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#e8e0d6]/70 dark:border-[#3d3732]/70">
                      <div className="flex h-9 items-center justify-between rounded-xl px-3">
                        <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">Apariencia</span>
                        <ThemeToggleNavBtn className="h-7 w-7" clipId="nav-theme-drawer" />
                      </div>
                    </div>
                  </div>
                  </div>

                  <div
                    ref={drawerFooterRef}
                    className={cn(
                      "shrink-0 -mx-3 mt-2 border-t px-3 py-3 transition-colors duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                      logoutConfirm
                        ? "border-[#9a0002] bg-[#9a0002]"
                        : "border-[#e8e0d6] dark:border-[#3d3732]",
                    )}
                  >
                    {isAuthenticated ? (
                      <div className="flex items-center gap-3">
                        <UserAvatarView avatar={profile.avatar} size="md" />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-[13px] font-bold",
                              logoutConfirm ? "text-white" : "text-gray-900 dark:text-gray-100",
                            )}
                          >
                            {profile.name}
                          </p>
                          <p
                            className={cn(
                              "truncate text-[11px]",
                              logoutConfirm ? "text-white/75" : "text-gray-400",
                            )}
                          >
                            {profile.email}
                          </p>
                        </div>
                        <LogoutNavRail
                          confirm={logoutConfirm}
                          onAccent={logoutConfirm}
                          boundaryRef={drawerFooterRef}
                          onAsk={() => setLogoutConfirm(true)}
                          onCancel={() => setLogoutConfirm(false)}
                          onConfirm={() => void handleLogout()}
                        />
                      </div>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setShowDashboard(false)}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9a0002]/10 text-[#9a0002]">
                          <MaterialSymbol icon="login" size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                            Iniciá sesión
                          </p>
                          <p className="text-[11px] text-gray-400">Pedí más rápido</p>
                        </div>
                        <MaterialSymbol icon="arrow_forward" size={18} className="text-gray-400" />
                      </Link>
                    )}
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
export function ThemeToggleNavBtn({ className = "", clipId = "skipper-clip" }: { className?: string; clipId?: string }) {
  const [isDark, setIsDark] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setIsDark(document.documentElement.classList.contains("dark")); }, []);

  const toggle = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    startThemeTransitionFrom(btnRef.current, next);
  }, [isDark]);

  return (
    <CherryBtn onClick={toggle} btnRef={btnRef} aria-label={isDark ? "Modo claro" : "Modo oscuro"} className={cn("overflow-hidden flex items-center justify-center", className)}>
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
