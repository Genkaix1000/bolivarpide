"use client";

import { useState, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellRinging,
  List,
  MagnifyingGlass,
  User,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { ThemeToggleNavBtn } from "@/components/Navbar";
import { AccountSheet } from "@/components/shared/AccountSheet";
import { useUserProfile } from "@/components/UserProfileProvider";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { BusinessSearchOverlay } from "@/components/business/BusinessSearchOverlay";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import type { NewOrderAlert } from "@/hooks/useOrderAlerts";

interface BusinessTopbarProps {
  businessId: string;
  orderAlerts: NewOrderAlert[];
  onDismissOrderAlerts?: (orderId?: string) => void;
  onMenuClick: () => void;
  onToggleCollapse?: () => void;
}

/** Ghost dock control — same language as index Navbar DockIcon. */
function TopbarIconBtn({
  icon: IconCmp,
  label,
  onClick,
  active,
  badge,
  className,
}: {
  icon: Icon;
  label: string;
  onClick?: () => void;
  active?: boolean;
  badge?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-150",
        active
          ? "text-[#9a0002]"
          : "text-stone-500 hover:bg-black/[0.04] hover:text-stone-800 dark:text-stone-400 dark:hover:bg-white/[0.06] dark:hover:text-stone-100",
        className,
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute top-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-[#9a0002]"
        />
      )}
      <IconCmp weight={active ? "fill" : "regular"} size={22} aria-hidden />
      {badge && (
        <span className="absolute top-1.5 right-1.5 h-2 w-2 animate-pulse rounded-full bg-[#9a0002] ring-2 ring-[#faf6f1] dark:ring-[#1c1917]" />
      )}
    </button>
  );
}

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div>
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-label={title || "Menú"}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-h-[85dvh] w-full max-w-[480px] overflow-hidden rounded-t-[24px] border border-[#e8e0d6] bg-[#faf6f1] shadow-2xl dark:border-[#3d3732] dark:bg-[#1c1917]"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-stone-300 dark:bg-stone-600" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2">
              {title ? (
                <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">{title}</p>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623]"
              >
                <X weight="light" size={18} />
              </button>
            </div>
            <div className="max-h-[min(60dvh,480px)] overflow-y-auto px-1 pb-3">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function BusinessTopbar({
  businessId,
  orderAlerts,
  onDismissOrderAlerts,
  onMenuClick,
  onToggleCollapse,
}: BusinessTopbarProps) {
  const { profile, logout, hasActiveBusiness, platformRole } = useUserProfile();
  const { items: notifications, unreadCount, markRead, remove } = useNotifications({ businessId });
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifsViewed, setNotifsViewed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const alertMode = orderAlerts.length > 0;
  const hasNotifications = (!notifsViewed && unreadCount > 0) || alertMode;

  const alertMessage =
    orderAlerts.length === 1
      ? `Nuevo pedido #${orderAlerts[0].orderNumber} · ${orderAlerts[0].customerName}`
      : `${orderAlerts.length} pedidos nuevos`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && (k === "f" || k === "k")) {
        e.preventDefault();
        setSearchOpen(true);
        setShowNotifs(false);
        setShowUserMenu(false);
      }
      if (e.key === "Escape") setShowUserMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleLogout() {
    setShowUserMenu(false);
    await logout();
  }

  const openSearch = () => {
    setSearchOpen(true);
    setShowNotifs(false);
    setShowUserMenu(false);
  };

  const openNotifs = () => {
    setShowNotifs(true);
    setNotifsViewed(true);
    setShowUserMenu(false);
    void markRead({ all: true });
  };

  const openAccount = () => {
    setShowUserMenu(true);
    setShowNotifs(false);
  };

  const handleSidebarBtn = () => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      onToggleCollapse?.();
      return;
    }
    onMenuClick();
  };

  return (
    <>
      <header
        className={cn(
          "z-20 flex-shrink-0 transition-all duration-500 md:sticky md:top-0",
          alertMode
            ? "border-b border-[#7a0001] bg-[#9a0002] text-white shadow-lg shadow-[#9a0002]/25"
            : "h-14 border-b border-[#e8e0d6]/90 bg-[#faf6f1]/95 backdrop-blur-md dark:border-[#3d3732]/90 dark:bg-[#1c1917]/95",
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
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/90 hover:bg-white/10 md:hidden"
              >
                <List weight="regular" size={20} />
              </button>
              <BellRinging weight="fill" size={22} className="shrink-0 animate-pulse" />
              <p className="min-w-0 flex-1 truncate text-sm font-semibold md:text-[15px]">
                {alertMessage}
              </p>
              <Link
                href={`/negocio/${businessId}/pedidos`}
                className="shrink-0 cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#9a0002] shadow-sm transition-transform hover:bg-white/90 active:scale-95"
              >
                Ir a pedidos
              </Link>
              {onDismissOrderAlerts && (
                <button
                  type="button"
                  onClick={() => onDismissOrderAlerts()}
                  aria-label="Cerrar notificación"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-black/20 text-white transition-all hover:bg-black/35 active:scale-90"
                  title="Cerrar alerta"
                >
                  <X weight="bold" size={16} />
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-2 px-3 md:gap-3 md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 md:gap-3">
              <button
                type="button"
                onClick={handleSidebarBtn}
                aria-label="Abrir menú"
                className={cn(
                  "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl",
                  "bg-[#9a0002] text-white shadow-md shadow-[#9a0002]/30",
                  "transition-transform hover:brightness-110 active:scale-95",
                )}
              >
                <List weight="bold" size={20} />
              </button>

              <button
                type="button"
                onClick={openSearch}
                className={cn(
                  "hidden h-11 w-full max-w-md cursor-pointer items-center gap-2.5 rounded-2xl border border-[#e8e0d6] bg-white px-3.5 text-left shadow-sm transition-colors md:flex",
                  "hover:border-[#9a0002]/40 dark:border-[#3d3732] dark:bg-[#1c1917]",
                )}
              >
                <MagnifyingGlass weight="regular" size={18} className="shrink-0 text-stone-400" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-stone-400">
                  Buscar en el panel...
                </span>
                <kbd className="ml-auto hidden shrink-0 items-center rounded-md border border-[#e8e0d6] bg-[#f5f1eb] px-1.5 py-0.5 text-[10px] font-semibold text-stone-400 dark:border-[#3d3732] dark:bg-[#0b0b0d] lg:inline-flex">
                  ⌘F
                </kbd>
              </button>
            </div>

            <div className="relative z-50 flex shrink-0 items-center gap-0.5 md:gap-1">
              <TopbarIconBtn
                icon={MagnifyingGlass}
                label="Buscar"
                onClick={openSearch}
                active={searchOpen}
                className="md:hidden"
              />

              <TopbarIconBtn
                icon={Bell}
                label="Notificaciones"
                active={showNotifs}
                badge={hasNotifications && !showNotifs}
                onClick={openNotifs}
              />

              <TopbarIconBtn
                icon={User}
                label="Perfil"
                active={showUserMenu}
                onClick={openAccount}
              />
            </div>
          </div>
        )}
      </header>

      <BottomSheet open={showNotifs} onClose={() => setShowNotifs(false)} title="">
        <NotificationPanel
          items={notifications}
          variant="business"
          onMarkRead={markRead}
          onRemove={remove}
          onClose={() => setShowNotifs(false)}
          className="w-full max-w-none rounded-xl border-0 bg-white p-2 shadow-none dark:bg-[#231f1c]"
        />
      </BottomSheet>

      <AccountSheet
        open={showUserMenu}
        onClose={() => setShowUserMenu(false)}
        profile={profile}
        hasActiveBusiness={hasActiveBusiness}
        platformRole={platformRole}
        showGoHome
        onGoProfile={() => {
          window.location.href = "/?tab=profile";
        }}
        onLogout={handleLogout}
        appearanceControl={<ThemeToggleNavBtn className="h-8 w-8" clipId="biz-theme-sheet" />}
      />

      <BusinessSearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        businessId={businessId}
      />
    </>
  );
}
