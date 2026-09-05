"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { UserAvatarView } from "@/components/UserAvatarView";
import { HighlightText } from "@/components/search/HighlightText";
import { flashToastUndo } from "@/components/FlashToast";
import { LogoutNavRail } from "@/components/shared/LogoutNavRail";
import {
  inviteMember,
  leaveBusiness,
  removeMember,
  restoreMember,
  searchUsersForInviteAction,
} from "@/lib/business/actions";
import { ShellPageHeader } from "@/components/shell/ShellPageHeader";
import type { UserAvatar } from "@/lib/userProfile";
import { cn } from "@/lib/utils";

export type MemberItem = {
  id: string;
  role: string;
  status: string;
  user_id: string;
  invited_at: string | null;
  displayName?: string;
  email?: string;
  isVerified?: boolean;
  avatar?: UserAvatar;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Dueño / Titular",
  staff: "Administrador",
  driver: "Repartidor",
};

const ROLE_SHORT: Record<string, string> = {
  owner: "Titular",
  staff: "Admin",
  driver: "Delivery",
};

/** Gradientes decorativos estables por userId (solo diseño). */
const COVER_GRADIENTS = [
  "from-[#9a0002] via-[#6b0001] to-[#3a2019]",
  "from-[#5d4037] via-[#3a2a24] to-[#1c1612]",
  "from-[#343058] via-[#2a2648] to-[#14121f]",
  "from-[#0f766e] via-[#115e59] to-[#134e4a]",
  "from-[#b45309] via-[#92400e] to-[#451a03]",
  "from-[#7c3aed] via-[#5b21b6] to-[#2e1065]",
  "from-[#be123c] via-[#9f1239] to-[#4c0519]",
  "from-[#0369a1] via-[#075985] to-[#0c4a6e]",
];

function coverGradient(userId: string) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  return COVER_GRADIENTS[h % COVER_GRADIENTS.length];
}

function memberLabel(m: MemberItem) {
  return m.displayName || m.email?.split("@")[0] || `Usuario ${m.user_id.slice(0, 6)}`;
}

function canRemoveMember(actorRole: string | undefined, target: MemberItem, currentUserId: string) {
  if (!actorRole || actorRole === "driver") return false;
  if (target.user_id === currentUserId) return false;
  if (target.role === "owner") return false;
  if (actorRole === "staff" && target.role === "staff") return false;
  return actorRole === "owner" || actorRole === "staff";
}

function MemberCard({
  member,
  businessId,
  currentUserId,
  currentUserRole,
  onRemoved,
  onRestored,
}: {
  member: MemberItem;
  businessId: string;
  currentUserId: string;
  currentUserRole?: string;
  onRemoved: (member: MemberItem) => void;
  onRestored: (member: MemberItem) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);

  const roleLabel = ROLE_LABELS[member.role] ?? member.role;
  const roleShort = ROLE_SHORT[member.role] ?? member.role;
  const name = memberLabel(member);
  const avatar: UserAvatar = member.avatar ?? {
    type: "initials",
    value: name.slice(0, 2).toUpperCase(),
    gradientId: "cherry",
  };
  const isActive = member.status === "active";
  const isSelf = member.user_id === currentUserId;
  const showRemove = canRemoveMember(currentUserRole, member, currentUserId);

  const roleIcon =
    member.role === "owner"
      ? "crown"
      : member.role === "staff"
        ? "shield"
        : "two_wheeler";

  async function confirmRemove() {
    if (removing) return;
    setRemoving(true);
    setRemoveConfirm(false);
    const previousStatus = member.status;
    onRemoved(member);
    try {
      const fd = new FormData();
      fd.set("businessId", businessId);
      fd.set("memberId", member.id);
      await removeMember(fd);
      flashToastUndo({
        message: `${name} eliminado del equipo`,
        onUndo: async () => {
          try {
            const undoFd = new FormData();
            undoFd.set("businessId", businessId);
            undoFd.set("memberId", member.id);
            undoFd.set("previousStatus", previousStatus);
            await restoreMember(undoFd);
            onRestored(member);
          } catch {
            /* toast ya se cerró */
          }
        },
      });
    } catch {
      onRestored(member);
    } finally {
      setRemoving(false);
    }
  }

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
          </>
        )}
      </div>

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

        <p
          className={cn(
            "mt-0.5 line-clamp-1 text-xs font-medium",
            removeConfirm ? "text-white/75" : "text-stone-400",
          )}
        >
          {removeConfirm ? "¿Eliminar del equipo?" : member.email || "Sin email"}
        </p>

        {!removeConfirm && (
          <div className="flex w-full items-center justify-center mt-3 pt-3 border-t border-stone-100 dark:border-[#2a2623]">
            <div className="flex flex-1 flex-col items-center">
              <span className="text-[13px] font-extrabold text-stone-900 dark:text-stone-100">
                {isActive ? "Activo" : "Pendiente"}
              </span>
              <span className="text-[10px] font-medium text-stone-400">Estado</span>
            </div>

            <div className="h-7 w-px bg-stone-200 dark:bg-stone-800" />

            <div className="flex flex-1 flex-col items-center">
              <span className="text-[13px] font-extrabold text-stone-900 dark:text-stone-100">
                {roleShort}
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
            icon={roleIcon}
            size={15}
            className={
              removeConfirm
                ? "text-white"
                : member.role === "owner"
                  ? "text-amber-500"
                  : "text-stone-400"
            }
          />
          {removeConfirm ? "Se puede deshacer" : roleLabel}
        </span>

        {showRemove ? (
          <LogoutNavRail
            confirm={removeConfirm}
            onAccent={removeConfirm}
            boundaryRef={cardRef}
            askIcon="person_remove"
            askTitle="Eliminar miembro"
            onAsk={() => setRemoveConfirm(true)}
            onCancel={() => setRemoveConfirm(false)}
            onConfirm={() => void confirmRemove()}
          />
        ) : isSelf && member.role !== "owner" ? (
          <form action={leaveBusiness}>
            <input type="hidden" name="businessId" value={businessId} />
            <button
              type="submit"
              className="cursor-pointer text-xs font-bold text-red-600 hover:text-red-700 transition"
            >
              Salir
            </button>
          </form>
        ) : member.role === "owner" ? (
          <span
            className={cn(
              "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
              removeConfirm
                ? "bg-white/15 text-white"
                : "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50",
            )}
          >
            Titular
          </span>
        ) : (
          <span className="text-[11px] font-bold text-[#9a0002] dark:text-red-400 flex items-center gap-0.5">
            <span>Equipo</span>
            <MaterialSymbol icon="arrow_forward" size={12} />
          </span>
        )}
      </div>
    </div>
  );
}

