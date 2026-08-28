"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

interface BusinessSidebarProps {
  businessId: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function BusinessSidebar({
  businessId,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: BusinessSidebarProps) {
  const pathname = usePathname();
  const base = `/negocio/${businessId}`;
  const GENERAL_NAV = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard", href: `${base}/dashboard` },
    { id: "pedidos", label: "Pedidos", icon: "receipt_long", href: `${base}/pedidos` },
    { id: "carta", label: "Carta", icon: "menu_book", href: `${base}/carta` },
  ];
  const SUPPORT_NAV = [
    { id: "equipo", label: "Equipo", icon: "group", href: `${base}/equipo` },
  ];

  const renderNavItem = (item: { id: string; label: string; icon: string; href: string; badge?: number }, isMobile: boolean) => {
    const isActive = pathname === item.href;
    const isIconOnly = collapsed && !isMobile;
    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={isMobile ? onMobileClose : undefined}
        title={isIconOnly ? item.label : undefined}
        className={cn(
          "group relative flex items-center transition-all duration-200 cursor-pointer",
          isIconOnly
            ? "justify-center h-10 w-10 mx-auto rounded-xl my-0.5"
            : "gap-3 h-10 rounded-xl px-3 my-0.5",
          isIconOnly && isActive && "bg-[#9a0002]/10 dark:bg-[#9a0002]/20 text-[#9a0002]",
          isIconOnly && !isActive && "text-gray-400 hover:bg-[#ede4d9]/70 dark:hover:bg-[#2a2623] hover:text-gray-800 dark:hover:text-gray-100",
          !isIconOnly && isActive && "bg-[#9a0002]/10 text-[#9a0002] font-semibold",
          !isIconOnly && !isActive && "text-gray-500 dark:text-gray-400 hover:bg-[#ede4d9]/60 dark:hover:bg-[#2a2623] hover:text-gray-800 dark:hover:text-gray-200"
        )}
      >
        <div className="relative flex items-center justify-center">
          <MaterialSymbol icon={item.icon} size={20} fill={isActive} className="flex-shrink-0" />
          {isIconOnly && item.badge && item.badge > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#9a0002] text-white text-[9px] font-black flex items-center justify-center border-2 border-[#f5f1eb] dark:border-[#1c1917]">
              {item.badge}
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-[13px] font-medium tracking-tight whitespace-nowrap transition-all duration-300 overflow-hidden flex-1 flex items-center justify-between",
            isIconOnly ? "w-0 opacity-0 hidden" : "w-auto opacity-100",
            isActive && "font-semibold"
          )}
        >
          <span>{item.label}</span>
          {!isIconOnly && item.badge && item.badge > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-[#9a0002] text-white text-[10px] font-bold">
              {item.badge}
            </span>
          )}
        </span>

        {isIconOnly && (
          <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-[#302c28] text-white text-xs font-medium whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50 shadow-xl">
            {item.label} {item.badge ? `(${item.badge})` : ""}
          </span>
        )}
      </Link>
    );
  };

  const sectionLabel = (label: string, isIconOnly: boolean) =>
    !isIconOnly ? (
      <p className="px-3 mb-1.5 mt-4 first:mt-0 text-[11px] font-medium text-gray-400 dark:text-gray-500 tracking-wide">
        {label}
      </p>
    ) : null;

  const sidebarContent = (isMobile: boolean) => {
    const isIconOnly = collapsed && !isMobile;
    return (
      <div className={cn("flex flex-col h-full py-3 overflow-x-hidden", isIconOnly && "overflow-y-auto no-scrollbar")}>
        <div className={cn("flex items-center h-[48px] mb-3", isIconOnly ? "justify-center px-0" : "justify-between px-4")}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] flex items-center justify-center text-white font-black text-sm shadow-sm flex-shrink-0">
              B
            </div>
            <span
              className={cn(
                "font-bold text-[15px] tracking-tight text-gray-900 dark:text-gray-100 whitespace-nowrap transition-all duration-300",
                isIconOnly ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
              )}
            >
              BolivarPide
            </span>
          </div>

          {isMobile && (
            <button
              onClick={onMobileClose}
              aria-label="Cerrar menú"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] cursor-pointer"
            >
              <MaterialSymbol icon="close" size={18} />
            </button>
          )}

          {!isMobile && !collapsed && (
            <button
              onClick={onToggleCollapse}
              aria-label="Colapsar menú"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] cursor-pointer"
            >
              <MaterialSymbol icon="menu_open" size={18} />
            </button>
          )}
        </div>

        {!isMobile && collapsed && (
          <button
            onClick={onToggleCollapse}
            aria-label="Expandir menú"
            className="mx-auto mb-3 w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-[#ede4d9]/70 dark:hover:bg-[#2a2623] cursor-pointer"
          >
            <MaterialSymbol icon="menu" size={18} />
          </button>
        )}

        <nav
          className={cn(
            "flex-1 flex flex-col overflow-y-auto overflow-x-hidden",
            isIconOnly ? "px-2 no-scrollbar" : "px-2.5 custom-scrollbar"
          )}
        >
          {sectionLabel("General", isIconOnly)}
          {GENERAL_NAV.map((item) => renderNavItem(item, isMobile))}
          {sectionLabel("Soporte", isIconOnly)}
          {SUPPORT_NAV.map((item) => renderNavItem(item, isMobile))}
        </nav>

        <div className={cn("pt-2 flex flex-col gap-0.5", isIconOnly ? "px-2" : "px-2.5")}>
          {renderNavItem({ id: "configuracion", label: "Configuración", icon: "settings", href: `${base}/configuracion` }, isMobile)}
          {renderNavItem({ id: "hub", label: "Mis locales", icon: "storefront", href: "/negocio" }, isMobile)}
          {renderNavItem({ id: "home", label: "Ir al inicio", icon: "home", href: "/" }, isMobile)}

          {/* Plan upgrade — próximamente */}
          <div className={cn("mt-3 mb-1", isIconOnly ? "flex justify-center" : "")}>
            {isIconOnly ? (
              <button
                type="button"
                title="Planes Impulso y Líder — próximamente"
                disabled
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9a0002]/40 to-[#6b0001]/40 flex items-center justify-center text-white/70 cursor-not-allowed shadow-sm"
              >
                <MaterialSymbol icon="workspace_premium" size={20} />
              </button>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#9a0002]/80 via-[#8a0002]/70 to-[#4a0001]/80 p-3.5 text-white shadow-sm">
                <div className="relative z-10 space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-white/95 flex items-center justify-center text-[#9a0002]">
                    <MaterialSymbol icon="emoji_events" size={18} fill />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-white/65">Plan Inicial · 7% comisión</p>
                    <p className="text-[14px] font-bold tracking-tight mt-0.5">Impulso y Líder</p>
                    <p className="text-[11px] text-white/70 mt-1 leading-snug">
                      Planes con 3,5% y 0% de comisión — disponibles próximamente.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 rounded-full border border-white/30 bg-white/10 text-white/70 text-[12px] font-bold cursor-not-allowed"
                  >
                    Próximamente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 bg-[#f5f1eb] dark:bg-[#161412] border-r border-[#e8e0d6] dark:border-[#3d3732] transition-all duration-300 z-30 overflow-x-hidden",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {sidebarContent(false)}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <React.Fragment>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden fixed inset-y-0 left-0 w-[260px] bg-[#f5f1eb] dark:bg-[#161412] border-r border-[#e8e0d6] dark:border-[#3d3732] z-50 shadow-2xl"
            >
              {sidebarContent(true)}
            </motion.aside>
          </React.Fragment>
        )}
      </AnimatePresence>
    </>
  );
}
