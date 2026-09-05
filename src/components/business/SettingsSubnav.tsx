"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChatCircle,
  Clock,
  CreditCard,
  Storefront,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type SettingsItem = {
  id: string;
  label: string;
  href: string;
  icon: Icon;
};

const ITEMS: SettingsItem[] = [
  { id: "general", label: "General", href: "general", icon: Storefront },
  { id: "operacion", label: "Horarios", href: "operacion", icon: Clock },
  { id: "pagos", label: "Pagos", href: "pagos", icon: CreditCard },
  { id: "canales", label: "Canales", href: "canales", icon: ChatCircle },
  { id: "equipo", label: "Equipo", href: "equipo", icon: UsersThree },
];

export function SettingsSubnav({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const base = `/negocio/${businessId}/configuracion`;

  return (
    <aside
      className={cn(
        "shrink-0 border-[#e8e0d6] dark:border-[#3d3732]",
        "w-full md:w-56 md:border-r lg:w-60",
        "md:-my-5 md:-ml-4 md:min-h-[calc(100vh-5.5rem)] md:py-5 md:pl-0 md:pr-0",
        "lg:-ml-8",
      )}
    >
      <div className="px-4 md:px-5">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-stone-900 dark:text-white md:mb-6">
          Configuración
        </h1>
      </div>

      {/* Mobile: horizontal tabs — scrollbar always visible */}
      <nav
        className={cn(
          "flex gap-1 overflow-x-scroll px-4 pb-2.5 md:hidden",
          "[scrollbar-width:thin] [scrollbar-color:rgba(154,0,2,0.35)_rgba(232,224,214,0.6)]",
          "[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:h-1.5",
          "[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#e8e0d6]/70",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9a0002]/40",
          "dark:[scrollbar-color:rgba(154,0,2,0.5)_rgba(61,55,50,0.8)]",
          "dark:[&::-webkit-scrollbar-track]:bg-[#3d3732]/80",
          "dark:[&::-webkit-scrollbar-thumb]:bg-[#9a0002]/55",
        )}
      >
        {ITEMS.map((item) => {
          const href = `${base}/${item.href}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const IconCmp = item.icon;
          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "relative flex shrink-0 items-center gap-2 overflow-hidden px-3 py-2 text-[12px] font-medium transition-colors",
                active
                  ? "text-[#9a0002]"
                  : "text-stone-500 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
              )}
            >
              {active && (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.14),transparent_72%)]"
                  />
                  <motion.span
                    layoutId="settings-mobile-rail"
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-[3px] bg-[#9a0002]"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    style={{ originY: 1 }}
                  />
                </>
              )}
              <IconCmp weight={active ? "fill" : "regular"} size={18} className="relative z-[1]" />
              <span className="relative z-[1] whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop: flat list */}
      <nav className="hidden md:block">
        {ITEMS.map((item) => {
          const href = `${base}/${item.href}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const IconCmp = item.icon;
          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "relative flex h-11 w-full items-center gap-3 overflow-hidden px-5 text-left text-[13px] tracking-tight transition-colors",
                active
                  ? "font-medium text-[#9a0002]"
                  : "font-medium text-stone-500 hover:bg-black/[0.03] hover:text-stone-800 dark:hover:bg-white/[0.04] dark:hover:text-stone-100",
              )}
            >
              {active && (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.14),rgba(154,0,2,0.05)_42%,transparent_72%)] dark:bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.28),transparent_75%)]"
                  />
                  <motion.span
                    layoutId="settings-desktop-rail"
                    aria-hidden
                    className="absolute inset-y-0 left-0 z-[1] w-[3px] bg-[#9a0002]"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    style={{ originY: 1 }}
                  />
                </>
              )}
              <IconCmp
                weight={active ? "fill" : "regular"}
                size={22}
                className="relative z-[1] shrink-0"
              />
              <span className="relative z-[1]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
