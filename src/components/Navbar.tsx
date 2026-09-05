"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Bell,
  CaretRight,
  Check,
  ClockCounterClockwise,
  DownloadSimple,
  Heart,
  MagnifyingGlass,
  MapPin,
  Motorcycle,
  PencilSimple,
  Plus,
  ShieldCheck,
  SignIn,
  SignOut,
  Storefront,
  User,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { useUserProfile } from "@/components/UserProfileProvider";
import { useCart } from "@/components/CartProvider";
import { UserAvatarView } from "@/components/UserAvatarView";
import { LogoutNavRail } from "@/components/shared/LogoutNavRail";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { useNotifications } from "@/hooks/useNotifications";
import type { UserAddressSummary } from "@/lib/addresses/types";
import { flashToast } from "@/components/FlashToast";
import { usePwaInstall } from "@/lib/pwa/usePwaInstall";
import { cartItemCount } from "@/lib/cart";
import { readGuestMode } from "@/lib/auth/rememberedAccount";

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
        "relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full",
        "bg-[#9a0002] text-white shadow-md shadow-[#9a0002]/30",
        "transition-all duration-300 ease-in-out hover:brightness-110 active:brightness-90",
        className,
      )}
    >
      {children}
    </button>
  );
}

function DockIcon({
  icon: IconCmp,
  label,
  onClick,
  active,
  badge,
  href,
}: {
  icon: Icon;
  label: string;
  onClick?: () => void;
  active?: boolean;
  badge?: boolean;
  href?: string;
}) {
  const cls = cn(
    "relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-150",
    active
      ? "text-[#9a0002]"
      : "text-stone-500 hover:bg-black/[0.04] hover:text-stone-800 dark:text-stone-400 dark:hover:bg-white/[0.06] dark:hover:text-stone-100",
  );

  const inner = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={cls} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" aria-label={label} title={label} aria-pressed={active} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function AccountRow({
  icon: IconCmp,
  label,
  onClick,
  href,
  active,
  trailing,
  accent,
}: {
  icon: Icon;
  label: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
  trailing?: React.ReactNode;
  accent?: boolean;
}) {
  const cls = cn(
    "group relative flex h-11 w-full cursor-pointer items-center gap-3 overflow-hidden pl-4 pr-3 text-left transition-colors duration-150",
    accent
      ? "font-semibold text-[#9a0002] dark:text-red-300"
      : active
        ? "font-medium text-[#9a0002]"
        : "font-medium text-stone-500 hover:bg-black/[0.03] hover:text-stone-800 dark:text-stone-400 dark:hover:bg-white/[0.04] dark:hover:text-stone-100",
  );

  const inner = (
    <>
      {(active || accent) && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.14),rgba(154,0,2,0.05)_42%,transparent_72%)]"
          />
          <span aria-hidden className="absolute inset-y-0 left-0 z-[1] w-[3px] bg-[#9a0002]" />
        </>
      )}
      <IconCmp
        weight={active || accent ? "regular" : "light"}
        size={20}
        className="relative z-[1] shrink-0"
        aria-hidden
      />
      <span className="relative z-[1] flex-1 text-[13px] tracking-tight">{label}</span>
      {trailing && <span className="relative z-[1] shrink-0">{trailing}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cls} role="menuitem">
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls} role="menuitem">
      {inner}
    </button>
  );
}

function DockSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
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
            aria-label={title}
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
            <div className="max-h-[min(60dvh,480px)] overflow-y-auto px-3 pb-3">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function AddressSheetBody({
  savedAddresses,
  selectedAddressId,
  maxAddresses,
  onSelectAddress,
  onEditAddress,
  onAddAddress,
  onClose,
}: {
  savedAddresses: UserAddressSummary[];
  selectedAddressId?: string;
  maxAddresses: number;
  onSelectAddress?: (id: string) => void;
  onEditAddress?: (id: string) => void;
  onAddAddress?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-1.5">
      {savedAddresses.length === 0 ? (
        <button
          type="button"
          onClick={() => {
            onAddAddress?.();
            onClose();
          }}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#e8e0d6] bg-white py-4 text-[12px] font-semibold text-stone-600 transition-all hover:border-[#9a0002]/40 hover:text-[#9a0002] dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-300"
        >
          <Plus weight="bold" size={14} />
          <span>Agregar dirección</span>
        </button>
      ) : (
        savedAddresses.map((addr) => {
          const isSelected = addr.id === selectedAddressId;
          return (
            <div
              key={addr.id}
              className={cn(
                "flex items-center gap-2 rounded-xl border bg-white p-2.5 transition-all duration-200 dark:bg-[#231f1c]",
                isSelected
                  ? "border-[#9a0002] bg-[#9a0002]/5 dark:bg-[#9a0002]/10"
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
                {isSelected && <Check weight="bold" size={14} className="text-white" />}
              </button>
              <button
                type="button"
                onClick={() => onSelectAddress?.(addr.id)}
                className="min-w-0 flex-1 cursor-pointer truncate text-left text-[13px] font-semibold text-stone-800 dark:text-stone-200"
              >
                {addr.label}
              </button>
              <button
                type="button"
                aria-label="Editar dirección"
                onClick={() => {
                  onEditAddress?.(addr.id);
                  onClose();
                }}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-stone-400 transition hover:bg-[#f5f1eb] hover:text-[#9a0002] dark:hover:bg-[#2a2623]"
              >
                <PencilSimple weight="regular" size={15} />
              </button>
            </div>
          );
        })
      )}
      {savedAddresses.length > 0 && savedAddresses.length < maxAddresses && (
        <button
          type="button"
          onClick={() => {
            onAddAddress?.();
            onClose();
          }}
          className="mt-1 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#e8e0d6] bg-white py-2.5 text-[11px] font-semibold text-stone-600 transition-all hover:border-[#9a0002]/40 hover:text-[#9a0002] dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-300"
        >
          <Plus weight="bold" size={14} />
          <span>Agregar nueva dirección</span>
        </button>
      )}
      {savedAddresses.length >= maxAddresses && (
        <p className="pt-1 text-center text-[10px] text-stone-400">
          Máximo {maxAddresses} direcciones
        </p>
      )}
    </div>
  );
}

function AccountMenuItems({
  hasActiveBusiness,
  platformRole,
  showJoin,
  onToggleJoin,
  onClose,
  isCapable,
  onInstall,
  themeClipId,
}: {
  hasActiveBusiness: boolean;
  platformRole: "superadmin" | "soporte" | null;
  showJoin: boolean;
  onToggleJoin: () => void;
  onClose: () => void;
  isCapable: boolean;
  onInstall: () => void;
  themeClipId: string;
}) {
  return (
    <div className="py-1">
      <AccountRow
        icon={ClockCounterClockwise}
        label="Historial"
        href="/historial"
        onClick={onClose}
      />
      {hasActiveBusiness && (
        <AccountRow icon={Storefront} label="Ir a mi negocio" href="/negocio" onClick={onClose} />
      )}
      {platformRole && (
        <AccountRow
          icon={ShieldCheck}
          label={platformRole === "soporte" ? "Panel Soporte" : "Panel Superadmin"}
          href="/admin"
          onClick={onClose}
          accent
        />
      )}
      <AccountRow
        icon={Storefront}
        label="Sumarme"
        onClick={onToggleJoin}
        active={showJoin}
        trailing={
          <CaretRight
            weight="bold"
            size={14}
            className={cn("text-stone-400 transition-transform duration-200", showJoin && "rotate-90")}
          />
        }
      />
      <AnimatePresence initial={false}>
        {showJoin && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="ml-4 border-l border-[#e8e0d6] dark:border-[#3d3732]">
              <AccountRow
                icon={Storefront}
                label="Comercio"
                href="/negocio/registro"
                onClick={onClose}
              />
              <AccountRow
                icon={Motorcycle}
                label="Repartidor"
                href="/repartidor"
                onClick={onClose}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex h-11 items-center justify-between gap-3 px-4">
        <span className="text-[13px] font-medium tracking-tight text-stone-500 dark:text-stone-400">
          Apariencia
        </span>
        <ThemeToggleNavBtn className="h-8 w-8" clipId={themeClipId} />
      </div>
      {isCapable && (
        <AccountRow icon={DownloadSimple} label="Instalar app" onClick={onInstall} />
      )}
    </div>
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
  const {
    profile,
    isAuthenticated,
    isAuthLoading,
    hasActiveBusiness,
    platformRole,
    rememberedAccount,
    logout,
    continueSession,
  } = useUserProfile();
  const { activeOrder, cart, pendingOrder, activeOrderBarVisible } = useCart();
  const { isCapable, requestInstall } = usePwaInstall();

  const handleTabChange = useCallback(
    (id: string) => {
      if (id === "profile" && !isAuthenticated) return;
      onTabChange(id);
    },
    [onTabChange, isAuthenticated],
  );

  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const sheetFooterRef = useRef<HTMLDivElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [continuePending, setContinuePending] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifsViewed, setNotifsViewed] = useState(false);
  const { items: notifications, unreadCount, markRead, remove } = useNotifications({
    enabled: isAuthenticated,
  });

  const closeLocation = useCallback(() => {
    if (showLocationDropdown) onLocationClick?.();
  }, [showLocationDropdown, onLocationClick]);

  const closeAccount = useCallback(() => {
    setShowUserMenu(false);
    setShowJoin(false);
    setLogoutConfirm(false);
  }, []);

  const handleInstallFromMenu = useCallback(async () => {
    closeAccount();
    const result = await requestInstall();
    if (result === "ios") {
      flashToast("En Safari: tocá Compartir → “Agregar a pantalla de inicio”.");
    } else if (result === "pending") {
      flashToast("Usá la opción de instalar de tu navegador (recargá si no aparece).");
    }
  }, [closeAccount, requestInstall]);

  const handleToggleNotifications = useCallback(() => {
    closeAccount();
    closeLocation();
    setShowLoginSheet(false);
    setShowNotifications((prev) => {
      const next = !prev;
      if (next) {
        setNotifsViewed(true);
        void markRead({ all: true });
        if (activeOrder) {
          try {
            localStorage.setItem(
              "bp_active_order_notif_seen",
              `${activeOrder.orderId}_${activeOrder.status}`,
            );
          } catch {
            /* ignore */
          }
        }
      }
      return next;
    });
  }, [markRead, activeOrder, closeAccount, closeLocation]);

  const isNewActiveOrder = useMemo(() => {
    if (!activeOrder || notifsViewed || typeof window === "undefined") return false;
    try {
      if (localStorage.getItem(`bp_dismissed_order_${activeOrder.orderId}`)) return false;
      if (localStorage.getItem(`bp_read_order_${activeOrder.orderId}`) === activeOrder.status) {
        return false;
      }
      return (
        localStorage.getItem("bp_active_order_notif_seen") !==
        `${activeOrder.orderId}_${activeOrder.status}`
      );
    } catch {
      return false;
    }
  }, [activeOrder, notifsViewed]);

  const hasOrderNotification = (!notifsViewed && unreadCount > 0) || isNewActiveOrder;

  const cartBlockingFloat =
    cartItemCount(cart.lines) > 0 || !!pendingOrder || (!!activeOrder && activeOrderBarVisible);

  const canQuickContinue = !!rememberedAccount && readGuestMode();
  const showLoginFloat =
    !isAuthLoading && !isAuthenticated && !cartBlockingFloat && !showLoginSheet;

  useEffect(() => {
    if (!showUserMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAccount();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showUserMenu, closeAccount]);

  async function handleLogout() {
    closeAccount();
    await logout();
  }

  const goProfile = () => {
    handleTabChange("profile");
    closeAccount();
  };

  const openAccount = () => {
    setShowNotifications(false);
    closeLocation();
    setShowLoginSheet(false);
    setShowUserMenu((v) => {
      if (v) {
        setShowJoin(false);
        setLogoutConfirm(false);
      }
      return !v;
    });
  };

  const openLoginEntry = () => {
    setShowNotifications(false);
    closeLocation();
    closeAccount();
    if (rememberedAccount) {
      setShowLoginSheet(true);
      return;
    }
    window.location.href = "/login";
  };

  const handleContinue = async () => {
    setContinuePending(true);
    try {
      await continueSession();
      setShowLoginSheet(false);
    } finally {
      setContinuePending(false);
    }
  };

  const addressList = savedAddresses ?? [];
  const searchPlaceholder = searchQuery || "Buscar comida, locales, hamburguesas, pizza...";

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <header
        className={cn(
          "relative h-14 border-b border-[#e8e0d6]/90",
          "bg-[#faf6f1]/95 backdrop-blur-md",
          "dark:border-[#3d3732]/90 dark:bg-[#1c1917]/95",
        )}
      >
        {!isAuthLoading && !isAuthenticated ? (
          /* Guest: search box aligned with SearchAutocompleteOverlay (max-w 760 + px-4) */
          <nav className="mx-auto flex h-full w-full max-w-[760px] items-center px-4">
            <button
              type="button"
              onClick={onSearchFocus}
              aria-label="Buscar"
              className={cn(
                "flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-2xl border border-[#e8e0d6] bg-white px-3.5 text-left shadow-sm transition-colors",
                "hover:border-[#9a0002]/40 dark:border-[#3d3732] dark:bg-[#1c1917]",
              )}
            >
              <MagnifyingGlass weight="regular" size={19} className="shrink-0 text-[#9a0002]" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-stone-400">
                {searchPlaceholder}
              </span>
            </button>
          </nav>
        ) : (
          <nav className="relative mx-auto flex h-full w-full max-w-[1040px] items-center px-2 md:px-4">
            <div className="grid h-full w-full grid-cols-5 items-center">
              <div className="flex justify-center">
                <DockIcon icon={Heart} label="Favoritos" href="/favoritos" />
              </div>

              <div className="flex justify-center">
                <DockIcon
                  icon={MapPin}
                  label={locationLabel?.split(",")[0] || "Ubicación"}
                  active={showLocationDropdown}
                  onClick={() => {
                    setShowNotifications(false);
                    closeAccount();
                    setShowLoginSheet(false);
                    onLocationClick?.();
                  }}
                />
              </div>

              <div className="flex h-full items-center justify-center">
                <button
                  type="button"
                  onClick={onSearchFocus}
                  aria-label={searchQuery ? `Buscar: ${searchQuery}` : "Buscar"}
                  className={cn(
                    "flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl",
                    "bg-[#9a0002] text-white shadow-md shadow-[#9a0002]/30",
                    "transition-transform hover:brightness-110 active:scale-95",
                  )}
                >
                  <MagnifyingGlass weight="bold" size={22} />
                </button>
              </div>

              <div className="flex justify-center">
                <DockIcon
                  icon={Bell}
                  label="Alertas"
                  active={showNotifications}
                  badge={!showNotifications && hasOrderNotification}
                  onClick={handleToggleNotifications}
                />
              </div>

              <div className="flex justify-center">
                {isAuthLoading ? (
                  <div className="h-9 w-9 animate-pulse rounded-full bg-black/5 dark:bg-white/5" />
                ) : (
                  <DockIcon
                    icon={User}
                    label="Perfil"
                    active={currentTab === "profile" || showUserMenu}
                    onClick={openAccount}
                  />
                )}
              </div>
            </div>
          </nav>
        )}
      </header>

      {typeof document !== "undefined" &&
        createPortal(
          <>
            <DockSheet
              open={!!showLocationDropdown && isAuthenticated}
              onClose={closeLocation}
              title="Ubicación"
            >
              <AddressSheetBody
                savedAddresses={addressList}
                selectedAddressId={selectedAddressId}
                maxAddresses={maxAddresses}
                onSelectAddress={onSelectAddress}
                onEditAddress={onEditAddress}
                onAddAddress={onAddAddress}
                onClose={closeLocation}
              />
            </DockSheet>

            <DockSheet
              open={showNotifications && isAuthenticated}
              onClose={() => setShowNotifications(false)}
              title=""
            >
              <NotificationPanel
                items={notifications}
                variant="customer"
                activeOrder={activeOrder}
                onMarkRead={markRead}
                onRemove={remove}
                onClose={() => setShowNotifications(false)}
                settingsHref="/?tab=profile&section=notifications"
                className="w-full max-w-none rounded-xl border-0 bg-white p-2 shadow-none dark:bg-[#231f1c]"
              />
            </DockSheet>

            <AnimatePresence>
              {showLoginFloat && !rememberedAccount && (
                <motion.div
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 24, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
                  style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                >
                  <Link
                    href="/login"
                    className="pointer-events-auto flex h-12 items-center gap-2 rounded-full bg-[#9a0002] px-6 text-[14px] font-semibold text-white shadow-lg shadow-[#9a0002]/35 transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    <SignIn weight="bold" size={18} />
                    Iniciar sesión
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Remembered account / login sheet */}
            <AnimatePresence>
              {showLoginSheet && rememberedAccount && (
                <div>
                  <motion.button
                    type="button"
                    aria-label="Cerrar"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowLoginSheet(false)}
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
                  />
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-[480px] overflow-hidden rounded-t-[24px] border border-[#e8e0d6] bg-[#faf6f1] shadow-2xl dark:border-[#3d3732] dark:bg-[#1c1917]"
                    style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
                  >
                    <div className="flex justify-center pt-3 pb-2">
                      <div className="h-1 w-10 rounded-full bg-stone-300 dark:bg-stone-600" />
                    </div>
                    <p className="px-4 pb-3 text-[13px] font-semibold text-stone-800 dark:text-stone-100">
                      Continuar
                    </p>
                    <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-[#e8e0d6] bg-white px-3 py-3 dark:border-[#3d3732] dark:bg-[#231f1c]">
                      <UserAvatarView avatar={rememberedAccount.avatar} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-stone-900 dark:text-stone-100">
                          {rememberedAccount.name}
                        </p>
                        <p className="truncate text-[11px] text-stone-400">{rememberedAccount.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 px-3 pb-2">
                      {canQuickContinue ? (
                        <button
                          type="button"
                          disabled={continuePending}
                          onClick={() => void handleContinue()}
                          className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#9a0002] text-[14px] font-semibold text-white shadow-md shadow-[#9a0002]/30 transition hover:brightness-110 disabled:opacity-60"
                        >
                          <SignIn weight="bold" size={18} />
                          {continuePending ? "Ingresando…" : "Ingresar"}
                        </button>
                      ) : (
                        <Link
                          href={`/login?email=${encodeURIComponent(rememberedAccount.email)}`}
                          onClick={() => setShowLoginSheet(false)}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#9a0002] text-[14px] font-semibold text-white shadow-md shadow-[#9a0002]/30 transition hover:brightness-110"
                        >
                          <SignIn weight="bold" size={18} />
                          Ingresar
                        </Link>
                      )}
                      <Link
                        href="/login"
                        onClick={() => setShowLoginSheet(false)}
                        className="flex h-11 w-full items-center justify-center rounded-full text-[13px] font-medium text-stone-500 transition hover:bg-black/[0.03] dark:text-stone-400 dark:hover:bg-white/[0.04]"
                      >
                        Usar otra cuenta
                      </Link>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Account sheet — same on mobile and web */}
            <AnimatePresence>
              {showUserMenu && isAuthenticated && (
                <>
                  <motion.button
                    type="button"
                    aria-label="Cerrar menú"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeAccount}
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
                  />
                  <motion.div
                    role="menu"
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
                    <div className="flex justify-end px-3 pb-1">
                      <button
                        type="button"
                        onClick={closeAccount}
                        aria-label="Cerrar"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623]"
                      >
                        <X weight="light" size={18} />
                      </button>
                    </div>
                    <div className="max-h-[min(60dvh,420px)] overflow-y-auto pb-1">
                      <AccountMenuItems
                        hasActiveBusiness={hasActiveBusiness}
                        platformRole={platformRole}
                        showJoin={showJoin}
                        onToggleJoin={() => setShowJoin((v) => !v)}
                        onClose={closeAccount}
                        isCapable={isCapable}
                        onInstall={() => void handleInstallFromMenu()}
                        themeClipId="nav-theme-sheet"
                      />
                    </div>
                    <div
                      ref={sheetFooterRef}
                      className={cn(
                        "mx-2 mb-2 flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors duration-[260ms]",
                        logoutConfirm
                          ? "border-[#9a0002] bg-[#9a0002]"
                          : "border-[#e8e0d6] bg-white dark:border-[#3d3732] dark:bg-[#231f1c]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={goProfile}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                        disabled={logoutConfirm}
                      >
                        <UserAvatarView avatar={profile.avatar} size="md" />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-[13px] font-bold",
                              logoutConfirm ? "text-white" : "text-stone-900 dark:text-stone-100",
                            )}
                          >
                            {profile.name}
                          </p>
                          <p
                            className={cn(
                              "truncate text-[11px]",
                              logoutConfirm ? "text-white/75" : "text-stone-400",
                            )}
                          >
                            {profile.email}
                          </p>
                        </div>
                      </button>
                      <LogoutNavRail
                        confirm={logoutConfirm}
                        onAccent={logoutConfirm}
                        boundaryRef={sheetFooterRef}
                        onAsk={() => setLogoutConfirm(true)}
                        onCancel={() => setLogoutConfirm(false)}
                        onConfirm={() => void handleLogout()}
                      />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>,
          document.body,
        )}
    </div>
  );
}

export function ThemeToggleNavBtn({
  className = "",
  clipId = "skipper-clip",
}: {
  className?: string;
  clipId?: string;
}) {
  const [isDark, setIsDark] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    queueMicrotask(() => setIsDark(document.documentElement.classList.contains("dark")));
  }, []);

  const toggle = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    startThemeTransitionFrom(btnRef.current, next);
  }, [isDark]);

  return (
    <CherryBtn
      onClick={toggle}
      btnRef={btnRef}
      aria-label={isDark ? "Modo claro" : "Modo oscuro"}
      className={cn("flex items-center justify-center overflow-hidden", className)}
    >
      <SkiperSunMoon isDark={isDark} clipId={clipId} />
    </CherryBtn>
  );
}

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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      fill={color}
      strokeLinecap="round"
      viewBox="0 0 32 32"
      className="h-[18px] w-[18px]"
    >
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
          <path d="M16 5.5v-4" />
          <path d="M16 30.5v-4" />
          <path d="M1.5 16h4" />
          <path d="M26.5 16h4" />
          <path d="m23.4 8.6 2.8-2.8" />
          <path d="m5.7 26.3 2.9-2.9" />
          <path d="m5.8 5.8 2.8 2.8" />
          <path d="m23.4 23.4 2.9 2.9" />
        </motion.g>
      </g>
    </svg>
  );
}
