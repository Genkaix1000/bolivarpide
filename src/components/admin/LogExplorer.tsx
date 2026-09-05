"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import type { AuditLogRow } from "@/lib/admin/queries";

const ACTIONS = [
  "all",
  "impersonate_start",
  "impersonate_end",
  "approve_lead",
  "reject_lead",
  "set_published",
  "set_plan",
  "platform_role_assign",
  "platform_role_change",
  "platform_role_revoke",
  "whatsapp_set_active",
] as const;

const PERIODS = [
  { label: "Última hora", hours: 1 },
  { label: "Últimas 24 h", hours: 24 },
  { label: "Últimos 7 días", hours: 168 },
  { label: "Últimos 30 días", hours: 720 },
] as const;

function severityOf(action: string): "info" | "warn" | "error" {
  if (action.includes("revoke") || action.includes("reject")) return "warn";
  if (action.includes("impersonate")) return "warn";
  return "info";
}

function SeverityIcon({ level }: { level: "info" | "warn" | "error" }) {
  if (level === "warn") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
        <MaterialSymbol icon="warning" size={14} fill />
      </span>
    );
  }
  if (level === "error") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[#9a0002]">
        <MaterialSymbol icon="error" size={14} fill />
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-200 text-stone-600 dark:bg-[#2a2623] dark:text-stone-300">
      <MaterialSymbol icon="info" size={14} />
    </span>
  );
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export function LogExplorer({
  rows,
  total,
  buckets,
  initialAction,
  initialPeriod,
  initialQ,
}: {
  rows: AuditLogRow[];
  total: number;
  buckets: { t: string; n: number }[];
  initialAction: string;
  initialPeriod: number;
  initialQ: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [q, setQ] = useState(initialQ);
  const maxBucket = useMemo(() => Math.max(1, ...buckets.map((b) => b.n)), [buckets]);

  function push(next: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "all") p.delete(k);
      else p.set(k, v);
    }
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
            BolivarPide · plataforma
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Log Explorer
          </h2>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e8e0d6] bg-white shadow-sm dark:border-[#3d3732] dark:bg-[#1c1917]">
        <div className="flex gap-1 border-b border-[#e8e0d6] px-3 pt-2 dark:border-[#3d3732]">
          {["Query", "Recientes"].map((tab, i) => (
            <span
              key={tab}
              className={cn(
                "cursor-default rounded-t-lg px-3 py-2 text-[13px] font-semibold",
                i === 0
                  ? "border-b-2 border-[#9a0002] text-[#9a0002]"
                  : "text-stone-400",
              )}
            >
              {tab}
            </span>
          ))}
        </div>

        <form
          className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            push({ q });
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e8e0d6] bg-[#faf6f1] px-3 py-2.5 dark:border-[#3d3732] dark:bg-[#2a2623]">
            <MaterialSymbol icon="search" size={18} className="shrink-0 text-[#9a0002]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='action="impersonate_start" OR target_id=…'
              className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-stone-800 outline-none placeholder:text-stone-400 dark:text-stone-100"
            />
          </div>
          <button
            type="submit"
            className="cursor-pointer rounded-xl bg-[#9a0002] px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#9a0002]/25 hover:bg-[#6b0001]"
          >
            Run query
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 border-t border-[#e8e0d6] px-3 py-3 dark:border-[#3d3732]">
          <label className="flex items-center gap-1.5 text-[12px] text-stone-500">
            Period
            <select
              className="cursor-pointer rounded-lg border border-[#e8e0d6] bg-white px-2 py-1.5 text-[12px] font-medium text-stone-800 dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-stone-100"
              value={initialPeriod}
              onChange={(e) => push({ period: e.target.value })}
            >
              {PERIODS.map((p) => (
                <option key={p.hours} value={p.hours}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-stone-500">
            Action
            <select
              className="cursor-pointer rounded-lg border border-[#e8e0d6] bg-white px-2 py-1.5 text-[12px] font-medium text-stone-800 dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-stone-100"
              value={initialAction}
              onChange={(e) => push({ action: e.target.value })}
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a === "all" ? "All" : a}
                </option>
              ))}
            </select>
          </label>
          <p className="ml-auto text-[12px] text-stone-400">
            Mostrando <span className="font-semibold text-stone-600 dark:text-stone-300">{total}</span> eventos
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e8e0d6] bg-white p-4 shadow-sm dark:border-[#3d3732] dark:bg-[#1c1917]">
        <div className="flex h-28 items-end gap-1">
          {buckets.map((b, i) => (
            <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className="w-full rounded-t-sm bg-[#9a0002]/55 transition hover:bg-[#9a0002]"
                style={{ height: `${Math.max(4, (b.n / maxBucket) * 100)}%` }}
                title={`${b.t} · ${b.n}`}
              />
              <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-[10px] text-white group-hover:block">
                {b.t} · {b.n}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-stone-400">
          <span>{buckets[0]?.t}</span>
          <span>{buckets[buckets.length - 1]?.t}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e8e0d6] bg-white shadow-sm dark:border-[#3d3732] dark:bg-[#1c1917]">
        <div className="grid grid-cols-[auto_7rem_11rem_1fr] gap-2 border-b border-[#e8e0d6] bg-[#faf6f1] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:border-[#3d3732] dark:bg-[#221e1b] sm:grid-cols-[auto_8rem_14rem_1fr]">
          <span />
          <span>Severidad</span>
          <span>Timestamp</span>
          <span>Message</span>
        </div>
        <ul className="divide-y divide-[#e8e0d6]/80 dark:divide-[#3d3732]">
          {rows.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-stone-400">Sin eventos en este rango.</li>
          ) : (
            rows.map((row) => {
              const sev = severityOf(row.action);
              const open = expanded === row.id;
              const message = {
                action: row.action,
                actor: row.actorEmail ?? row.actor_user_id,
                target_type: row.target_type,
                target_id: row.target_id,
                meta: row.meta,
              };
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : row.id)}
                    className="grid w-full cursor-pointer grid-cols-[auto_7rem_11rem_1fr] gap-2 px-3 py-2.5 text-left hover:bg-[#9a0002]/5 sm:grid-cols-[auto_8rem_14rem_1fr]"
                  >
                    <MaterialSymbol
                      icon={open ? "expand_more" : "chevron_right"}
                      size={18}
                      className="text-stone-400"
                    />
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold capitalize text-stone-600 dark:text-stone-300">
                      <SeverityIcon level={sev} />
                      {sev}
                    </span>
                    <span className="font-mono text-[11px] text-stone-500">{formatTs(row.created_at)}</span>
                    <span className="truncate font-mono text-[12px] text-stone-800 dark:text-stone-200">
                      {row.action}
                      {row.target_type ? ` · ${row.target_type}/${row.target_id?.slice(0, 8)}` : ""}
                      {row.actorEmail ? ` · ${row.actorEmail}` : ""}
                    </span>
                  </button>
                  {open && (
                    <pre className="overflow-x-auto border-t border-[#e8e0d6]/60 bg-[#faf6f1] px-4 py-3 font-mono text-[11px] leading-relaxed text-stone-700 dark:border-[#3d3732] dark:bg-[#221e1b] dark:text-stone-300">
                      {JSON.stringify(message, null, 2)}
                    </pre>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
