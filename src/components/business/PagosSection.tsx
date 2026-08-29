"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { MpHealthPanel } from "@/components/business/MpHealthPanel";
import { MpDevToolsPanel } from "@/components/business/MpDevToolsPanel";
import { cn } from "@/lib/utils";

export type MpStatus = {
  linked: boolean;
  status: "active" | "expired" | "revoked" | null;
  displayName: string | null;
  email: string | null;
  linkedAt: string | null;
  mpReady: boolean;
  store: { name: string; mpStoreId: string } | null;
  pos: { externalPosId: string; operatingMode: string } | null;
  isOrphan: boolean;
};

function formatRelative(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "hoy";
  if (days === 1) return "hace 1 día";
  return `hace ${days} días`;
}

const card = "bg-white dark:bg-[#1c1917] rounded-[24px] border border-gray-100 dark:border-[#3d3732] penpot-shadow";

export function PagosSection({ businessId }: { businessId: string }) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<MpStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [reprovisioning, setReprovisioning] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [unlinkOpen, setUnlinkOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/payments/mp/status?businessId=${encodeURIComponent(businessId)}`);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "Error al cargar pagos");
    }
    setStatus(await res.json());
  }, [businessId]);

  const reprovision = useCallback(async () => {
    setReprovisioning(true);
    try {
      const res = await fetch("/api/payments/mp/reprovision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Error");
      setToast({ type: "ok", text: "Sucursal y caja listas en Mercado Pago" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setReprovisioning(false);
    }
  }, [businessId, load]);

  useEffect(() => {
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const linked = searchParams.get("linked");
    const message = searchParams.get("message");
    const provision = searchParams.get("provision");

    if (linked === "true") {
      setToast({ type: "ok", text: "Mercado Pago vinculado" });
      load()
        .then(async () => {
          if (provision === "1") {
            const res = await fetch(`/api/payments/mp/status?businessId=${encodeURIComponent(businessId)}`);
            const st = await res.json();
            if (!st.mpReady) await reprovision();
          }
        })
        .catch(() => {});
    } else if (linked === "false" && message) {
      setToast({ type: "err", text: decodeURIComponent(message) });
    }

    if (linked) {
      const u = new URL(window.location.href);
      u.searchParams.delete("linked");
      u.searchParams.delete("message");
      u.searchParams.delete("provision");
      window.history.replaceState({}, "", u.pathname + u.search);
    }
  }, [searchParams, load, businessId, reprovision]);

  const handleLink = async () => {
    setLinking(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/mp/oauth/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Error OAuth");
      window.location.href = j.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinkOpen(false);
    setUnlinking(true);
    try {
      const res = await fetch(
        `/api/payments/mp/disconnect?businessId=${encodeURIComponent(businessId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("No se pudo desvincular");
      setToast({ type: "ok", text: "Cuenta desvinculada" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setUnlinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <MaterialSymbol icon="progress_activity" size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const isLinked = status?.linked && status.status === "active";
  const isExpired = status?.linked && status.status === "expired";

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Pagos</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          App Mercado Pago <span className="font-semibold">bolivarpide</span> · QR dinámico · sin terminal física
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {isLinked ? (
        <div className={cn(card, "p-4")}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#009EE3]/10 flex items-center justify-center">
                <MaterialSymbol icon="account_balance_wallet" size={22} className="text-[#009EE3]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-black text-[#009EE3]">Mercado Pago</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                    Vinculado
                  </span>
                  {status?.mpReady && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#9a0002]/10 text-[#9a0002]">
                      Listo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  {[status?.displayName, status?.email].filter(Boolean).join(" · ")}
                  {formatRelative(status?.linkedAt ?? null) ? ` · ${formatRelative(status!.linkedAt)}` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUnlinkOpen(true)}
              disabled={unlinking}
              className="h-8 px-3 rounded-full text-[11px] font-bold bg-red-50 text-red-600 cursor-pointer disabled:opacity-50"
            >
              {unlinking ? "…" : "Desvincular"}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="relative overflow-hidden rounded-[24px] p-5 text-white shadow-lg"
          style={{
            background: isExpired
              ? "linear-gradient(135deg, #7f1d1d 0%, #450a0a 45%, #001a33 100%)"
              : "linear-gradient(135deg, #003B64 0%, #002340 55%, #001124 100%)",
          }}
        >
          <p className="text-base font-black">Conectar Mercado Pago</p>
          <p className="text-[12px] text-white/75 mt-1 max-w-md leading-relaxed">
            Autorizá la app bolivarpide. Creamos sucursal y caja automáticamente — no hace falta Posnet.
          </p>
          <button
            type="button"
            onClick={handleLink}
            disabled={linking}
            className="mt-4 h-10 px-5 rounded-full bg-[#009EE3] hover:bg-[#008BCC] text-[12px] font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {linking && <MaterialSymbol icon="progress_activity" size={16} className="animate-spin" />}
            {linking ? "Redirigiendo…" : isExpired ? "Re-vincular" : "Vincular Mercado Pago"}
          </button>
        </div>
      )}

      <MpHealthPanel businessId={businessId} linked={isLinked} expired={isExpired} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={cn(card, "p-3.5 space-y-1")}>
          <div className="flex items-center gap-2">
            <MaterialSymbol icon="store" size={18} className="text-[#9a0002]" />
            <h3 className="text-[13px] font-black">Sucursal</h3>
          </div>
          <p className="text-[12px] text-gray-600 dark:text-gray-400 truncate">
            {status?.store?.name ?? "—"}
          </p>
        </div>
        <div className={cn(card, "p-3.5 space-y-1")}>
          <div className="flex items-center gap-2">
            <MaterialSymbol icon="point_of_sale" size={18} className="text-[#9a0002]" />
            <h3 className="text-[13px] font-black">Caja</h3>
          </div>
          <p className="text-[11px] font-mono text-gray-500 truncate">
            {status?.pos?.externalPosId ?? "—"}
          </p>
        </div>
      </div>

      {(status?.isOrphan || (isLinked && !status?.mpReady)) && (
        <button
          type="button"
          onClick={() => void reprovision()}
          disabled={reprovisioning}
          className="h-9 px-4 rounded-full bg-[#9a0002] text-white text-[11px] font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {reprovisioning && <MaterialSymbol icon="progress_activity" size={14} className="animate-spin" />}
          Re-asociar sucursal y caja
        </button>
      )}

      <MpDevToolsPanel businessId={businessId} />

      {unlinkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45">
          <div className={cn(card, "max-w-md w-full p-6 space-y-4")}>
            <h4 className="text-lg font-black">Desvincular Mercado Pago</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              La sucursal y caja se conservan en MP. Con la misma cuenta se restauran solas; con otra, usá
              re-asociar.
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setUnlinkOpen(false)} className="text-xs font-bold cursor-pointer">
                Cancelar
              </button>
              <button type="button" onClick={() => void handleUnlink()} className="text-xs font-bold text-red-600 cursor-pointer">
                Desvincular
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl px-4 py-3 text-xs font-semibold shadow-xl border",
            toast.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800",
          )}
        >
          {toast.text}
          <button type="button" className="ml-3 opacity-60 cursor-pointer" onClick={() => setToast(null)}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
