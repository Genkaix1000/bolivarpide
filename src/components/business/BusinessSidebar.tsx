"use client";

import React, { useCallback } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpenText,
  ChatCircle,
  DownloadSimple,
  GearSix,
  List,
  Plus,
  Receipt,
  SidebarSimple,
  SquaresFour,
  Storefront,
  Trophy,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { flashToast } from "@/components/FlashToast";
import { usePwaInstall } from "@/lib/pwa/usePwaInstall";
import { ShellNavItem, ShellSectionLabel } from "@/components/shell/ShellNavItem";
import type { ShellMemberPreview } from "@/lib/business/queries";
import { UserAvatarView } from "@/components/UserAvatarView";
import Link from "next/link";

interface BusinessSidebarProps {
  businessId: string;
  planLabel: string;
  planCommission: string;
  pendingCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  members?: ShellMemberPreview[];
  memberCount?: number;
}

export function BusinessSidebar({
  businessId,
  planLabel,
  planCommission,
  pendingCount,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  members = [],
  memberCount = 0,
}: BusinessSidebarProps) {
  const pathname = usePathname();
  const base = `/negocio/${businessId}`;
  const { isCapable, requestInstall } = usePwaInstall();

  const handleInstallFromMenu = useCallback(
    async (isMobile: boolean) => {
      if (isMobile) onMobileClose();
      const result = await requestInstall();
      if (result === "ios") {
        flashToast("En Safari: tocá Compartir → “Agregar a pantalla de inicio”.");
      } else if (result === "pending") {
        flashToast("Usá la opción de instalar de tu navegador (recargá si no aparece).");
      }
    },
    [onMobileClose, requestInstall],
  );

  const general = [
    { id: "dashboard", label: "Dashboard", icon: SquaresFour, href: `${base}/dashboard` },
    {
      id: "pedidos",
      label: "Pedidos",
      icon: Receipt,
      href: `${base}/pedidos`,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: "whatsapp", label: "WhatsApp", icon: ChatCircle, href: `${base}/whatsapp` },
    { id: "carta", label: "Carta", icon: BookOpenText, href: `${base}/carta` },
  ] as const;

  const sidebarContent = (isMobile: boolean) => {
    const iconOnly = collapsed && !isMobile;
    const closeMobile = isMobile ? onMobileClose : undefined;

    return (
      <div
        className={cn(
          "flex h-full flex-col overflow-x-hidden py-3",
          iconOnly && "overflow-y-auto no-scrollbar",
        )}
      >
        <div
          className={cn(
            "mb-3 flex h-12 items-center",
            iconOnly ? "justify-center px-0" : "justify-between px-4",
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-sm font-black text-white shadow-sm">
              B
            </div>
            {!iconOnly && (
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                  BolivarPide
                </p>
                <p className="truncate text-[11px] text-stone-400">Panel del local</p>
              </div>
            )}
          </div>

          {isMobile && (
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Cerrar menú"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623]"
            >
              <X weight="light" size={18} />
            </button>
          )}

          {!isMobile && !collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Colapsar menú"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623]"
            >
              <SidebarSimple weight="regular" size={20} />
            </button>
          )}
        </div>

        {!isMobile && collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expandir menú"
            className="mx-auto mb-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-stone-500 hover:bg-[#ede4d9]/70 dark:hover:bg-[#2a2623]"
          >
            <List weight="regular" size={22} />
          </button>
        )}

        <nav
          className={cn(
            "flex flex-1 flex-col overflow-x-hidden overflow-y-auto",
            iconOnly ? "no-scrollbar" : "custom-scrollbar",
          )}
        >
          <ShellSectionLabel label="General" collapsed={iconOnly} />
          {general.map((item) => (
            <ShellNavItem
              key={item.id}
              href={item.href}
              label={item.label}
              icon={item.icon}
              badge={"badge" in item ? item.badge : undefined}
              active={pathname === item.href}
              collapsed={iconOnly}
              onClick={closeMobile}
            />
          ))}
          {isCapable && (
            <ShellNavItem
              label="Instalar app"
              icon={DownloadSimple}
              collapsed={iconOnly}
              onClick={() => void handleInstallFromMenu(isMobile)}
            />
          )}

          <div className={cn("mt-auto border-t border-[#e8e0d6]/80 pt-3 dark:border-[#3d3732]", iconOnly && "mt-4")}>
            <ShellSectionLabel label="Cuenta" collapsed={iconOnly} />
            <ShellNavItem
              href={`${base}/configuracion/general`}
              label="Configuración"
              icon={GearSix}
              active={pathname.startsWith(`${base}/configuracion`)}
              collapsed={iconOnly}
              onClick={closeMobile}
            />
            <ShellNavItem
              href="/negocio"
              label="Mis locales"
              icon={Storefront}
              collapsed={iconOnly}
              onClick={closeMobile}
            />
          </div>

          {/* Members facepile → Configuración / Equipo */}
          <div className={cn("mt-4 border-t border-[#e8e0d6]/80 pt-3 dark:border-[#3d3732]", iconOnly ? "px-0" : "px-4")}>
            {iconOnly ? (
              <Link
                href={`${base}/configuracion/equipo`}
                onClick={closeMobile}
                title="Equipo"
                className="mx-auto flex items-center justify-center py-0.5"
              >
                {members.length === 0 ? (
                  <UsersThree weight="regular" size={24} className="text-stone-500" />
                ) : (
                  <span className="flex items-center -space-x-3">
                    {members.slice(0, 3).map((m, i) => (
                      <span
                        key={m.userId}
                        className="relative inline-flex rounded-full ring-[2.5px] ring-[#f5f1eb] dark:ring-[#161412]"
                        style={{ zIndex: i + 1 }}
                      >
                        <UserAvatarView avatar={m.avatar} variant="button" size="sm" />
                      </span>
                    ))}
                  </span>
                )}
              </Link>
            ) : (
              <>
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                  Equipo
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href={`${base}/configuracion/equipo`}
                    onClick={closeMobile}
                    className="flex items-center -space-x-3"
                    aria-label="Ver equipo"
                  >
                    {members.map((m, i) => (
                      <span
                        key={m.userId}
                        title={m.label}
                        className="relative inline-flex rounded-full ring-[2.5px] ring-[#f5f1eb] dark:ring-[#161412]"
                        style={{ zIndex: i + 1 }}
                      >
                        <UserAvatarView avatar={m.avatar} variant="button" size="sm" />
                      </span>
                    ))}
                    {memberCount > members.length && (
                      <span
                        className="relative z-0 flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600 ring-[2.5px] ring-[#f5f1eb] dark:bg-[#2a2623] dark:text-stone-300 dark:ring-[#161412]"
                      >
                        +{memberCount - members.length}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={`${base}/configuracion/equipo`}
                    onClick={closeMobile}
                    aria-label="Gestionar equipo"
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-stone-400 transition-colors hover:text-[#9a0002]"
                  >
                    <Plus weight="bold" size={18} />
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className={cn("mt-3 mb-1", iconOnly ? "flex justify-center px-0" : "px-3")}>
            {iconOnly ? (
              <button
                type="button"
                title="Actualizá tu plan — próximamente"
                disabled
                className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl bg-[#9a0002]/15 text-[#9a0002]/50"
              >
                <Trophy weight="light" size={18} />
              </button>
            ) : (
              <button
                type="button"
                disabled
                title={`${planLabel} · ${planCommission} comisión`}
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#9a0002]/20 bg-[#9a0002]/8 px-3 py-2.5 text-[12px] font-semibold text-[#9a0002]/70 dark:text-red-300/70"
              >
                <Trophy weight="regular" size={15} className="shrink-0" />
                Actualizá tu plan
              </button>
            )}
          </div>
        </nav>
      </div>
    );
  };

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-screen flex-shrink-0 flex-col overflow-x-hidden border-r border-[#e8e0d6] bg-[#f5f1eb] transition-all duration-300 dark:border-[#3d3732] dark:bg-[#161412] md:flex",
          collapsed ? "w-[68px]" : "w-[240px]",
        )}
      >
        {sidebarContent(false)}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] border-r border-[#e8e0d6] bg-[#f5f1eb] shadow-2xl dark:border-[#3d3732] dark:bg-[#161412] md:hidden"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

