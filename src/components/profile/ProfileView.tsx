"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { UserAvatarView } from "@/components/UserAvatarView";
import { AvatarPickerModal } from "@/components/AvatarPickerModal";
import { BadgeDetailModal } from "@/components/BadgeDetailModal";
import { ThemeToggleNavBtn } from "@/components/Navbar";
import { useUserProfile } from "@/components/UserProfileProvider";
import { UserAwardBadge, getRarityColor } from "@/lib/userProfile";
import { flashToast } from "@/components/FlashToast";
import { DriverApplicationModal } from "./DriverApplicationModal";
import { getMyDriverProfileAction } from "@/lib/delivery/profileActions";
import type { MyDriverProfileView } from "@/lib/delivery/profileActions";
import { ProfileSection } from "./ProfileSection";
import { IdentityVerificationPanel, profileInputClass } from "./IdentityVerificationPanel";
import { ChangePasswordSection } from "./ChangePasswordSection";
import { createClient } from "@/lib/supabase/client";
import { usePwaPush } from "@/hooks/usePwaPush";

const FAQS = [
  {
    q: "¿Cómo sigo mi pedido?",
    a: "En la pantalla principal ves el estado del pedido y cuándo está en camino.",
  },
  {
    q: "¿Cómo pago?",
    a: "Depende del local: efectivo al recibir, Mercado Pago o transferencia. Lo elegís al confirmar el pedido.",
  },
  {
    q: "¿Cómo sumo mi negocio?",
    a: "Entrá en «Sumar mi negocio» en Centro de ayuda o en bolivarpide.com/negocio/registro.",
  },
  {
    q: "¿Quién reparte los pedidos?",
    a: "Repartidores de Bolívar y, en algunos locales, el equipo del comercio. Al pedir ves si es delivery o retiro en el local.",
  },
];

interface ProfileViewProps {
  onManageAddresses?: () => void;
  savedAddressesCount?: number;
  currentAddressLabel?: string;
}

