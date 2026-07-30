"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/negocio/dashboard" },
  { id: "pedidos", label: "Pedidos", icon: "receipt_long", href: "/negocio/pedidos", badge: 3 },
  { id: "carta", label: "Carta", icon: "menu_book", href: "/negocio/carta" },
  { id: "equipo", label: "Equipo", icon: "group", href: "/negocio/equipo" },
];

interface BusinessSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function BusinessSidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: BusinessSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    onMobileClose();
    router.push("/");
  };

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
          "group relative flex items-center gap-3 h-11 rounded-xl transition-all duration-300 px-3.5 border-l-2",
          isIconOnly && "justify-center px-0",
          isActive
            ? "bg-[#9a0002]/10 text-[#9a0002] font-bold border-[#9a0002]"
            : "text-gray-500 dark:text-gray-400 hover:bg-[#ede4d9]/60 dark:hover:bg-[#2a2623] hover:text-gray-800 dark:hover:text-gray-200 border-transparent"
        )}
      >
        <div className="relative flex items-center justify-center">
          <MaterialSymbol icon={item.icon} size={19} fill={isActive} className="flex-shrink-0" />
          {isIconOnly && item.badge && item.badge > 0 && (
            <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#9a0002] text-white text-[9px] font-black flex items-center justify-center animate-pulse">
              {item.badge}
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-300 overflow-hidden flex-1 flex items-center justify-between",
            isIconOnly ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
        >
          <span>{item.label}</span>
          {!isIconOnly && item.badge && item.badge > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#9a0002] text-white text-[10px] font-black shadow-xs animate-pulse">
              {item.badge} nuevos
            </span>
          )}
        </span>

        {isIconOnly && (
          <span className="pointer-events-none absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-[#302c28] text-white text-xs font-bold whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50 shadow-lg">
            {item.label} {item.badge ? `(${item.badge})` : ""}
          </span>
        )}
      </Link>
    );
  };

  const sidebarContent = (isMobile: boolean) => {
    const isIconOnly = collapsed && !isMobile;
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={cn("flex items-center h-[64px] px-4 flex-shrink-0", isIconOnly ? "justify-center px-0" : "justify-between")}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] flex items-center justify-center text-white font-black text-base shadow-sm flex-shrink-0">
              B
            </div>
            <span
              className={cn(
                "font-extrabold text-sm tracking-tight text-gray-800 dark:text-gray-100 whitespace-nowrap transition-all duration-300",
                isIconOnly ? "w-0 opacity-0" : "w-auto opacity-100"
              )}
            >
              BolivarPide
            </span>
          </div>

          {isMobile && (
            <button
              onClick={onMobileClose}
              aria-label="Cerrar menú"
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] hover:text-gray-700 transition-colors cursor-pointer"
            >
              <MaterialSymbol icon="close" size={18} />
            </button>
          )}

          {!isMobile && !collapsed && (
            <button
              onClick={onToggleCollapse}
              aria-label="Colapsar menú"
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] hover:text-gray-700 transition-colors cursor-pointer"
            >
              <MaterialSymbol icon="menu_open" size={18} />
            </button>
          )}
        </div>

        {!isMobile && collapsed && (
          <button
            onClick={onToggleCollapse}
            aria-label="Expandir menú"
            className="mx-auto mb-2 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] hover:text-gray-700 transition-colors cursor-pointer"
          >
            <MaterialSymbol icon="menu" size={18} />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => renderNavItem(item, isMobile))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 pt-2 flex flex-col gap-1 border-t border-gray-100 dark:border-[#3d3732] mt-2">
          {renderNavItem({ id: "configuracion", label: "Configuración", icon: "settings", href: "/negocio/configuracion" }, isMobile)}
          <button
            onClick={handleLogout}
            title={isIconOnly ? "Desconectar" : undefined}
            className={cn(
              "group relative flex items-center gap-3 h-11 rounded-xl transition-all duration-300 px-3.5 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-[#9a0002] cursor-pointer",
              isIconOnly && "justify-center px-0"
            )}
          >
            <MaterialSymbol icon="logout" size={19} className="flex-shrink-0" />
            <span
              className={cn(
                "text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-300 overflow-hidden",
                isIconOnly ? "w-0 opacity-0" : "w-auto opacity-100"
              )}
            >
              Desconectar
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 bg-[#faf6f1] dark:bg-[#1c1917] border-r border-gray-100 dark:border-[#3d3732] transition-all duration-300 z-30",
          collapsed ? "w-[64px]" : "w-[240px]"
        )}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile drawer */}
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
              className="md:hidden fixed inset-y-0 left-0 w-[260px] bg-[#faf6f1] dark:bg-[#1c1917] border-r border-gray-100 dark:border-[#3d3732] z-50 shadow-2xl"
            >
              {sidebarContent(true)}
            </motion.aside>
          </React.Fragment>
        )}
      </AnimatePresence>
    </>
  );
}
