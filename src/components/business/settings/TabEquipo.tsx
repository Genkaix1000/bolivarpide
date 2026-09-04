"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { UserAvatarView } from "@/components/UserAvatarView";
import { HighlightText } from "@/components/search/HighlightText";
import { inviteMember, leaveBusiness, searchUsersForInviteAction } from "@/lib/business/actions";
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

function MemberCard({
  member,
  businessId,
  currentUserId,
}: {
  member: MemberItem;
  businessId: string;
  currentUserId: string;
}) {
  const roleLabel = ROLE_LABELS[member.role] ?? member.role;
  const name = memberLabel(member);
  const avatar: UserAvatar = member.avatar ?? {
    type: "initials",
    value: name.slice(0, 2).toUpperCase(),
    gradientId: "cherry",
  };
  const isActive = member.status === "active";
  const isSelf = member.user_id === currentUserId;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[24px] border border-stone-200/80 bg-white shadow-sm transition-all duration-300 hover:border-[#9a0002]/40 hover:shadow-xl dark:border-[#332e2a] dark:bg-[#1c1917] dark:hover:border-[#9a0002]/40">
      <div
        className={cn(
          "relative h-20 w-full shrink-0 overflow-hidden bg-gradient-to-br",
          coverGradient(member.user_id),
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        {isActive ? (
          <span
            className="absolute right-3 top-3 flex h-2.5 w-2.5"
            title="Activo en el equipo"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white/50" />
          </span>
        ) : null}
      </div>

      <div className="relative z-10 -mt-8 flex flex-1 flex-col items-center px-5 pb-1 text-center">
        <div className="rounded-full bg-white p-1 shadow-lg transition-transform duration-300 group-hover:scale-105 dark:bg-[#1c1917]">
          <UserAvatarView
            avatar={avatar}
            variant="button"
            className="!h-16 !w-16 [&_span]:!text-[18px]"
          />
        </div>

        <h3 className="mt-2.5 flex max-w-full items-center justify-center gap-1 text-base font-black text-stone-900 transition-colors group-hover:text-[#9a0002] dark:text-stone-100">
          <span className="truncate">{name}</span>
          {member.isVerified ? (
            <span title="Identidad verificada" className="inline-flex shrink-0">
              <MaterialSymbol icon="verified" size={16} className="text-sky-500" />
            </span>
          ) : null}
          {isSelf ? (
            <span className="shrink-0 text-[10px] font-bold text-stone-400">(vos)</span>
          ) : null}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs font-medium text-stone-500 dark:text-stone-400">
          {member.email || "Sin email"}
        </p>
        {!isActive ? (
          <p className="mt-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            Invitación pendiente
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-stone-100 bg-stone-50/50 px-5 py-3 dark:border-[#2a2623] dark:bg-[#231f1c]/40">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-stone-500 dark:text-stone-400">
          <MaterialSymbol icon="badge" size={14} className="text-stone-400" />
          {roleLabel}
        </span>

        {isSelf && member.role !== "owner" ? (
          <form action={leaveBusiness}>
            <input type="hidden" name="businessId" value={businessId} />
            <button
              type="submit"
              className="cursor-pointer text-xs font-bold text-red-600 transition hover:text-red-700"
            >
              Salir
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function InviteMemberCard({ businessId }: { businessId: string }) {
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
      setSelected(null);
      setQuery("");
      setHits([]);
    } catch (err: unknown) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Error al invitar" });
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="group relative flex min-h-[310px] flex-col rounded-[24px] border-2 border-dashed border-stone-300 bg-stone-50/50 p-5 shadow-sm transition-all duration-300 hover:border-[#9a0002]/50 hover:bg-white dark:border-stone-700 dark:bg-[#1a1715]/50 dark:hover:border-[#9a0002]/50 dark:hover:bg-[#1f1b18]">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#9a0002] text-white shadow-md">
          <MaterialSymbol icon="person_add" size={22} />
        </div>
        <div className="min-w-0 text-left">
          <h3 className="text-[15px] font-bold text-stone-900 dark:text-stone-100">
            Invitar colaborador
          </h3>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Buscá por nombre o email
          </p>
        </div>
      </div>

      {selected ? (
        <div className="mb-3 flex items-center gap-2.5 rounded-2xl border border-[#9a0002]/25 bg-[#9a0002]/5 px-3 py-2.5 dark:bg-[#9a0002]/10">
          <UserAvatarView avatar={selected.avatar} variant="button" className="!h-9 !w-9" />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-xs font-bold text-stone-900 dark:text-stone-100">
              {selected.displayName}
            </p>
            <p className="truncate text-[10px] text-stone-500">{selected.email}</p>
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
        <div className="relative mb-2">
          <MaterialSymbol
            icon="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej. Matías o @gmail…"
            autoComplete="off"
            className="w-full rounded-full border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs text-stone-900 outline-none focus:ring-2 focus:ring-[#9a0002]/30 dark:border-stone-700 dark:bg-[#231f1c] dark:text-stone-100"
          />
          {loading ? (
            <MaterialSymbol
              icon="progress_activity"
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-stone-400"
            />
          ) : null}

          {query.trim().length >= 2 && !loading ? (
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
          ) : null}
        </div>
      )}

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="mb-2 w-full rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-900 outline-none dark:border-stone-700 dark:bg-[#231f1c] dark:text-stone-100"
      >
        <option value="staff">Administrador</option>
        <option value="driver">Repartidor</option>
      </select>

      <button
        type="button"
        disabled={inviting || !selected}
        onClick={() => void handleInvite()}
        className="mt-auto inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#9a0002] px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#850002] disabled:cursor-not-allowed disabled:opacity-40"
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

      {msg ? (
        <p
          className={cn(
            "mt-2 text-center text-[11px] font-bold",
            msg.type === "ok" ? "text-emerald-600" : "text-red-600",
          )}
        >
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}

export function TabEquipo({
  businessId,
  currentUserId,
  initialMembers,
}: {
  businessId: string;
  currentUserId: string;
  initialMembers: MemberItem[];
  businessName?: string;
  currentUserRole?: string;
}) {
  const count = initialMembers.length;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            Equipo
          </h2>
          <span className="rounded-full bg-[#9a0002]/10 px-2.5 py-0.5 text-xs font-black text-[#9a0002] dark:bg-[#9a0002]/20">
            {count} {count === 1 ? "miembro" : "miembros"}
          </span>
        </div>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 sm:text-sm">
          Invitá colaboradores y administrá roles del local.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <InviteMemberCard businessId={businessId} />
        {initialMembers.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            businessId={businessId}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}