export function ProfileView({
  onManageAddresses,
  savedAddressesCount = 0,
  currentAddressLabel,
}: ProfileViewProps) {
  const { profile, updateAvatar, updateProfile, persistProfile, isAuthenticated, hasActiveBusiness, logout } =
    useUserProfile();
  const searchParams = useSearchParams();
  const verifyDniHandled = useRef(false);
  const { supported: pushSupported, state: pushState, active: pushActive, enable: enablePush, disable: disablePush } =
    usePwaPush();

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [autoOpenVerifyModal, setAutoOpenVerifyModal] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<UserAwardBadge | null>(null);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [driverProfile, setDriverProfile] = useState<MyDriverProfileView | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const driverStatus = driverProfile?.exists ? (driverProfile.status ?? null) : null;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  const [ordersCount, setOrdersCount] = useState<number | null>(null);

  useEffect(() => {
    const parts = (profile.name || "").trim().split(/\s+/);
    queueMicrotask(() => {
      setFirstName(profile.firstName || parts[0] || "");
      setLastName(profile.lastName || parts.slice(1).join(" ") || "");
      setPhone(profile.phone || "");
    });
  }, [profile]);

  useEffect(() => {
    const section = searchParams.get("section");
    if (section) queueMicrotask(() => setOpenSection(section));
  }, [searchParams]);

  useEffect(() => {
    let alive = true;
    getMyDriverProfileAction()
      .then((p) => {
        if (alive) setDriverProfile(p ?? { exists: false });
      })
      .catch(() => {
        if (alive) setDriverProfile({ exists: false });
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (verifyDniHandled.current) return;
    if (searchParams.get("verify") !== "dni") return;
    if (!isAuthenticated || profile.id === "guest") return;

    verifyDniHandled.current = true;
    queueMicrotask(() => {
      setOpenSection("personal");
      if (!profile.identityVerified) setAutoOpenVerifyModal(true);
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("verify");
    const q = params.toString();
    window.history.replaceState(null, "", q ? `/?${q}` : "/");
  }, [searchParams, isAuthenticated, profile.id, profile.identityVerified]);

  useEffect(() => {
    if (!isAuthenticated || profile.id === "guest") {
      queueMicrotask(() => setOrdersCount(0));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { count, error } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("customer_user_id", profile.id);
        if (!cancelled && !error) setOrdersCount(count ?? 0);
      } catch {
        if (!cancelled) setOrdersCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, profile.id]);

  const toggleSection = (id: string) => {
    setOpenSection((cur) => (cur === id ? null : id));
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPersonal(true);
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || profile.name;
    const nextProfile = {
      ...profile,
      name: fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
    };
    updateProfile(nextProfile);
    try {
      await persistProfile(nextProfile);
      flashToast("Datos actualizados.");
    } catch {
      flashToast("Error al guardar.");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleNotifToggle = async (
    key: "notificationOrders" | "notificationPromos" | "notificationWhatsapp",
  ) => {
    const nextProfile = { ...profile, [key]: !profile[key] };
    updateProfile(nextProfile);
    try {
      await persistProfile(nextProfile);
      flashToast("Preferencia guardada.");
    } catch {
      flashToast("Error al guardar.");
    }
  };

  const totalBadges = profile.awardedBadges?.length || 0;

  return (
    <div className="max-w-md mx-auto py-2 px-4 pb-6 animate-fade-in space-y-6">
      <div className="flex flex-col items-center text-center pt-2">
        <div className="relative inline-block mb-3">
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(true)}
            aria-label="Cambiar avatar"
            className="cursor-pointer relative block transition-transform duration-200 active:scale-95 group hover:opacity-95"
          >
            <UserAvatarView avatar={profile.avatar} size="lg" showBorder />
            <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#9a0002] text-white flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-[#1c1917] group-hover:scale-110 transition-transform">
              <MaterialSymbol icon="edit" size={14} />
            </span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-[20px] font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {profile.name || "Invitado"}
          </h2>
          {profile.identityVerified && (
            <span title="Identidad verificada" className="inline-flex text-[#9a0002] dark:text-red-400">
              <MaterialSymbol icon="verified" size={18} fill />
            </span>
          )}
        </div>

        <p className="text-[13px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">
          {profile.email || "Sin sesión iniciada"}
        </p>

        {!isAuthenticated && (
          <Link
            href="/login"
            className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#9a0002] text-white shadow-sm hover:brightness-110 transition-all"
          >
            <MaterialSymbol icon="login" size={13} />
            <span>Iniciar sesión</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-[22px] bg-white dark:bg-[#231f1c] border border-[#e8e0d6] dark:border-[#3d3732] shadow-xs flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-1.5">
            <MaterialSymbol icon="shopping_bag" size={18} />
          </div>
          <span className="text-[15px] font-extrabold text-gray-900 dark:text-gray-100 leading-none">
            {ordersCount !== null ? ordersCount : "-"}
          </span>
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
            Pedidos
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (profile.awardedBadges?.length) setSelectedBadge(profile.awardedBadges[0]);
          }}
          className="p-3.5 rounded-[22px] bg-white dark:bg-[#231f1c] border border-[#e8e0d6] dark:border-[#3d3732] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-[#9a0002]/40 transition-all group"
        >
          <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <MaterialSymbol icon="military_tech" size={18} fill />
          </div>
          <span className="text-[15px] font-extrabold text-gray-900 dark:text-gray-100 leading-none">
            {totalBadges}
          </span>
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
            Insignias
          </span>
        </button>

        <div className="p-3.5 rounded-[22px] bg-white dark:bg-[#231f1c] border border-[#e8e0d6] dark:border-[#3d3732] shadow-xs flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
            <MaterialSymbol icon={profile.identityVerified ? "verified" : "badge"} size={18} fill={profile.identityVerified} />
          </div>
          <span className="text-[15px] font-extrabold text-gray-900 dark:text-gray-100 leading-none">
            {profile.identityVerified ? "✓" : "—"}
          </span>
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
            {profile.identityVerified ? "Verificado" : "DNI"}
          </span>
        </div>
      </div>

      {hasActiveBusiness && (
        <Link
          href="/negocio"
          className="flex items-center justify-between p-4 rounded-[22px] bg-gradient-to-r from-[#9a0002] to-[#700001] text-white shadow-md shadow-[#9a0002]/20 hover:brightness-105 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <MaterialSymbol icon="storefront" size={22} fill />
            </div>
            <div>
              <h4 className="text-[14px] font-bold">Mi comercio</h4>
              <p className="text-[11px] text-white/80">Panel de pedidos y administración</p>
            </div>
          </div>
          <MaterialSymbol icon="arrow_forward" size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      <div className="rounded-[26px] bg-white dark:bg-[#231f1c] border border-[#e8e0d6] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.08)] overflow-hidden">
        <ProfileSection
          icon="person"
          title="Personal"
          subtitle="Nombre, WhatsApp y verificación de DNI"
          badge={profile.identityVerified ? "Verificado" : undefined}
          open={openSection === "personal"}
          onToggle={() => toggleSection("personal")}
        >
          <form onSubmit={(e) => void handleSavePersonal(e)} className="space-y-3 pt-3">
            <IdentityVerificationPanel
              autoOpenModal={autoOpenVerifyModal}
              onAutoOpenConsumed={() => setAutoOpenVerifyModal(false)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ej. Juan"
                  className={profileInputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ej. Pérez"
                  className={profileInputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. +54 9 2314 123456"
                className={profileInputClass}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Email
              </label>
              <input
                type="email"
                disabled
                value={profile.email || "Sin email"}
                className={`${profileInputClass} bg-stone-100/70 text-gray-500 dark:bg-[#2a2623]/40 cursor-not-allowed`}
              />
            </div>

            <button
              type="submit"
              disabled={isSavingPersonal}
              className="w-full py-2.5 rounded-xl bg-[#9a0002] text-white text-[13px] font-bold shadow-md shadow-[#9a0002]/25 hover:brightness-110 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <MaterialSymbol icon="save" size={16} />
              {isSavingPersonal ? "Guardando…" : "Guardar datos"}
            </button>
          </form>
        </ProfileSection>

        {isAuthenticated && (
          <ProfileSection
            icon="lock"
            title="Seguridad"
            subtitle="Cambiá tu contraseña de acceso"
            open={openSection === "security"}
            onToggle={() => toggleSection("security")}
          >
            <ChangePasswordSection />
          </ProfileSection>
        )}

        <ProfileSection
          icon="location_on"
          title="Mis direcciones"
          subtitle={
            currentAddressLabel ||
            (savedAddressesCount > 0 ? `${savedAddressesCount} guardadas` : "Agregar domicilio de entrega")
          }
          open={openSection === "addresses"}
          onToggle={() => toggleSection("addresses")}
        >
          <div className="pt-3 space-y-3">
            <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">
              Tus direcciones se usan al pedir delivery. Podés tener varias y elegir la predeterminada.
            </p>
            <button
              type="button"
              onClick={() => onManageAddresses?.()}
              className="w-full py-2.5 rounded-xl border border-[#9a0002]/30 bg-[#9a0002]/5 text-[#9a0002] dark:text-red-300 text-[13px] font-bold hover:bg-[#9a0002]/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <MaterialSymbol icon="edit_location" size={16} />
              Gestionar direcciones
            </button>
          </div>
        </ProfileSection>

        <ProfileSection
          icon="notifications"
          title="Notificaciones"
          subtitle="Pedidos y promociones"
          open={openSection === "notifications"}
          onToggle={() => toggleSection("notifications")}
        >
          <div className="pt-3 space-y-2.5">
            {[
              {
                key: "notificationOrders" as const,
                icon: "moped",
                title: "Estado de pedidos",
                desc: "Cuando el local prepara o el repartidor sale.",
                on: profile.notificationOrders !== false,
              },
              {
                key: "notificationPromos" as const,
                icon: "local_offer",
                title: "Promociones",
                desc: "Descuentos y ofertas de locales.",
                on: profile.notificationPromos === true,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="p-3 rounded-2xl bg-white dark:bg-[#231f1c] border border-[#e8e0d6] dark:border-[#3d3732] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MaterialSymbol icon={item.icon} size={18} className="text-[#9a0002] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{item.title}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleNotifToggle(item.key)}
                  aria-label={`Alternar ${item.title}`}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    item.on ? "bg-[#9a0002]" : "bg-gray-300 dark:bg-stone-700"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition ${
                      item.on ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
            {pushSupported && (
              <div className="p-3 rounded-2xl bg-white dark:bg-[#231f1c] border border-[#e8e0d6] dark:border-[#3d3732] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MaterialSymbol icon={pushActive ? "notifications_active" : "notifications"} size={18} className="text-[#9a0002] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                      Notificaciones push
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {pushState === "denied"
                        ? "Denegado en el navegador. Permitilo desde sus ajustes."
                        : pushActive
                          ? "Avisos del sistema aunque la app esté cerrada."
                          : "Permití avisos fuera de la app."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void (pushActive ? disablePush() : enablePush())}
                  disabled={pushState === "denied"}
                  aria-label={`Alternar Notificaciones push`}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    pushActive ? "bg-[#9a0002]" : "bg-gray-300 dark:bg-stone-700"
                  } ${pushState === "denied" ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition ${
                      pushActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </ProfileSection>

        <ProfileSection
          icon="dark_mode"
          title="Apariencia"
          subtitle="Modo claro u oscuro"
          open={openSection === "appearance"}
          onToggle={() => toggleSection("appearance")}
        >
          <div className="pt-3 flex items-center justify-between gap-4 p-3 rounded-2xl bg-white dark:bg-[#231f1c] border border-[#e8e0d6] dark:border-[#3d3732]">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Tema de la app</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Tocá el botón para cambiar</p>
            </div>
            <div className="flex shrink-0 items-center justify-center">
              <ThemeToggleNavBtn className="h-10 w-10 shrink-0" clipId="profile-theme" />
            </div>
          </div>
        </ProfileSection>

        <ProfileSection
          icon="help"
          title="Centro de ayuda"
          subtitle="Preguntas frecuentes y oportunidades"
          open={openSection === "help"}
          onToggle={() => toggleSection("help")}
        >
          <div className="pt-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href="/negocio/registro"
                className="p-3 rounded-2xl bg-[#9a0002]/8 hover:bg-[#9a0002]/15 border border-[#9a0002]/20 flex items-center gap-2.5 transition-all"
              >
                <span className="w-8 h-8 rounded-xl bg-[#9a0002]/15 text-[#9a0002] dark:text-red-400 flex items-center justify-center shrink-0">
                  <MaterialSymbol icon="storefront" size={18} fill />
                </span>
                <div className="min-w-0">
                  <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100 block truncate">
                    Sumar mi negocio
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                    Carta y pedidos online
                  </span>
                </div>
              </Link>

              {driverStatus === "approved" ? (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MaterialSymbol icon="verified" size={18} fill />
                  </span>
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100 block truncate">
                      Repartidor aprobado
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                      Ya sos parte del reparto de BolivarPide
                    </span>
                  </div>
                </div>
              ) : driverStatus === "pending_review" ? (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <MaterialSymbol icon="hourglass_top" size={18} fill />
                  </span>
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100 block truncate">
                      Postulación en revisión
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                      Te avisamos cuando esté aprobada
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(true)}
                  className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 flex items-center gap-2.5 transition-all cursor-pointer text-left"
                >
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <MaterialSymbol icon="sports_motorsports" size={18} fill />
                  </span>
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100 block truncate">
                      {driverStatus === "rejected" ? "Reintentar postulación" : "Ser repartidor"}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                      {driverStatus === "rejected"
                        ? driverProfile?.rejectionReason ?? "Tu postulación fue rechazada"
                        : "Horarios flexibles"}
                    </span>
                  </div>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-0.5">Preguntas frecuentes</p>
              {FAQS.map((faq, idx) => {
                const open = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#e8e0d6] dark:border-[#3d3732] bg-white dark:bg-[#231f1c] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : idx)}
                      className="w-full p-3 flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100 pr-2">{faq.q}</span>
                      <MaterialSymbol
                        icon="expand_more"
                        size={18}
                        className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                    {open && (
                      <p className="px-3 pb-3 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed border-t border-[#f0ebe4] dark:border-[#2a2623] pt-2">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ProfileSection>
      </div>

      {profile.awardedBadges && profile.awardedBadges.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <MaterialSymbol icon="military_tech" size={18} className="text-[#9a0002]" fill />
              <h4 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Insignias</h4>
            </div>
            <span className="text-[11px] font-bold text-[#9a0002] bg-[#9a0002]/10 px-2 py-0.5 rounded-full">
              {profile.awardedBadges.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {profile.awardedBadges.map((badge) => {
              const style = getRarityColor(badge.rarity);
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setSelectedBadge(badge)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 hover:shadow-md bg-[#faf6f1] dark:bg-[#231f1c] ${style.border} hover:border-[#9a0002]/40 cursor-pointer`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${style.bg} ${style.border}`}>
                    {badge.emoji ? (
                      <span className="text-lg">{badge.emoji}</span>
                    ) : (
                      <MaterialSymbol icon={badge.icon} size={18} className={style.text} fill />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-[12px] text-gray-900 dark:text-gray-100 truncate">{badge.title}</h5>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
                      {badge.rarity}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isAuthenticated && (
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
        >
          <MaterialSymbol icon="logout" size={18} />
          <span>Cerrar sesión</span>
        </button>
      )}

      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={profile.avatar}
        onSave={(av) => {
          updateAvatar(av);
          setIsAvatarModalOpen(false);
        }}
      />

      <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />

      <DriverApplicationModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        initialStatus={driverStatus}
        initialVehicle={driverProfile?.vehicleType ?? null}
        onSubmitted={() => {
          void getMyDriverProfileAction().then((p) => setDriverProfile(p ?? { exists: false }));
        }}
      />
    </div>
  );
}
