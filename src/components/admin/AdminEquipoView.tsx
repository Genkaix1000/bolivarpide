"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { UserAvatarView } from "@/components/UserAvatarView";
import { HighlightText } from "@/components/search/HighlightText";
import { flashToastUndo } from "@/components/FlashToast";
import { LogoutNavRail } from "@/components/shared/LogoutNavRail";
import { ShellPageHeader } from "@/components/shell/ShellPageHeader";
import {
  assignPlatformRole,
  changePlatformRole,
  revokePlatformRole,
} from "@/lib/admin/teamActions";
import { searchUsersForInviteAction } from "@/lib/business/actions";
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
  onManageRole,
}: {
  member: PlatformMember;
  isSelf: boolean;
  onManageRole: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [hidden, setHidden] = useState(false);

  const name = member.displayName || member.email?.split("@")[0] || member.user_id.slice(0, 6);
  const avatar: UserAvatar = member.avatar ?? {
    type: "initials",
    value: name.slice(0, 2).toUpperCase(),
    gradientId: "cherry",
  };
  const isSuperadmin = member.role === "superadmin";

  async function confirmRemove() {
    if (removing) return;
    setRemoving(true);
    setRemoveConfirm(false);
    
    // Optimistic hide
    setHidden(true);
    
    try {
      const fd = new FormData();
      fd.set("userId", member.user_id);
      await revokePlatformRole(fd);
      
      flashToastUndo({
        message: `${name} removido de la plataforma`,
        onUndo: async () => {
          try {
            // Restore via assign
            const undoFd = new FormData();
            undoFd.set("email", member.email!);
            undoFd.set("role", member.role);
            await assignPlatformRole(undoFd);
            setHidden(false);
          } catch {
            // silent fail on undo
          }
        },
      });
    } catch {
      setHidden(false); // Restore if failed
    } finally {
      setRemoving(false);
    }
  }

  if (hidden) return null;

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative flex flex-col justify-between rounded-[24px] border shadow-sm transition-all duration-300 overflow-hidden",
        removeConfirm
          ? "border-[#9a0002] bg-[#9a0002] shadow-xl"
          : "bg-white dark:bg-[#1c1917] border-stone-200/80 dark:border-[#332e2a] hover:border-[#9a0002]/40 dark:hover:border-[#9a0002]/40 hover:shadow-xl",
      )}
    >
      {/* Top Banner with cover gradient, status badge and role badge */}
      <div className="relative aspect-[16/7] w-full shrink-0 overflow-hidden bg-[#2a201c]">
        {removeConfirm ? (
          <div className="h-full w-full bg-[#850002]" />
        ) : (
          <>
            <div
              className={cn(
                "h-full w-full bg-gradient-to-br transition-transform duration-500 group-hover:scale-105",
                coverGradient(member.user_id),
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/30" />
            
            {/* Top badges inside banner */}
            <div className="absolute inset-x-3 top-3 flex items-center justify-between z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Staff activo
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full shadow-sm">
                {isSuperadmin ? "SUPERADMIN" : "SOPORTE"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Profile Avatar overlapping banner */}
      <div className="relative -mt-9 z-10 flex flex-col items-center px-5 text-center">
        <div
          className={cn(
            "relative w-[72px] h-[72px] rounded-full p-1 shadow-lg transition-transform duration-300",
            removeConfirm ? "bg-[#9a0002]" : "bg-white dark:bg-[#1c1917] group-hover:scale-105",
          )}
        >
          <UserAvatarView
            avatar={avatar}
            variant="button"
            className="!h-full !w-full [&_span]:!text-[20px]"
          />
        </div>

        {/* Member Name */}
        <h3
          className={cn(
            "mt-2.5 flex max-w-full items-center justify-center gap-1.5 text-base font-black transition-colors line-clamp-1",
            removeConfirm
              ? "text-white"
              : "text-stone-900 dark:text-stone-100 group-hover:text-[#9a0002]",
          )}
        >
          <span className="truncate">{name}</span>
          {!removeConfirm && member.isVerified && (
            <span title="Identidad verificada" className="inline-flex shrink-0">
              <MaterialSymbol icon="verified" size={16} className="text-sky-500" />
            </span>
          )}
          {isSelf && (
            <span
              className={cn(
                "shrink-0 text-[10px] font-bold",
                removeConfirm ? "text-white/70" : "text-stone-400",
              )}
            >
              (vos)
            </span>
          )}
        </h3>

        {/* Email */}
        <p
          className={cn(
            "mt-0.5 line-clamp-1 text-xs font-medium",
            removeConfirm ? "text-white/75" : "text-stone-400",
          )}
        >
          {removeConfirm ? "¿Revocar acceso de plataforma?" : member.email || "Sin email"}
        </p>

        {/* 3 Stats Strip: Estado | Jerarquía | Permisos */}
        {!removeConfirm && (
          <div className="flex w-full items-center justify-center mt-3 pt-3 border-t border-stone-100 dark:border-[#2a2623]">
            <div className="flex flex-1 flex-col items-center">
              <span className="text-[13px] font-extrabold text-stone-900 dark:text-stone-100">
                Activo
              </span>
              <span className="text-[10px] font-medium text-stone-400">Estado</span>
            </div>
            <div className="h-7 w-px bg-stone-200 dark:bg-stone-800" />
            <div className="flex flex-1 flex-col items-center cursor-pointer group/role" onClick={!isSelf ? onManageRole : undefined} title={!isSelf ? "Cambiar rol" : undefined}>
              <span className={cn(
                "text-[13px] font-extrabold text-stone-900 dark:text-stone-100",
                !isSelf && "group-hover/role:text-[#9a0002] transition-colors"
              )}>
                {isSuperadmin ? "Superadmin" : "Soporte"}
              </span>
              <span className="text-[10px] font-medium text-stone-400">Jerarquía</span>
            </div>
            <div className="h-7 w-px bg-stone-200 dark:bg-stone-800" />
            <div className="flex flex-1 flex-col items-center">
              <span className="flex items-center gap-0.5 text-[13px] font-extrabold text-stone-900 dark:text-stone-100">
                {member.isVerified ? "Verificada" : "Básica"}
                {member.isVerified && (
                  <MaterialSymbol icon="check" size={12} className="text-sky-500" />
                )}
              </span>
              <span className="text-[10px] font-medium text-stone-400">Identidad</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div
        className={cn(
          "mt-4 px-5 py-3 border-t flex items-center justify-between transition-colors duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          removeConfirm
            ? "border-white/20 bg-[#850002]"
            : "border-stone-100 dark:border-[#2a2623] bg-stone-50/50 dark:bg-[#231f1c]/40",
        )}
      >
        <span
          className={cn(
            "text-[11px] font-semibold flex items-center gap-1.5",
            removeConfirm ? "text-white/90" : "text-stone-500 dark:text-stone-400",
          )}
        >
          <MaterialSymbol
            icon={isSuperadmin ? "admin_panel_settings" : "support_agent"}
            size={16}
            className={
              removeConfirm
                ? "text-white"
                : isSuperadmin
                  ? "text-[#9a0002]"
                  : "text-teal-600"
            }
          />
          {removeConfirm ? "Se puede deshacer" : (isSuperadmin ? "Acceso total" : "Atención de soporte")}
        </span>

        {!isSelf ? (
          <LogoutNavRail
            confirm={removeConfirm}
            onAccent={removeConfirm}
            boundaryRef={cardRef}
            askIcon="person_remove"
            askTitle="Revocar acceso"
            onAsk={() => setRemoveConfirm(true)}
            onCancel={() => setRemoveConfirm(false)}
            onConfirm={() => void confirmRemove()}
          />
        ) : (
          <span
            className={cn(
              "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
              removeConfirm
                ? "bg-white/15 text-white"
                : "text-[#9a0002] bg-[#9a0002]/10 dark:text-red-400 dark:bg-red-400/10",
            )}
          >
            Tu cuenta
          </span>
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
        Buscá y nombrá un nuevo superadmin u operador de soporte
      </p>

      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#9a0002] bg-[#9a0002]/10 dark:bg-[#9a0002]/20 px-3.5 py-1.5 rounded-full group-hover:bg-[#9a0002] group-hover:text-white transition-colors">
        <span>Asignar</span>
        <MaterialSymbol icon="arrow_forward" size={14} />
      </span>
    </button>
  );
}

function InvitePlatformMemberModal({
  isOpen,
  onClose,
  onAssigned,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAssigned: (member: PlatformMember) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<
    Array<{
      userId: string;
      email: string;
      displayName: string;
      avatar: UserAvatar;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<(typeof hits)[number] | null>(null);
  const [role, setRole] = useState("soporte");
  const [inviting, setInviting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected) return;
    const q = query.trim();
    if (q.length < 2) {
      queueMicrotask(() => {
        setHits([]);
        setLoading(false);
      });
      return;
    }
    queueMicrotask(() => setLoading(true));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Reusing the business action search logic as it just searches `auth.users` globally
      void searchUsersForInviteAction("", q) // businessId can be empty string for platform superadmins 
        .then(setHits)
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  if (!isOpen) return null;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setMsg({ type: "err", text: "Buscá y seleccioná un usuario" });
      return;
    }
    setInviting(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.set("email", selected.email);
      fd.set("role", role);
      await assignPlatformRole(fd);
      
      const newMember: PlatformMember = {
        user_id: selected.userId,
        email: selected.email,
        role: role as PlatformRole,
        created_at: new Date().toISOString(),
        displayName: selected.displayName,
        isVerified: false,
        avatar: selected.avatar,
      };

      setMsg({ type: "ok", text: `Rol ${role} asignado a ${selected.displayName}` });
      setTimeout(() => {
        onAssigned(newMember);
        onClose();
        setSelected(null);
        setQuery("");
        setHits([]);
        setMsg(null);
      }, 1200);
    } catch (err: unknown) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Error al asignar" });
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-[28px] border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1c1917] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
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
                Buscá por nombre o correo electrónico
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 transition"
          >
            <MaterialSymbol icon="close" size={18} />
          </button>
        </div>

        {selected ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#9a0002]/25 bg-[#9a0002]/5 px-3.5 py-3 dark:bg-[#9a0002]/10">
            <UserAvatarView avatar={selected.avatar} variant="button" className="!h-10 !w-10" />
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-bold text-stone-900 dark:text-stone-100">
                {selected.displayName}
              </p>
              <p className="truncate text-[11px] text-stone-500">{selected.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setQuery("");
              }}
              className="cursor-pointer rounded-full p-1 text-stone-400 hover:bg-stone-200/80 hover:text-stone-700 dark:hover:bg-stone-800"
              aria-label="Quitar selección"
            >
              <MaterialSymbol icon="close" size={16} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <MaterialSymbol
              icon="search"
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              autoComplete="off"
              autoFocus
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-3 text-xs text-stone-900 outline-none focus:ring-2 focus:ring-[#9a0002]/30 dark:border-stone-700 dark:bg-[#231f1c] dark:text-stone-100"
            />
            {loading && (
              <MaterialSymbol
                icon="progress_activity"
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-stone-400"
              />
            )}
          </div>
        )}

        {!selected && query.trim().length >= 2 && !loading && hits.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-200 p-4 text-center dark:border-stone-800">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              No se encontraron usuarios activos con ese criterio.
            </p>
          </div>
        )}

        {!selected && hits.length > 0 && (
          <ul className="max-h-48 overflow-y-auto rounded-xl border border-stone-200 shadow-sm dark:border-stone-800 custom-scrollbar">
            {hits.map((h) => (
              <li key={h.userId}>
                <button
                  type="button"
                  onClick={() => setSelected(h)}
                  className="flex w-full cursor-pointer items-center gap-3 border-b border-stone-100 p-2.5 text-left hover:bg-stone-50 last:border-0 dark:border-stone-800 dark:hover:bg-[#231f1c]"
                >
                  <UserAvatarView avatar={h.avatar} variant="button" className="!h-8 !w-8 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-stone-900 dark:text-stone-100">
                      <HighlightText text={h.displayName || h.email.split("@")[0]} query={query} />
                    </p>
                    <p className="truncate text-[10px] text-stone-500">
                      <HighlightText text={h.email} query={query} />
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Jerarquía asignada
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={cn(
                  "relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors",
                  role === "soporte"
                    ? "border-[#9a0002] bg-[#9a0002]/5 dark:bg-[#9a0002]/10"
                    : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-700 dark:bg-[#1c1917] dark:hover:border-stone-600",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value="soporte"
                  checked={role === "soporte"}
                  onChange={(e) => setRole(e.target.value)}
                  className="peer sr-only"
                />
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-bold",
                      role === "soporte" ? "text-[#9a0002]" : "text-stone-700 dark:text-stone-300",
                    )}
                  >
                    Soporte
                  </span>
                  <MaterialSymbol
                    icon={role === "soporte" ? "radio_button_checked" : "radio_button_unchecked"}
                    size={16}
                    className={role === "soporte" ? "text-[#9a0002]" : "text-stone-400"}
                  />
                </div>
                <p className="text-[10px] text-stone-500">
                  Atención de comercios y acceso a chat WhatsApp.
                </p>
              </label>

              <label
                className={cn(
                  "relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors",
                  role === "superadmin"
                    ? "border-[#9a0002] bg-[#9a0002]/5 dark:bg-[#9a0002]/10"
                    : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-700 dark:bg-[#1c1917] dark:hover:border-stone-600",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value="superadmin"
                  checked={role === "superadmin"}
                  onChange={(e) => setRole(e.target.value)}
                  className="peer sr-only"
                />
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-bold",
                      role === "superadmin"
                        ? "text-[#9a0002]"
                        : "text-stone-700 dark:text-stone-300",
                    )}
                  >
                    Superadmin
                  </span>
                  <MaterialSymbol
                    icon={role === "superadmin" ? "radio_button_checked" : "radio_button_unchecked"}
                    size={16}
                    className={role === "superadmin" ? "text-[#9a0002]" : "text-stone-400"}
                  />
                </div>
                <p className="text-[10px] text-stone-500">
                  Acceso total (métricas, comercios, equipo).
                </p>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2.5 rounded-full border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={inviting || !selected}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#9a0002] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#850002] disabled:cursor-not-allowed disabled:opacity-40 shadow-md"
            >
              {inviting ? (
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
  const [managingRoleMember, setManagingRoleMember] = useState<PlatformMember | null>(null);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // optimistically store members
  const [members, setMembers] = useState<PlatformMember[]>(initialMembers);
  const count = members.length;

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

        {members.map((m) => (
          <PlatformMemberCard
            key={m.user_id}
            member={m}
            isSelf={m.user_id === currentUserId}
            onManageRole={() => setManagingRoleMember(m)}
          />
        ))}
      </div>

      {/* Assign Member Rich Modal */}
      <InvitePlatformMemberModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onAssigned={(newMember) => {
          setMembers((prev) => {
            const idx = prev.findIndex((m) => m.user_id === newMember.user_id);
            if (idx >= 0) {
              const cp = [...prev];
              cp[idx] = newMember;
              return cp;
            }
            return [newMember, ...prev];
          });
        }}
      />

      {/* Manage Role Modal (for changing roles without deleting) */}
      {managingRoleMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-[28px] border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1c1917] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatarView
                  avatar={
                    managingRoleMember.avatar ?? {
                      type: "initials",
                      value: (managingRoleMember.displayName || "?").slice(0, 2).toUpperCase(),
                      gradientId: "cherry",
                    }
                  }
                  variant="button"
                  className="!h-10 !w-10"
                />
                <div className="min-w-0">
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 truncate">
                    Modificar jerarquía
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {managingRoleMember.displayName || managingRoleMember.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setManagingRoleMember(null);
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
                  await changePlatformRole(fd);
                  const newRole = fd.get("role") as PlatformRole;
                  setMembers((prev) =>
                    prev.map((m) => (m.user_id === managingRoleMember.user_id ? { ...m, role: newRole } : m))
                  );
                  setMsg({ type: "ok", text: "Jerarquía actualizada correctamente" });
                  setTimeout(() => {
                    setManagingRoleMember(null);
                    setMsg(null);
                  }, 1200);
                } catch (err: unknown) {
                  setMsg({
                    type: "err",
                    text: err instanceof Error ? err.message : "Error al guardar los cambios",
                  });
                } finally {
                  setPending(false);
                }
              }}
              className="space-y-4"
            >
              <input type="hidden" name="userId" value={managingRoleMember.user_id} />

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Jerarquía asignada
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={cn(
                      "relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors",
                      "hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-[#1c1917]",
                      managingRoleMember.role === "soporte"
                        ? "border-[#9a0002] bg-[#9a0002]/5 dark:bg-[#9a0002]/10"
                        : "border-stone-200 dark:border-stone-700"
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="soporte"
                      defaultChecked={managingRoleMember.role === "soporte"}
                      className="peer sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-300 peer-checked:text-[#9a0002]">
                        Soporte
                      </span>
                      <MaterialSymbol
                        icon="radio_button_unchecked"
                        size={16}
                        className="text-stone-400 peer-checked:text-[#9a0002] peer-checked:hidden"
                      />
                      <MaterialSymbol
                        icon="radio_button_checked"
                        size={16}
                        className="text-[#9a0002] hidden peer-checked:block"
                      />
                    </div>
                    <p className="text-[10px] text-stone-500">
                      Atención de comercios y acceso a chat WhatsApp.
                    </p>
                  </label>

                  <label
                    className={cn(
                      "relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors",
                      "hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-[#1c1917]",
                      managingRoleMember.role === "superadmin"
                        ? "border-[#9a0002] bg-[#9a0002]/5 dark:bg-[#9a0002]/10"
                        : "border-stone-200 dark:border-stone-700"
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="superadmin"
                      defaultChecked={managingRoleMember.role === "superadmin"}
                      className="peer sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-300 peer-checked:text-[#9a0002]">
                        Superadmin
                      </span>
                      <MaterialSymbol
                        icon="radio_button_unchecked"
                        size={16}
                        className="text-stone-400 peer-checked:text-[#9a0002] peer-checked:hidden"
                      />
                      <MaterialSymbol
                        icon="radio_button_checked"
                        size={16}
                        className="text-[#9a0002] hidden peer-checked:block"
                      />
                    </div>
                    <p className="text-[10px] text-stone-500">
                      Acceso total (métricas, comercios, equipo).
                    </p>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setManagingRoleMember(null);
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
                      <span>Guardar</span>
                      <MaterialSymbol icon="save" size={14} />
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
    </div>
  );
}
