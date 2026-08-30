"use client";

import { useCallback, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { MpHealthPanel } from "@/components/business/MpHealthPanel";
import { cn } from "@/lib/utils";
import type { MpStatus } from "@/components/business/PagosSection";

const SUPPORT_EMAIL = "hola@bolivarpide.com";

export function MpDevToolsPanel({
  businessId,
  status,
  provisioning,
  provisionError,
  onRefresh,
  onTryFix,
}: {
  businessId: string;
  status: MpStatus | null;
  provisioning: boolean;
  provisionError: string | null;
  onRefresh: () => Promise<void>;
  onTryFix: () => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixFailed, setFixFailed] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [data, setData] = useState<{
    status: unknown;
    health: unknown;
    sessions: unknown[];
    webhooks: unknown[];
    probe: { ok: boolean; message: string };
    webhookSecretConfigured: boolean;
    oauth?: {
      appId: string;
      redirectUri: string;
      oauthUsePkce: boolean;
      readyToLink: boolean;
      issues: string[];
      panel?: {
        callbackUrl: string | null;
        usePkce: boolean | null;
        redirectMatchesPanel: boolean;
        pkceMatchesPanel: boolean;
        message: string;
      };
      edgeFunctionReachable: boolean | null;
    };
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const linked = status?.linked && status.status === "active";
  const needsFix = Boolean(linked && status && !status.mpReady);
  const showFixUi = needsFix || Boolean(provisionError) || fixFailed;

  const load = useCallback(async () => {
    setLoading(true);
    setLocalError(null);
    try {
      const [diagRes, oauthRes] = await Promise.all([
        fetch(`/api/payments/mp/diagnostics?businessId=${encodeURIComponent(businessId)}&limit=8`),
        fetch(`/api/payments/mp/oauth/config?businessId=${encodeURIComponent(businessId)}`),
      ]);
      if (!diagRes.ok) throw new Error("Error al cargar diagnóstico");
      const diag = await diagRes.json();
      const oauth = oauthRes.ok ? await oauthRes.json() : null;
      setData({ ...diag, oauth });
    } catch {
      setLocalError("No se pudo cargar el diagnóstico MP.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !data) await load();
  };

  const copy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setLocalError("No se pudo copiar.");
    }
  };

  const tryFix = async () => {
    setFixing(true);
    setLocalError(null);
    try {
      const ok = await onTryFix();
      await Promise.all([load(), onRefresh()]);
      setFixFailed(!ok);
    } catch (e) {
      setFixFailed(true);
      setLocalError(e instanceof Error ? e.message : "No se pudo solucionar");
    } finally {
      setFixing(false);
    }
  };

  const displayError = localError ?? provisionError;

  return (
    <section
      className={cn(
        "rounded-[20px] border bg-white dark:bg-[#1c1917] px-3.5 py-2.5",
        showFixUi && !open
          ? "border-amber-200 dark:border-amber-900/40"
          : "border-gray-100 dark:border-[#3d3732]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => void toggle()} className="flex items-center gap-2 cursor-pointer">
          <MaterialSymbol icon="terminal" size={16} className="text-gray-400" />
          <span className="text-[13px] font-bold text-gray-900 dark:text-white">Herramientas de desarrollador</span>
          {showFixUi && !open && (
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" aria-hidden />
          )}
          <MaterialSymbol icon="expand_more" size={18} className={cn("text-gray-400", open && "rotate-180")} />
        </button>
        {open && (
          <button type="button" onClick={() => void load()} disabled={loading} className="p-1.5 cursor-pointer">
            <MaterialSymbol icon="refresh" size={16} className={cn(loading && "animate-spin")} />
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#3d3732] space-y-3 text-[12px]">
          {localError && <p className="text-red-600">{localError}</p>}

          {linked && (
            <MpHealthPanel businessId={businessId} linked={linked} embedded />
          )}

          {linked && showFixUi && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 p-3 space-y-2.5">
              <div className="flex items-start gap-2">
                <MaterialSymbol icon="error_outline" size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-900 dark:text-amber-100 text-[12px]">
                    Detectamos un error al configurar los cobros QR
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-200/70 leading-relaxed">
                    Podemos intentar repararlo automáticamente. Si persiste, contactá soporte.
                  </p>
                  {displayError && (
                    <p className="text-[10px] font-mono text-amber-900/60 dark:text-amber-200/50 break-all pt-1">
                      {displayError}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void tryFix()}
                  disabled={fixing || provisioning}
                  className="h-8 px-3 rounded-full bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {(fixing || provisioning) && (
                    <MaterialSymbol icon="progress_activity" size={12} className="animate-spin" />
                  )}
                  Intentar solucionar
                </button>
              </div>
              {(fixFailed || displayError) && (
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  Si no se resuelve, escribinos a{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[#9a0002] underline">
                    {SUPPORT_EMAIL}
                  </a>
                </p>
              )}
            </div>
          )}

          {loading && !data ? (
            <p className="text-gray-400 flex items-center gap-2">
              <MaterialSymbol icon="progress_activity" size={14} className="animate-spin" />
              Cargando…
            </p>
          ) : (
            <>
              {linked && (
                <div className="rounded-xl bg-gray-50 dark:bg-[#141210] p-3 space-y-1 font-mono text-[11px]">
                  <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">Provisioning MP</p>
                  <p>sucursal: {status?.store?.name ?? "—"}</p>
                  <p className="break-all">mp_store_id: {status?.store?.mpStoreId ?? "—"}</p>
                  <p className="break-all">caja: {status?.pos?.externalPosId ?? "—"}</p>
                  <p>modo: {status?.pos?.operatingMode ?? "—"}</p>
                </div>
              )}

              {data && (
                <>
                  <button
                    type="button"
                    onClick={() => void copy()}
                    className="h-8 px-3 rounded-full border border-gray-200 dark:border-[#3d3732] font-semibold text-gray-600 cursor-pointer"
                  >
                    {copied ? "Copiado" : "Copiar diagnóstico"}
                  </button>
                  <p className="text-gray-600 dark:text-gray-400">
                    Token:{" "}
                    <span className={data.probe.ok ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                      {data.probe.message}
                    </span>
                    {" · "}
                    Webhook secret {data.webhookSecretConfigured ? "ok" : "falta en servidor"}
                  </p>
                  {data.oauth && (
                    <div className="rounded-xl bg-gray-50 dark:bg-[#141210] p-3 space-y-1 font-mono text-[11px]">
                      <p className="font-bold text-gray-700 dark:text-gray-300">OAuth servidor + panel MP</p>
                      <p>app_id: {data.oauth.appId}</p>
                      <p className="break-all">redirect servidor: {data.oauth.redirectUri}</p>
                      <p className="break-all">redirect panel: {data.oauth.panel?.callbackUrl ?? "—"}</p>
                      <p>
                        listo:{" "}
                        <span className={data.oauth.readyToLink ? "text-emerald-600" : "text-red-600 font-semibold"}>
                          {data.oauth.readyToLink ? "sí" : "no"}
                        </span>
                      </p>
                      {data.oauth.issues.length > 0 && (
                        <ul className="text-red-600 list-disc pl-4">
                          {data.oauth.issues.map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Últimas sesiones QR</h4>
                    {(data.sessions as { status: string; amount_cents: number; created_at: string }[]).length === 0 ? (
                      <p className="text-gray-400">Sin sesiones aún.</p>
                    ) : (
                      <ul className="space-y-1 font-mono text-[11px] text-gray-500">
                        {(data.sessions as { status: string; amount_cents: number; created_at: string }[]).map((s, i) => (
                          <li key={i}>
                            {s.status} · ${(s.amount_cents / 100).toFixed(0)} ·{" "}
                            {new Date(s.created_at).toLocaleString("es-AR")}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Webhooks recientes</h4>
                    {(data.webhooks as { event_type: string; processed: boolean; created_at: string }[]).length === 0 ? (
                      <p className="text-gray-400">Sin eventos.</p>
                    ) : (
                      <ul className="space-y-1 font-mono text-[11px] text-gray-500">
                        {(data.webhooks as { event_type: string; processed: boolean; created_at: string }[]).map((w, i) => (
                          <li key={i}>
                            {w.event_type} · {w.processed ? "ok" : "pendiente"} ·{" "}
                            {new Date(w.created_at).toLocaleString("es-AR")}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
