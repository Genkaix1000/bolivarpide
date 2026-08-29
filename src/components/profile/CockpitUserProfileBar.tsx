"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserAvatarView } from "@/components/UserAvatarView";
import { ThemeSegmentedControl } from "@/components/ui/ThemeSegmentedControl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useUserProfile } from "@/components/UserProfileProvider";
import { cn } from "@/lib/utils";

interface CockpitUserProfileBarProps {
  onLogout?: () => Promise<void> | void;
  onNavigate?: () => void;
  className?: string;
  showThemeControl?: boolean;
}

export function CockpitUserProfileBar({
  onLogout,
  onNavigate,
  className = "",
  showThemeControl = true,
}: CockpitUserProfileBarProps) {
  const { profile, isAuthenticated } = useUserProfile();
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const handleConfirmLogout = async () => {
    setLogoutConfirm(false);
    if (onLogout) {
      await onLogout();
    }
  };

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      {/* 1. Segmented Theme Pill [ ☀️ Light / 🌙 Dark ] */}
      {showThemeControl && (
        <div className="w-full px-1">
          <ThemeSegmentedControl />
        </div>
      )}

      {/* 2. User Profile Bar / Auth Link (Cockpit / Raycast design with 16px padding, 44px avatar, 12px gap) */}
      {isAuthenticated ? (
        <div
          className={cn(
            "w-full rounded-2xl border transition-all duration-200 p-3.5 flex items-center gap-3",
            logoutConfirm
              ? "bg-red-500/10 border-red-500/30 dark:bg-red-950/30 dark:border-red-900/40"
              : "bg-white dark:bg-[#1c1917] border-[#e8e0d6] dark:border-[#3d3732] shadow-xs"
          )}
        >
          {logoutConfirm ? (
            <div className="flex items-center justify-between w-full">
              <div className="min-w-0 pr-2">
                <p className="text-[13px] font-bold text-red-700 dark:text-red-300 truncate">
                  ¿Cerrar sesión?
                </p>
                <p className="text-[11px] text-red-600/80 dark:text-red-400/80 truncate">
                  Podés volver cuando quieras
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setLogoutConfirm(false)}
                  aria-label="Cancelar"
                  className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#2a2623] hover:bg-gray-200 dark:hover:bg-[#38332f] text-gray-600 dark:text-gray-300 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <MaterialSymbol icon="close" size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmLogout()}
                  aria-label="Confirmar cerrar sesión"
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Salir
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 44px Avatar (size="md" is 44px / w-11 h-11) */}
              <div className="shrink-0">
                <UserAvatarView avatar={profile.avatar} size="md" />
              </div>

              {/* Middle User Info (12px gap) */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="font-bold text-[13px] leading-tight text-gray-900 dark:text-gray-100 truncate">
                    {profile.name || "Usuario"}
                  </p>
                  {profile.identityVerified && (
                    <span title="Identidad verificada" className="inline-flex text-[#9a0002] dark:text-red-400 shrink-0">
                      <MaterialSymbol icon="verified" size={14} fill />
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-tight text-gray-400 dark:text-gray-500 truncate mt-0.5">
                  {profile.email || profile.phone || "Sin correo"}
                </p>
              </div>

              {/* Right Logout Icon Button [ ⮐ ] */}
              <button
                type="button"
                onClick={() => setLogoutConfirm(true)}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer shrink-0"
              >
                <MaterialSymbol icon="logout" size={20} />
              </button>
            </>
          )}
        </div>
      ) : (
        <Link
          href="/login"
          onClick={onNavigate}
          className="w-full rounded-2xl border border-[#e8e0d6] dark:border-[#3d3732] bg-white dark:bg-[#1c1917] p-3.5 flex items-center justify-between shadow-xs hover:border-[#9a0002]/30 transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#9a0002]/10 dark:bg-[#9a0002]/20 text-[#9a0002] dark:text-red-400 flex items-center justify-center shrink-0">
              <MaterialSymbol icon="login" size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[13px] text-gray-900 dark:text-gray-100 group-hover:text-[#9a0002] transition-colors">
                Iniciar sesión
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Guardá tus favoritos y pedidos
              </p>
            </div>
          </div>
          <MaterialSymbol icon="chevron_right" size={20} className="text-gray-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      )}
    </div>
  );
}