function InviteMemberCard({ onOpen }: { onOpen: () => void }) {
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
        Invitar colaborador
      </h3>

      <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 max-w-[200px] leading-relaxed">
        Sumá un administrador o repartidor a tu local
      </p>

      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#9a0002] bg-[#9a0002]/10 dark:bg-[#9a0002]/20 px-3.5 py-1.5 rounded-full group-hover:bg-[#9a0002] group-hover:text-white transition-colors">
        <span>Invitar</span>
        <MaterialSymbol icon="arrow_forward" size={14} />
      </span>
    </button>
  );
}

function InviteMemberModal({
  businessId,
  isOpen,
  onClose,
}: {
  businessId: string;
  isOpen: boolean;
  onClose: () => void;
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
  const [role, setRole] = useState("staff");
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
      void searchUsersForInviteAction(businessId, q)
        .then(setHits)
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, businessId, selected]);

  if (!isOpen) return null;

  async function handleInvite() {
    if (!selected) {
      setMsg({ type: "err", text: "Buscá y seleccioná un usuario" });
      return;
    }
    setInviting(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.set("businessId", businessId);
      fd.set("userId", selected.userId);
      fd.set("role", role);
      await inviteMember(fd);
      setMsg({ type: "ok", text: `Invitación enviada a ${selected.displayName}` });
      setTimeout(() => {
        onClose();
        setSelected(null);
        setQuery("");
        setHits([]);
        setMsg(null);
      }, 1200);
    } catch (err: unknown) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Error al invitar" });
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-[28px] border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1c1917] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9a0002] text-white shadow-md">
              <MaterialSymbol icon="person_add" size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900 dark:text-stone-100">
                Invitar colaborador
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

            {query.trim().length >= 2 && !loading && (
              <ul className="absolute z-20 mt-1.5 max-h-48 w-full overflow-y-auto rounded-2xl border border-stone-200 bg-white py-1 shadow-lg dark:border-[#332e2a] dark:bg-[#1c1917]">
                {hits.length === 0 ? (
                  <li className="px-3 py-2.5 text-left text-[11px] text-stone-500">
                    Sin resultados para &quot;{query.trim()}&quot;
                  </li>
                ) : (
                  hits.map((hit) => (
                    <li key={hit.userId}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(hit);
                          setHits([]);
                          setQuery(hit.displayName);
                        }}
                        className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[#9a0002]/8 dark:hover:bg-[#9a0002]/15"
                      >
                        <UserAvatarView avatar={hit.avatar} variant="button" className="!h-8 !w-8" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-stone-900 dark:text-stone-100">
                            <HighlightText text={hit.displayName} query={query} />
                          </span>
                          <span className="block truncate text-[10px] text-stone-500">
                            <HighlightText text={hit.email} query={query} />
                          </span>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
            Rol a asignar
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none dark:border-stone-700 dark:bg-[#231f1c] dark:text-stone-100"
          >
            <option value="staff">Administrador — Gestión de catálogo, pedidos y configuración</option>
            <option value="driver">Repartidor — Acceso a logística de envíos y comandera</option>
          </select>
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
            type="button"
            disabled={inviting || !selected}
            onClick={() => void handleInvite()}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#9a0002] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#850002] disabled:cursor-not-allowed disabled:opacity-40 shadow-md"
          >
            {inviting ? (
              <MaterialSymbol icon="progress_activity" size={14} className="animate-spin" />
            ) : (
              <>
                <span>Enviar invitación</span>
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
      </div>
    </div>
  );
}

export function TabEquipo({
  businessId,
  currentUserId,
  currentUserRole,
  initialMembers,
}: {
  businessId: string;
  currentUserId: string;
  initialMembers: MemberItem[];
  businessName?: string;
  currentUserRole?: string;
}) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [members, setMembers] = useState(initialMembers);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const count = members.length;

  return (
    <div className="space-y-8">
      <ShellPageHeader
        title="Equipo"
        description="Invitá colaboradores y administrá roles del local."
        badge={`${count} ${count === 1 ? "miembro" : "miembros"}`}
        as="h2"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <InviteMemberCard onOpen={() => setInviteModalOpen(true)} />

        {members.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            businessId={businessId}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onRemoved={(removed) =>
              setMembers((cur) => cur.filter((x) => x.id !== removed.id))
            }
            onRestored={(restored) =>
              setMembers((cur) =>
                cur.some((x) => x.id === restored.id) ? cur : [...cur, restored],
              )
            }
          />
        ))}
      </div>

      <InviteMemberModal
        businessId={businessId}
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
}
