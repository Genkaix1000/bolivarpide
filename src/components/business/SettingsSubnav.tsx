"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    label: "Local",
    items: [
      { id: "general", label: "General & Perfil", icon: "storefront", href: "general" },
      { id: "operacion", label: "Operación & Horarios", icon: "schedule", href: "operacion" },
    ],
  },
  {
    label: "Comercial",
    items: [
      { id: "pagos", label: "Pagos & Facturación", icon: "payments", href: "pagos" },
      { id: "canales", label: "WhatsApp & Canales", icon: "chat", href: "canales" },
    ],
  },
  {
    label: "Organización",
    items: [
      { id: "equipo", label: "Equipo & Permisos", icon: "group", href: "equipo" },
    ],
  },
] as const;

export function SettingsSubnav({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const base = `/negocio/${businessId}/configuracion`;

  return (
    <aside
      className={cn(
        "shrink-0 border-[#e8e0d6] dark:border-[#3d3732]",
        "w-full md:w-52 md:border-r lg:w-56",
        "md:-my-5 md:-ml-4 md:min-h-[calc(100vh-5.5rem)] md:py-5 md:pl-4 md:pr-3",
        "lg:-ml-8 lg:pl-8",
      )}
    >
      <h1 className="mb-4 text-xl font-black tracking-tight text-gray-900 dark:text-white md:mb-6 md:text-2xl">
        Configuración
      </h1>

      <nav className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0">
        {GROUPS.map((group) => (
          <div key={group.label} className="contents md:mb-4 md:block">
            <p className="mb-1.5 hidden px-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 md:block">
              {group.label}
            </p>
            {group.items.map((item) => {
              const href = `${base}/${item.href}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={item.id}
                  href={href}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-[#9a0002]/10 font-semibold text-[#9a0002]"
                      : "text-gray-500 hover:bg-[#ede4d9]/70 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-[#2a2623] dark:hover:text-gray-100",
                  )}
                >
                  <MaterialSymbol icon={item.icon} size={18} fill={active} className="shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
