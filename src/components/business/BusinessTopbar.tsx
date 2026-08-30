"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  CherryBtn,
  NOTIFICATION_POPOVER_MOTION,
  ThemeToggleNavBtn,
} from "@/components/Navbar";
import { SmoothInput } from "@/components/SmoothInput";
import { useUserProfile } from "@/components/UserProfileProvider";
import { UserAvatarView } from "@/components/UserAvatarView";
import { cn } from "@/lib/utils";
import type { BusinessShellData } from "@/lib/business/queries";
import type { NewOrderAlert } from "@/hooks/useOrderAlerts";

interface BusinessTopbarProps {
  shell: BusinessShellData;
  businessId: string;
  orderAlerts: NewOrderAlert[];
  onDismissOrderAlerts: (orderId?: string) => void;
  onMenuClick: () => void;
}

export function BusinessTopbar({
  shell,
  businessId,
  orderAlerts,
  onDismissOrderAlerts,
  onMenuClick,
}: BusinessTopbarProps) {
  const { profile, logout, isAuthenticated } = useUserProfile();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const alertMode = orderAlerts.length > 0;
  const hasNotifications = shell.notifications.length > 0 || alertMode;

  const alertMessage =
    orderAlerts.length === 1
      ? `Nuevo pedido #${orderAlerts[0].orderNumber} · ${orderAlerts[0].customerName}`
      : `${orderAlerts.length} pedidos nuevos`;

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

  async function handleLogout() {
    setShowUserMenu(false);
    await logout();
  }

  const notificationPanel = (
    <motion.div
      {...NOTIFICATION_POPOVER_MOTION}
      className="absolute top-[48px] right-0 z-50 w-[270px] rounded-2xl border border-[#e8e0d6] bg-white p-3 shadow-xl dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-[#ece8e2]"
    >
      <div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
        {shell.notifications.length === 0 ? (
          <p className="px-1 text-[11px] text-gray-500">Sin novedades por ahora.</p>
        ) : (
          shell.notifications.map((n, idx) => (
            <div
              key={idx}
              className="flex gap-2 rounded-xl bg-[#f5f1eb] p-2.5 text-left transition-colors hover:bg-[#ede4d9] dark:bg-[#2a2623] dark:hover:bg-[#302c28]/60"
            >
              <span className="select-none text-base">{n.emoji}</span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[12px] font-semibold leading-tight text-gray-800 dark:text-[#d4cfc9]">
                  {n.title}
                </span>
                <span className="mt-0.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  {n.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex-shrink-0 transition-all duration-500",
        alertMode
          ? "border-b border-[#7a0001] bg-[#9a0002] text-white shadow-lg shadow-[#9a0002]/25"
          : "h-[64px] border-b border-[#e8e0d6] bg-[#faf6f1]/90 dark:border-[#3d3732] dark:bg-[#1c1917]/90",
        alertMode && "backdrop-blur-md",
      )}
    >
      {alertMode ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden px-4 py-3 md:px-8"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            aria-hidden
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2.5s ease-in-out infinite",
            }}
          />
          <div className="relative mx-auto flex max-w-[1280px] items-center gap-3">
            <button
              onClick={onMenuClick}
              aria-label="Abrir menú"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/10 md:hidden cursor-pointer"
            >
              <MaterialSymbol icon="menu" size={20} />
            </button>
            <MaterialSymbol icon="notifications_active" size={22} className="shrink-0 animate-pulse" />
            <p className="min-w-0 flex-1 truncate text-sm font-bold md:text-base">{alertMessage}</p>
            <Link
              href={`/negocio/${businessId}/pedidos`}
              onClick={() => onDismissOrderAlerts()}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#9a0002] hover:bg-white/90"
            >
              Ir a pedidos
            </Link>
            <button
              type="button"
              aria-label="Cerrar alerta"
              className="shrink-0 rounded-full p-2 hover:bg-white/10 cursor-pointer"
              onClick={() => onDismissOrderAlerts(orderAlerts[0]?.id)}
            >
              <MaterialSymbol icon="close" size={18} />
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="mx-auto flex h-[64px] w-full max-w-[1280px] items-center gap-3 px-4 md:gap-5 md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
            <button
              onClick={onMenuClick}
              aria-label="Abrir menú"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-[#ede4d9] dark:text-gray-400 dark:hover:bg-[#2a2623] md:hidden cursor-pointer"
            >
              <MaterialSymbol icon="menu" size={20} />
            </button>

            <div className="hidden h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-[#e8e0d6] bg-white px-3.5 transition-colors focus-within:border-[#9a0002]/35 dark:border-[#3d3732] dark:bg-[#2a2623] md:flex">
              <MaterialSymbol icon="search" size={17} className="shrink-0 text-gray-400" />
              <SmoothInput
                placeholder="Buscar en el panel..."
                className="w-full text-[13px] font-medium text-gray-700 dark:text-gray-300"
              />
              <kbd className="ml-auto hidden shrink-0 items-center rounded-md border border-[#e8e0d6] bg-[#f5f1eb] px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 dark:border-[#3d3732] dark:bg-[#1c1917] lg:inline-flex">
                ⌘F
              </kbd>
            </div>
          </div>

          <div className="relative z-50 flex shrink-0 items-center gap-2.5 md:gap-3">
            <button
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Buscar"
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-[#ede4d9] dark:text-gray-400 dark:hover:bg-[#2a2623] cursor-pointer"
            >
              <MaterialSymbol icon="search" size={18} />
            </button>

            <div className="relative">
              <CherryBtn
                onClick={() => {
                  setShowNotifDropdown((o) => !o);
                  setShowUserMenu(false);
                }}
                aria-label="Notificaciones"
              >
                <MaterialSymbol icon="notifications" size={17} className="text-white" />
                {hasNotifications && !showNotifDropdown && (
                  <span className="absolute top-0.5 right-0.5 z-10 h-2.5 w-2.5 animate-pulse rounded-full bg-[#ffeb3b] ring-[1.5px] ring-[#9a0002]" />
                )}
              </CherryBtn>
              <AnimatePresence>{showNotifDropdown && notificationPanel}</AnimatePresence>
            </div>

            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu((v) => !v);
                  setShowNotifDropdown(false);
                }}
                aria-label="Mi perfil"
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
                className={cn(
                  "relative shrink-0 rounded-full shadow-md shadow-[#9a0002]/30 transition-transform duration-200 cursor-pointer active:scale-95 hover:scale-105",
                  showUserMenu && "outline outline-2 outline-[#9a0002] outline-offset-2",
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
                      <p className="truncate text-[11px] text-gray-400">{shell.planLabel}</p>
                    </div>
                    {isAuthenticated && (
                      <Link
                        href="/?tab=profile"
                        role="menuitem"
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-medium text-gray-700 hover:bg-[#f5f1eb] dark:text-gray-200 dark:hover:bg-[#2a2623]"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <MaterialSymbol icon="badge" size={18} />
                        Mi perfil
                      </Link>
                    )}
                    <Link
                      href="/"
                      role="menuitem"
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-medium text-gray-700 hover:bg-[#f5f1eb] dark:text-gray-200 dark:hover:bg-[#2a2623]"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <MaterialSymbol icon="home" size={18} />
                      Ir al inicio
                    </Link>
                    <div className="flex items-center justify-between rounded-xl px-2.5 py-2">
                      <span className="text-[13px] font-medium text-gray-600 dark:text-gray-400">
                        Apariencia
                      </span>
                      <ThemeToggleNavBtn className="h-8 w-8" clipId="biz-theme-desk" />
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
          </div>
        </div>
      )}

      <AnimatePresence>
        {mobileSearchOpen && !alertMode && (
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
