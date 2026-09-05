"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { TabGeneral } from "./TabGeneral";
import { TabOperacion } from "./TabOperacion";
import { TabPagos } from "./TabPagos";
import { TabCanales } from "./TabCanales";
import { TabEquipo } from "./TabEquipo";
import type { BusinessRow } from "@/lib/business/queries";
import type { WhatsAppConnection } from "@/lib/business/whatsappQueries";

interface SettingsLayoutProps {
  business: BusinessRow;
  businessId: string;
  currentUserId: string;
  currentUserRole?: string;
  initialHours: { weekday: number; open_time: string; close_time: string; closed: boolean }[];
  connection: WhatsAppConnection | null;
  members: { id: string; role: string; status: string; user_id: string; invited_at: string | null }[];
}

export function SettingsLayout({
  business,
  businessId,
  currentUserId,
  currentUserRole = "staff",
  initialHours,
  connection,
  members,
}: SettingsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "general";

  const waInitial = searchParams.get("whatsapp")
    ? {
        ok: searchParams.get("whatsapp") === "connected",
        text:
          searchParams.get("whatsapp") === "connected"
            ? "WhatsApp conectado. Ya recibís y respondés mensajes desde el panel."
            : searchParams.get("why") || "No se pudo conectar WhatsApp.",
      }
    : null;

  const tabs = [
    {
      id: "general",
      label: "General & Perfil",
      icon: "storefront",
      category: "Ajustes Principales",
    },
    {
      id: "operacion",
      label: "Operación & Horarios",
      icon: "schedule",
      category: "Ajustes Principales",
    },
    {
      id: "pagos",
      label: "Pagos & Facturación",
      icon: "payments",
      category: "Comercial",
    },
    {
      id: "canales",
      label: "WhatsApp & Alertas",
      icon: "chat",
      category: "Comercial",
    },
    {
      id: "equipo",
      label: "Equipo & Permisos",
      icon: "group",
      category: "Organización",
    },
  ];

  function setTab(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
          Configuración
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Gestioná la identidad, horarios operativos, cobros con Mercado Pago y equipo de tu local.
        </p>
      </div>

      {/* 2 Columns Crisply-style layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Sub-navigation tabs */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#1c1917] rounded-[24px] p-4 sm:p-5 border border-stone-200/80 dark:border-[#332e2a] shadow-sm space-y-4">
            {/* Grouped menu items */}
            {Array.from(new Set(tabs.map((t) => t.category))).map((category) => (
              <div key={category} className="space-y-1">
                <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  {category}
                </span>
                <div className="mt-1 space-y-1">
                  {tabs
                    .filter((t) => t.category === category)
                    .map((tab) => {
                      const isActive = currentTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setTab(tab.id)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-[#9a0002]/10 text-[#9a0002] dark:bg-[#9a0002]/20 shadow-sm"
                              : "text-stone-600 dark:text-stone-400 hover:bg-stone-100/70 dark:hover:bg-[#272320] hover:text-stone-900"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <MaterialSymbol
                              icon={tab.icon}
                              size={20}
                              fill={isActive}
                              className={isActive ? "text-[#9a0002]" : "text-stone-400"}
                            />
                            <span>{tab.label}</span>
                          </div>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9a0002]" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Quick link back to dashboard */}
          <div className="px-2">
            <a
              href={`/negocio/${businessId}/dashboard`}
              className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-[#9a0002] transition-colors"
            >
              <MaterialSymbol icon="arrow_back" size={16} />
              <span>Volver al Dashboard</span>
            </a>
          </div>
        </aside>

        {/* Right column: Tab Content Panel */}
        <main className="lg:col-span-8 min-w-0">
          {currentTab === "general" && (
            <TabGeneral business={business} businessId={businessId} />
          )}
          {currentTab === "operacion" && (
            <TabOperacion
              business={business}
              businessId={businessId}
              initialHours={initialHours}
            />
          )}
          {currentTab === "pagos" && <TabPagos businessId={businessId} />}
          {currentTab === "canales" && (
            <TabCanales
              businessId={businessId}
              connection={connection}
              initial={waInitial}
            />
          )}
          {currentTab === "equipo" && (
            <TabEquipo
              businessId={businessId}
              businessName={business.name}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              initialMembers={members}
            />
          )}
        </main>
      </div>
    </div>
  );
}
