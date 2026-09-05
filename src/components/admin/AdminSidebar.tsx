"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Headset,
  List,
  SidebarSimple,
  SquaresFour,
  Storefront,
  TerminalWindow,
  UserPlus,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { PlatformRole } from "@/lib/admin/platform";
import { ShellNavItem, ShellSectionLabel } from "@/components/shell/ShellNavItem";

const NAV: {
  href: string;
  label: string;
  icon: Icon;
  exact?: boolean;
  superOnly?: boolean;
  section?: "general" | "ops";
}[] = [
  { href: "/admin", label: "Dashboard", icon: SquaresFour, exact: true, section: "general" },
  { href: "/admin/comercios", label: "Comercios", icon: Storefront, section: "general" },
  { href: "/admin/leads", label: "Leads", icon: UserPlus, section: "general" },
  { href: "/admin/soporte", label: "Soporte", icon: Headset, section: "ops" },
  { href: "/admin/equipo", label: "Equipo", icon: UsersThree, superOnly: true, section: "ops" },
  { href: "/admin/auditoria", label: "Auditoría", icon: TerminalWindow, superOnly: true, section: "ops" },
];

export function AdminSidebar({
  platformRole,
  email,
}: {
  platformRole: PlatformRole;
  email: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV.filter((n) => !n.superOnly || platformRole === "superadmin");
  const general = items.filter((n) => n.section === "general");
  const ops = items.filter((n) => n.section === "ops");

  const roleLabel = platformRole === "superadmin" ? "Superadmin" : "Soporte";

  const body = (opts: { collapsed: boolean; onNavigate?: () => void }) => (
    <div className="flex h-full flex-col py-3">
      <div
        className={cn(
          "mb-3 flex h-12 items-center",
          opts.collapsed ? "justify-center" : "justify-between px-4",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-sm font-black text-white">
            B
          </div>
          {!opts.collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                BolivarPide
              </p>
              <p className="truncate text-[11px] text-[#9a0002]">{roleLabel}</p>
            </div>
          )}
        </div>
        {!opts.collapsed && (
          <button
            type="button"
            aria-label="Colapsar"
            onClick={() => setCollapsed(true)}
            className="hidden h-8 w-8 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-[#ede4d9] md:flex"
          >
            <SidebarSimple weight="regular" size={20} />
          </button>
        )}
      </div>

      {opts.collapsed && (
        <button
          type="button"
          aria-label="Expandir"
          onClick={() => setCollapsed(false)}
          className="mx-auto mb-3 hidden h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-stone-500 hover:bg-[#ede4d9]/70 md:flex"
        >
          <List weight="regular" size={22} />
        </button>
      )}

      <nav className="flex flex-1 flex-col">
        <ShellSectionLabel label="General" collapsed={opts.collapsed} />
        {general.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <ShellNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
              collapsed={opts.collapsed}
              onClick={opts.onNavigate}
            />
          );
        })}
        <ShellSectionLabel label="Operaciones" collapsed={opts.collapsed} />
        {ops.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <ShellNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
              collapsed={opts.collapsed}
              onClick={opts.onNavigate}
            />
          );
        })}
      </nav>

      {!opts.collapsed && (
        <div className="mt-auto border-t border-[#e8e0d6]/80 px-4 py-3 dark:border-[#3d3732]">
          <p className="truncate text-[11px] text-stone-400">{email}</p>
          <Link
            href="/"
            className="mt-1 inline-block text-[11px] font-medium text-[#9a0002] hover:underline"
            onClick={opts.onNavigate}
          >
            Ir al inicio
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-screen flex-col border-r border-[#e8e0d6] bg-[#f5f1eb] transition-all dark:border-[#3d3732] dark:bg-[#161412] md:flex",
          collapsed ? "w-[68px]" : "w-[240px]",
        )}
      >
        {body({ collapsed })}
      </aside>

      <button
        type="button"
        aria-label="Menú"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#e8e0d6] bg-[#f5f1eb] shadow-sm md:hidden"
      >
        <List weight="light" size={20} />
      </button>
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[#e8e0d6] bg-[#f5f1eb] shadow-2xl dark:bg-[#161412] md:hidden">
            <div className="flex items-center justify-between px-4 pt-3">
              <p className="text-[15px] font-semibold tracking-tight">Admin</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="cursor-pointer p-2 text-stone-400"
                aria-label="Cerrar"
              >
                <X weight="light" size={18} />
              </button>
            </div>
            {body({ collapsed: false, onNavigate: () => setMobileOpen(false) })}
          </aside>
        </>
      )}
    </>
  );
}
