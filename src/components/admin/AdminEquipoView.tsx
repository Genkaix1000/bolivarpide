"use client";

import { useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { UserAvatarView } from "@/components/UserAvatarView";
import { ShellPageHeader } from "@/components/shell/ShellPageHeader";
import {
  assignPlatformRole,
  changePlatformRole,
  revokePlatformRole,
} from "@/lib/admin/teamActions";
import type { PlatformMember } from "@/lib/admin/queries";
import type { PlatformRole } from "@/lib/admin/platform";
import type { UserAvatar } from "@/lib/userProfile";
import { cn } from "@/lib/utils";

const COVERS = [
  "from-[#9a0002] via-[#6b0001] to-[#3a2019]",
  "from-[#5d4037] via-[#3a2a24] to-[#1c1612]",
  "from-[#343058] via-[#2a2648] to-[#14121f]",
  "from-[#0f766e] via-[#115e59] to-[#134e4a]",
  "from-[#b45309] via-[#92400e] to-[#451a03]",
  "from-[#7c3aed] via-[#5b21b6] to-[#2e1065]",
  "from-[#be123c] via-[#9f1239] to-[#4c0519]",
  "from-[#0369a1] via-[#075985] to-[#0c4a6e]",
];

function coverGradient(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COVERS[h % COVERS.length];
}

function PlatformMemberCard({
  member,
  isSelf,
  onManage,
}: {
  member: PlatformMember;
  isSelf: boolean;
  onManage: () => void;
}) {
  const name = member.displayName || member.email?.split("@")[0] || member.user_id.slice(0, 6);
  const avatar: UserAvatar = member.avatar ?? {
    type: "initials",
    value: name.slice(0, 2).toUpperCase(),
    gradientId: "cherry",
  };
  const isSuperadmin = member.role === "superadmin";

  return (
    <div className="group relative flex flex-col justify-between rounded-[24px] bg-white dark:bg-[#1c1917] border border-stone-200/80 dark:border-[#332e2a] hover:border-[#9a0002]/40 dark:hover:border-[#9a0002]/40 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Top Banner with cover gradient, status badge and role badge */}
      <div className="relative aspect-[16/7] w-full shrink-0 overflow-hidden bg-[#2a201c]">
        <div
          className={cn(
            "h-full w-full bg-gradient-to-br transition-transform duration-500 group-hover:scale-105",
            coverGradient(member.user_id),
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/30" />

        {/* Top badges inside banner */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Staff activo
          </span>

          <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full">
            {isSuperadmin ? "SUPERADMIN" : "SOPORTE"}
          </span>
        </div>
      </div>

      {/* Profile Avatar overlapping banner */}
      <div className="relative -mt-9 z-10 flex flex-col items-center px-5 text-center">
        <div className="relative w-[72px] h-[72px] rounded-full p-1 bg-white dark:bg-[#1c1917] shadow-lg group-hover:scale-105 transition-transform duration-300">
          <UserAvatarView
            avatar={avatar}
            variant="button"
            className="!h-full !w-full [&_span]:!text-[20px]"
          />
        </div>

        {/* Member Name */}
        <h3 className="mt-2.5 flex max-w-full items-center justify-center gap-1.5 text-base font-black text-stone-900 dark:text-stone-100 group-hover:text-[#9a0002] transition-colors line-clamp-1">
          <span className="truncate">{name}</span>
          {member.isVerified && (
            <span title="Identidad verificada" className="inline-flex shrink-0">
              <MaterialSymbol icon="verified" size={16} className="text-sky-500" />
            </span>
          )}
          {isSelf && (
            <span className="shrink-0 text-[10px] font-bold text-stone-400">(vos)</span>
          )}
        </h3>

        {/* Email */}
        <p className="mt-0.5 line-clamp-1 text-xs font-medium text-stone-400">
          {member.email || "Sin email"}
        </p>

        {/* 3 Stats Strip: Estado | Jerarquía | Permisos (Matching BusinessCard) */}
        <div className="flex w-full items-center justify-center mt-3 pt-3 border-t border-stone-100 dark:border-[#2a2623]">
          <div className="flex flex-1 flex-col items-center">
            <span className="text-[13px] font-extrabold text-stone-900 dark:text-stone-100">
              Activo
            </span>
            <span className="text-[10px] font-medium text-stone-400">Estado</span>
          </div>

          <div className="h-7 w-px bg-stone-200 dark:bg-stone-800" />

          <div className="flex flex-1 flex-col items-center">
            <span className="text-[13px] font-extrabold text-stone-900 dark:text-stone-100">
              {isSuperadmin ? "Superadmin" : "Soporte"}
            </span>
            <span className="text-[10px] font-medium text-stone-400">Jerarquía</span>
          </div>

          <div className="h-7 w-px bg-stone-200 dark:bg-stone-800" />

          <div className="flex flex-1 flex-col items-center">
            <span className="flex items-center gap-0.5 text-[13px] font-extrabold text-stone-900 dark:text-stone-100">
              {isSuperadmin ? "Total" : "Operativo"}
            </span>
            <span className="text-[10px] font-medium text-stone-400">Acceso</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-4 px-5 py-3 border-t border-stone-100 dark:border-[#2a2623] bg-stone-50/50 dark:bg-[#231f1c]/40 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
          <MaterialSymbol
            icon={isSuperadmin ? "admin_panel_settings" : "support_agent"}
            size={16}
            className={isSuperadmin ? "text-[#9a0002]" : "text-teal-600"}
          />
          {isSuperadmin ? "Superadmin" : "Soporte de red"}
        </span>

        {isSelf ? (
          <span className="text-[10px] font-bold text-stone-400">
            Tu cuenta
          </span>
        ) : (
          <button
            type="button"
            onClick={onManage}
            className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-[#9a0002] hover:underline"
          >
            <span>Gestionar</span>
            <MaterialSymbol icon="arrow_forward" size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function InvitePlatformMemberCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex flex-col items-center justify-center min-h-[310px] p-6 rounded-[24px] border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-[#9a0002] dark:hover:border-[#9a0002] bg-stone-50/50 dark:bg-[#1a1715]/50 hover:bg-white dark:hover:bg-[#1f1b18] transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer text-center w-full"
    >
      {/* Circle with Person Add icon - styled identical to CreateBusinessCard */}
      <div className="relative mb-5 flex items-center justify-center">
        <div className="absolute inset-0 -m-2 rounded-full border-2 border-dashed border-[#9a0002]/40 dark:border-[#9a0002]/40 group-hover:border-[#9a0002] group-hover:scale-105 transition-all duration-300" />
        <div className="w-14 h-14 rounded-full bg-[#9a0002] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
          <MaterialSymbol icon="person_add" size={26} className="transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>

      <h3 className="text-[15px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#9a0002] transition-colors">
        Asignar miembro
      </h3>

      <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 max-w-[200px] leading-relaxed">
        Nombrá un nuevo superadmin u operador de soporte
      </p>

      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#9a0002] bg-[#9a0002]/10 dark:bg-[#9a0002]/20 px-3.5 py-1.5 rounded-full group-hover:bg-[#9a0002] group-hover:text-white transition-colors">
        <span>Asignar</span>
        <MaterialSymbol icon="arrow_forward" size={14} />
      </span>
    </button>
  );
}

export function AdminEquipoView({
  currentUserId,
  initialMembers,
}: {
  currentUserId: string;
  initialMembers: PlatformMember[];
}) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [managingMember, setManagingMember] = useState<PlatformMember | null>(null);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const count = initialMembers.length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <ShellPageHeader
        title="Equipo de plataforma"
        description="Superadmins y operadores de soporte técnico de la red BolivarPide."
        badge={`${count} ${count === 1 ? "miembro" : "miembros"}`}
        as="h2"
      />

      {/* Grid of platform members + Assign card */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <InvitePlatformMemberCard onOpen={() => setInviteModalOpen(true)} />

        {initialMembers.map((m) => (
          <PlatformMemberCard
            key={m.user_id}
            member={m}
            isSelf={m.user_id === currentUserId}
            onManage={() => setManagingMember(m)}
          />
        ))}
      </div>

      {/* Assign Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-[28px] border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1c1917] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9a0002] text-white shadow-md">
                  <MaterialSymbol icon="person_add" size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100">
                    Asignar rol de plataforma
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    El usuario debe haber iniciado sesión al menos una vez
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInviteModalOpen(false);
                  setMsg(null);
                }}
                className="cursor-pointer rounded-full p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 transition"
              >
                <MaterialSymbol icon="close" size={18} />
              </button>
            </div>

            <form
              action={async (fd) => {
                setPending(true);
                setMsg(null);
                try {
                  await assignPlatformRole(fd);
                  setMsg({ type: "ok", text: "Rol de plataforma asignado correctamente" });
                  setTimeout(() => {
                    setInviteModalOpen(false);
                    setMsg(null);
                  }, 1200);
                } catch (err: unknown) {
                  setMsg({
                    type: "err",
                    text: err instanceof Error ? err.message : "Error al asignar rol",
                  });
                } finally {
                  setPending(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Correo electrónico del usuario
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  autoFocus
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:ring-2 focus:ring-[#9a0002]/30 dark:border-stone-700 dark:bg-[#231f1c] dark:text-stone-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Rol de plataforma
                </label>
                <select
                  name="role"
                  defaultValue="soporte"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none dark:border-stone-700 dark:bg-[#231f1c] dark:text-stone-100"
                >
                  <option value="soporte">
                    Soporte — Atención de comercios y soporte WhatsApp
                  </option>
                  <option value="superadmin">
                    Superadmin — Acceso total (métricas, comercios, equipo)
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInviteModalOpen(false);
                    setMsg(null);
                  }}
                  className="cursor-pointer px-4 py-2.5 rounded-full border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#9a0002] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#850002] disabled:cursor-not-allowed disabled:opacity-40 shadow-md"
                >
                  {pending ? (
                    <MaterialSymbol icon="progress_activity" size={14} className="animate-spin" />
                  ) : (
                    <>
                      <span>Asignar rol</span>
                      <MaterialSymbol icon="arrow_forward" size={14} />
                    </>
                  )}
                </button>
              </div>

              {msg && (
                <p
                  className={cn(
                    "text-center text-xs font-bold",
                    msg.type === "ok" ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {msg.text}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Manage Member Modal */}
      {managingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-[28px] border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1c1917] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatarView
                  avatar={
                    managingMember.avatar ?? {
                      type: "initials",
                      value: (managingMember.displayName || "?").slice(0, 2).toUpperCase(),
                      gradientId: "cherry",
                    }
                  }
                  variant="button"
                  className="!h-10 !w-10"
                />
                <div className="min-w-0">
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 truncate">
                    {managingMember.displayName || managingMember.email}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {managingMember.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setManagingMember(null);
                  setMsg(null);
                }}
                className="cursor-pointer rounded-full p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 transition"
              >
                <MaterialSymbol icon="close" size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-[#231f1c]/50 p-4 space-y-4">
              <form
                action={async (fd) => {
                  setPending(true);
                  setMsg(null);
                  try {
                    await changePlatformRole(fd);
                    setMsg({ type: "ok", text: "Rol actualizado correctamente" });
                    setTimeout(() => {
                      setManagingMember(null);
                      setMsg(null);
                    }, 1200);
                  } catch (err: unknown) {
                    setMsg({
                      type: "err",
                      text: err instanceof Error ? err.message : "Error al actualizar rol",
                    });
                  } finally {
                    setPending(false);
                  }
                }}
                className="space-y-3"
              >
                <input type="hidden" name="userId" value={managingMember.user_id} />
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  Cambiar rol
                </label>
                <div className="flex gap-2">
                  <select
                    name="role"
                    defaultValue={managingMember.role}
                    className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium dark:border-stone-700 dark:bg-[#231f1c] dark:text-stone-100"
                  >
                    <option value="superadmin">Superadmin</option>
                    <option value="soporte">Soporte</option>
                  </select>
                  <button
                    type="submit"
                    disabled={pending}
                    className="cursor-pointer rounded-xl bg-[#9a0002] px-4 py-2 text-xs font-bold text-white hover:bg-[#850002] transition shadow-xs disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
                <form
                  action={async (fd) => {
                    setPending(true);
                    setMsg(null);
                    try {
                      await revokePlatformRole(fd);
                      setMsg({ type: "ok", text: "Acceso de plataforma revocado" });
                      setTimeout(() => {
                        setManagingMember(null);
                        setMsg(null);
                      }, 1200);
                    } catch (err: unknown) {
                      setMsg({
                        type: "err",
                        text: err instanceof Error ? err.message : "Error al revocar acceso",
                      });
                    } finally {
                      setPending(false);
                    }
                  }}
                >
                  <input type="hidden" name="userId" value={managingMember.user_id} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full cursor-pointer rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100/60 transition"
                  >
                    Revocar acceso de plataforma
                  </button>
                </form>
              </div>
            </div>

            {msg && (
              <p
                className={cn(
                  "text-center text-xs font-bold",
                  msg.type === "ok" ? "text-emerald-600" : "text-red-600",
                )}
              >
                {msg.text}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
