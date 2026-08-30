"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
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
  offerQrPay: boolean;
  absorbFastPayFee: boolean;
  mpCostsHelpUrl: string;
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
  const [provisioning, setProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const provisionAttempted = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/payments/mp/status?businessId=${encodeURIComponent(businessId)}`);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "Error al cargar pagos");
    }
    setStatus(await res.json());
  }, [businessId]);

  const runAutoProvision = useCallback(async (): Promise<boolean> => {
    setProvisioning(true);
    setProvisionError(null);
    setError(null);
    try {
      const res = await fetch("/api/payments/mp/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Error al configurar pagos");
      setToast({ type: "ok", text: "Cobros con QR configurados" });
      await load();
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al configurar pagos";
      setProvisionError(msg);
      return false;
    } finally {
      setProvisioning(false);
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
      setToast({ type: "ok", text: "Mercado Pago vinculado — configurando tu local…" });
      if (provision === "1") {
        provisionAttempted.current = true;
        void runAutoProvision();
      } else {
        void load();
      }
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
  }, [searchParams, load, runAutoProvision]);

  const isLinked = status?.linked && status.status === "active";
  const isExpired = status?.linked && status.status === "expired";
  const needsProvision = Boolean(isLinked && status && !status.mpReady);

  useEffect(() => {
    if (!needsProvision || provisioning || provisionAttempted.current) return;
    provisionAttempted.current = true;
    void runAutoProvision();
  }, [needsProvision, provisioning, runAutoProvision]);

  const savePaySetting = async (patch: { offerQrPay?: boolean; absorbFastPayFee?: boolean }) => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/payments/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, ...patch }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Error al guardar");
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              offerQrPay: j.offerQrPay,
              absorbFastPayFee: j.absorbFastPayFee,
            }
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSavingSettings(false);
    }
  };

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
    provisionAttempted.current = false;
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

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Pagos</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Vinculá Mercado Pago y listo — configuramos todo automáticamente
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
                  {provisioning && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 flex items-center gap-1">
                      <MaterialSymbol icon="progress_activity" size={12} className="animate-spin" />
                      Configurando
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
              disabled={unlinking || provisioning}
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
            Un solo paso: autorizá bolivarpide y damos de alta tu sucursal con el nombre y la dirección del local.
          </p>
          <button
            type="button"
            onClick={() => void handleLink()}
            disabled={linking}
            className="mt-4 h-10 px-5 rounded-full bg-[#009EE3] hover:bg-[#008BCC] text-[12px] font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {linking && <MaterialSymbol icon="progress_activity" size={16} className="animate-spin" />}
            {linking ? "Redirigiendo…" : isExpired ? "Re-vincular" : "Vincular Mercado Pago"}
          </button>
        </div>
      )}

      {isLinked && status && (
        <div className={cn(card, "p-4 space-y-4")}>
          <div>
            <h2 className="text-[14px] font-black text-gray-900 dark:text-white">Opciones de cobro</h2>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
              Elegí qué medios ven tus clientes al pagar un pedido.
            </p>
          </div>

          <label className="flex items-start justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Pago con QR</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Mostrar la opción de escanear QR (menor costo).</p>
            </div>
            <input
              type="checkbox"
              checked={status.offerQrPay}
              disabled={savingSettings}
              onChange={(e) => void savePaySetting({ offerQrPay: e.target.checked })}
              className="mt-1 shrink-0"
            />
          </label>

          <label className="flex items-start justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                Absorber comisión del pago rápido
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Si está activo, el cliente ve &quot;Gratis&quot; en pago rápido. Si no, se le suma el recargo al total.
              </p>
            </div>
            <input
              type="checkbox"
              checked={status.absorbFastPayFee}
              disabled={savingSettings}
              onChange={(e) => void savePaySetting({ absorbFastPayFee: e.target.checked })}
              className="mt-1 shrink-0"
            />
          </label>

          <p className="text-[11px] text-gray-500 leading-relaxed border-t border-gray-100 dark:border-[#3d3732] pt-3">
            Mercado Pago aplica sus propias comisiones según tu cuenta.{" "}
            <a
              href={status.mpCostsHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#9a0002] underline"
            >
              Ver costos en Mercado Pago
            </a>
          </p>
        </div>
      )}

      <MpDevToolsPanel
        businessId={businessId}
        status={status}
        provisioning={provisioning}
        provisionError={provisionError}
        onRefresh={load}
        onTryFix={runAutoProvision}
      />

      {unlinkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45">
          <div className={cn(card, "max-w-md w-full p-6 space-y-4")}>
            <h4 className="text-lg font-black">Desvincular Mercado Pago</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Podés volver a vincular con la misma cuenta cuando quieras.
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
