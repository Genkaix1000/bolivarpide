"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CaretRight,
  ClockCounterClockwise,
  DownloadSimple,
  House,
  Motorcycle,
  ShieldCheck,
  Storefront,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { UserAvatarView } from "@/components/UserAvatarView";
import { LogoutNavRail } from "@/components/shared/LogoutNavRail";
import { flashToast } from "@/components/FlashToast";
import { usePwaInstall } from "@/lib/pwa/usePwaInstall";
import { cn } from "@/lib/utils";
import type { UserAvatar } from "@/lib/userProfile";
import type { PlatformRoleClient } from "@/components/UserProfileProvider";

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
  trailing?: ReactNode;
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

function AccountMenuItems({
  hasActiveBusiness,
  platformRole,
  showJoin,
  onToggleJoin,
  onClose,
  isCapable,
  onInstall,
  appearanceControl,
  showGoHome,
}: {
  hasActiveBusiness: boolean;
  platformRole: PlatformRoleClient | null;
  showJoin: boolean;
  onToggleJoin: () => void;
  onClose: () => void;
  isCapable: boolean;
  onInstall: () => void;
  appearanceControl: ReactNode;
  showGoHome?: boolean;
}) {
  return (
    <div className="py-1">
      <AccountRow
        icon={ClockCounterClockwise}
        label="Historial"
        href="/historial"
        onClick={onClose}
      />
      {showGoHome && (
        <AccountRow icon={House} label="Ir al inicio" href="/" onClick={onClose} />
      )}
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
        {appearanceControl}
      </div>
      {isCapable && (
        <AccountRow icon={DownloadSimple} label="Instalar app" onClick={onInstall} />
      )}
    </div>
  );
}

type AccountSheetProps = {
  open: boolean;
  onClose: () => void;
  profile: { name: string; email: string; avatar: UserAvatar };
  hasActiveBusiness: boolean;
  platformRole: PlatformRoleClient | null;
  onGoProfile: () => void;
  onLogout: () => void | Promise<void>;
  /** Extra option used from the business panel. */
  showGoHome?: boolean;
  appearanceControl: ReactNode;
};

/** Bottom account sheet — same UX as index Navbar. */
export function AccountSheet({
  open,
  onClose,
  profile,
  hasActiveBusiness,
  platformRole,
  onGoProfile,
  onLogout,
  showGoHome = false,
  appearanceControl,
}: AccountSheetProps) {
  const [showJoin, setShowJoin] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const sheetFooterRef = useRef<HTMLDivElement>(null);
  const { isCapable, requestInstall } = usePwaInstall();

  const handleClose = useCallback(() => {
    setShowJoin(false);
    setLogoutConfirm(false);
    onClose();
  }, [onClose]);

  const handleInstall = useCallback(async () => {
    const result = await requestInstall();
    if (result === "ios") {
      flashToast("En Safari: tocá Compartir → “Agregar a pantalla de inicio”.");
    } else if (result === "pending") {
      flashToast("Usá la opción de instalar de tu navegador (recargá si no aparece).");
    }
  }, [requestInstall]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar menú"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
                onClick={handleClose}
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
                onClose={handleClose}
                isCapable={isCapable}
                onInstall={() => void handleInstall()}
                appearanceControl={appearanceControl}
                showGoHome={showGoHome}
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
                onClick={() => {
                  handleClose();
                  onGoProfile();
                }}
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
                onConfirm={() => void onLogout()}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
