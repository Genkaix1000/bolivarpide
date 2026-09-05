"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChatCircle,
  Clock,
  CreditCard,
  CaretDown,
  Storefront,
  UsersThree,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type SettingsItem = {
  id: string;
  label: string;
  href: string;
  icon: Icon;
};

type SettingsGroup = {
  id: string;
  label: string;
  icon: Icon;
  items: SettingsItem[];
};

const GROUPS: SettingsGroup[] = [
  {
    id: "local",
    label: "Local",
    icon: Storefront,
    items: [
      { id: "general", label: "General & Perfil", href: "general", icon: Storefront },
      { id: "operacion", label: "Operación & Horarios", href: "operacion", icon: Clock },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    icon: CreditCard,
    items: [
      { id: "pagos", label: "Pagos & Facturación", href: "pagos", icon: CreditCard },
      { id: "canales", label: "WhatsApp & Canales", href: "canales", icon: ChatCircle },
    ],
  },
  {
    id: "org",
    label: "Organización",
    icon: UsersThree,
    items: [
      { id: "equipo", label: "Equipo & Permisos", href: "equipo", icon: UsersThree },
    ],
  },
];

export function SettingsSubnav({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const base = `/negocio/${businessId}/configuracion`;

  const activeGroupId =
    GROUPS.find((g) =>
      g.items.some((item) => {
        const href = `${base}/${item.href}`;
        return pathname === href || pathname.startsWith(`${href}/`);
      }),
    )?.id ?? "local";

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.id, g.id === activeGroupId])),
  );

  useEffect(() => {
    setOpen((prev) => ({ ...prev, [activeGroupId]: true }));
  }, [activeGroupId]);

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

      {/* Mobile: horizontal chips */}
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {GROUPS.flatMap((g) => g.items).map((item) => {
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
                  : "text-stone-500 hover:bg-black/[0.03]",
              )}
            >
              {active && (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.14),transparent_72%)]"
                  />
                  <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[#9a0002]" />
                </>
              )}
              <IconCmp weight="regular" size={18} className="relative z-[1]" />
              <span className="relative z-[1] whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop: collapsible tree */}
      <nav className="hidden md:block">
        {GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = open[group.id];
          const groupActive = group.id === activeGroupId;

          return (
            <div key={group.id} className="mb-1">
              <button
                type="button"
                onClick={() => setOpen((p) => ({ ...p, [group.id]: !p[group.id] }))}
                className={cn(
                  "relative flex h-11 w-full items-center gap-3 overflow-hidden px-5 text-left text-[13px] tracking-tight transition-colors",
                  groupActive ? "font-medium text-[#9a0002]" : "font-medium text-stone-500 hover:bg-black/[0.03]",
                )}
              >
                {groupActive && (
                  <>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.14),rgba(154,0,2,0.05)_42%,transparent_72%)] dark:bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.28),transparent_75%)]"
                    />
                    <span aria-hidden className="absolute inset-y-0 left-0 z-[1] w-[3px] bg-[#9a0002]" />
                  </>
                )}
                <GroupIcon
                  weight={groupActive ? "fill" : "regular"}
                  size={22}
                  className="relative z-[1] shrink-0"
                />
                <span className="relative z-[1] flex-1">{group.label}</span>
                <CaretDown
                  weight="bold"
                  size={14}
                  className={cn(
                    "relative z-[1] text-stone-400 transition-transform duration-200",
                    isOpen ? "rotate-0" : "-rotate-90",
                  )}
                />
              </button>

              {isOpen && (
                <ul className="relative ml-8 border-l border-[#9a0002]/25 pb-2 dark:border-[#9a0002]/35">
                  {group.items.map((item) => {
                    const href = `${base}/${item.href}`;
                    const active = pathname === href || pathname.startsWith(`${href}/`);
                    const ItemIcon = item.icon;
                    return (
                      <li key={item.id} className="relative">
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-[#9a0002]/45"
                        />
                        <Link
                          href={href}
                          className={cn(
                            "ml-3 flex items-center gap-2.5 py-2 pl-3 text-[13px] tracking-tight transition-colors",
                            active
                              ? "font-semibold text-[#9a0002]"
                              : "font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200",
                          )}
                        >
                          <ItemIcon
                            weight={active ? "fill" : "regular"}
                            size={18}
                            className="shrink-0"
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
