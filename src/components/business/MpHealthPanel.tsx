"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type MpHealthCheck = { ok: boolean | null; detail: string; action?: string };
type MpHealth = {
  checks: Record<string, MpHealthCheck>;
  blocking: boolean;
  checkedAt: string;
};

/** Checks visibles para el comercio — sin detalle técnico de caja/sucursal. */
const VISIBLE_CHECKS = [
  { key: "oauthLinked", label: "Cuenta", icon: "link" },
  { key: "mpReady", label: "Cobros QR", icon: "qr_code_2" },
] as const;

const EXTRA_CHECKS = [
  { key: "storeProvisioned", label: "Sucursal MP", icon: "store" },
  { key: "posProvisioned", label: "Caja MP", icon: "point_of_sale" },
  { key: "refreshToken", label: "Acceso", icon: "vpn_key" },
  { key: "tokenExpires", label: "Sesión", icon: "schedule" },
] as const;

function friendlyHint(check: MpHealthCheck): string | null {
  if (check.ok !== false) return null;
  if (check.action) return check.action;
  const d = check.detail.toLowerCase();
  if (d.includes("vincular") || d.includes("oauth")) return "Conectá Mercado Pago";
  if (d.includes("sucursal") || d.includes("local")) return "Configurá tu local";
  if (d.includes("caja") || d.includes("pdv") || d.includes("huérfana")) return "Configurá la caja";
  if (d.includes("token") || d.includes("refrescar")) return "Volvé a conectar la cuenta";
  return "Revisá en Pagos";
}

type CheckItem = {
  key: string;
  label: string;
  icon: string;
  ok: boolean | null;
  hint: string | null;
};

function collectChecks(health: MpHealth): CheckItem[] {
  const all = [...VISIBLE_CHECKS, ...EXTRA_CHECKS];
  return all.map(({ key, label, icon }) => {
    const check = health.checks[key];
    const ok = check?.ok ?? null;
    return { key, label, icon, ok, hint: check ? friendlyHint(check) : null };
  });
}

export function MpHealthPanel({
  businessId,
  linked,
  expired,
  embedded = false,
}: {
  businessId: string;
  linked?: boolean;
  expired?: boolean;
  /** Dentro de herramientas de desarrollador: sin card exterior ni estados desvinculados. */
  embedded?: boolean;
}) {
  const [health, setHealth] = useState<MpHealth | null>(null);
  const [loading, setLoading] = useState(linked !== false);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/payments/mp/health?businessId=${encodeURIComponent(businessId)}`);
    if (!res.ok) throw new Error("No se pudo consultar");
    setHealth(await res.json());
  }, [businessId]);

  useEffect(() => {
    queueMicrotask(() => {
      if (linked === false) {
        setLoading(false);
        setHealth(null);
        return;
      }
      setLoading(true);
      load()
        .catch(() => setError("No pudimos revisar los pagos."))
        .finally(() => setLoading(false));
    });
  }, [load, linked]);

  const items = useMemo(() => (health ? collectChecks(health) : []), [health]);
  const visible = items.filter((i) => VISIBLE_CHECKS.some((v) => v.key === i.key));
  const failures = items.filter((i) => i.ok === false);
  const allOk = visible.length > 0 && visible.every((i) => i.ok === true);

  if (linked === false && !embedded) {
    return (
      <div className="flex items-center gap-3 rounded-[20px] border border-dashed border-gray-200 dark:border-[#3d3732] bg-gray-50/80 dark:bg-[#231f1c]/40 px-4 py-3">
        <div className="w-9 h-9 rounded-xl bg-gray-200/80 dark:bg-[#2a2623] flex items-center justify-center shrink-0">
          <MaterialSymbol icon="link_off" size={20} className="text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-gray-700 dark:text-gray-200">Sin vincular</p>
          <p className="text-[11px] text-gray-500">Conectá Mercado Pago para cobrar con QR</p>
        </div>
      </div>
    );
  }

  if (expired && !embedded) {
    return (
      <div className="flex items-center gap-3 rounded-[20px] border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
          <MaterialSymbol icon="link_off" size={20} className="text-amber-600" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-amber-800 dark:text-amber-200">Vinculación vencida</p>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70">Volvé a conectar tu cuenta</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-gray-400 py-2">
        <MaterialSymbol icon="progress_activity" size={16} className="animate-spin" />
        Revisando…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[20px] border border-gray-100 dark:border-[#3d3732] px-3 py-2.5">
        <span className="flex items-center gap-2 text-[12px] text-gray-500">
          <MaterialSymbol icon="cloud_off" size={16} />
          {error}
        </span>
        <button type="button" onClick={() => void load()} className="text-[12px] font-bold text-[#9a0002] cursor-pointer">
          Reintentar
        </button>
      </div>
    );
  }

  if (!health) return null;

  return (
    <section
      className={cn(
        embedded
          ? "space-y-2.5"
          : "rounded-[20px] border border-gray-100 dark:border-[#3d3732] bg-white dark:bg-[#1c1917] px-3.5 py-3 space-y-2.5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MaterialSymbol
            icon={allOk ? "verified" : "info"}
            size={18}
            className={cn(allOk ? "text-emerald-500" : "text-amber-500", "shrink-0")}
          />
          <span className="text-[13px] font-bold text-gray-900 dark:text-white">
            {allOk ? "Listo para cobrar" : "Falta configurar"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            load().finally(() => setRefreshing(false));
          }}
          disabled={refreshing}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a2623] cursor-pointer disabled:opacity-50"
          aria-label="Actualizar"
        >
          <MaterialSymbol icon="refresh" size={16} className={cn(refreshing && "animate-spin", "text-gray-400")} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {visible.map(({ key, label, icon, ok }) => (
          <div
            key={key}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold",
              ok === true && "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
              ok === false && "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400",
              ok === null && "bg-gray-100 dark:bg-[#2a2623] text-gray-400",
            )}
          >
            <MaterialSymbol
              icon={ok === true ? "check_circle" : ok === false ? "cancel" : icon}
              size={14}
              fill={ok === true}
            />
            {label}
          </div>
        ))}
      </div>

      {failures.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
          >
            {expanded ? "Ocultar" : "Qué hacer"}
            <MaterialSymbol icon="expand_more" size={16} className={cn("transition-transform", expanded && "rotate-180")} />
          </button>
          {expanded && (
            <ul className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-[#3d3732]">
              {failures.map(({ key, label, icon, hint }) => (
                <li key={key} className="flex items-start gap-2 text-[11px]">
                  <MaterialSymbol icon={icon} size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{label}:</span>{" "}
                    {hint ?? "Revisá la sección Pagos"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
