"use client";

import { useCallback, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

export function MpDevToolsPanel({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    status: unknown;
    health: unknown;
    sessions: unknown[];
    webhooks: unknown[];
    probe: { ok: boolean; message: string };
    webhookSecretConfigured: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/payments/mp/diagnostics?businessId=${encodeURIComponent(businessId)}&limit=8`,
      );
      if (!res.ok) throw new Error("Error al cargar diagnóstico");
      setData(await res.json());
    } catch {
      setError("No se pudo cargar el diagnóstico MP.");
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
      setError("No se pudo copiar.");
    }
  };

  return (
    <section className="rounded-[20px] border border-gray-100 dark:border-[#3d3732] bg-white dark:bg-[#1c1917] px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => void toggle()} className="flex items-center gap-2 cursor-pointer">
          <MaterialSymbol icon="terminal" size={16} className="text-gray-400" />
          <span className="text-[13px] font-bold text-gray-900 dark:text-white">Herramientas de desarrollador</span>
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
          {error && <p className="text-red-600">{error}</p>}
          {loading && !data ? (
            <p className="text-gray-400 flex items-center gap-2">
              <MaterialSymbol icon="progress_activity" size={14} className="animate-spin" />
              Cargando…
            </p>
          ) : data ? (
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
              <div>
                <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Últimas sesiones QR</h4>
                {(data.sessions as { status: string; amount_cents: number; created_at: string }[]).length === 0 ? (
                  <p className="text-gray-400">Sin sesiones aún.</p>
                ) : (
                  <ul className="space-y-1 font-mono text-[11px] text-gray-500">
                    {(data.sessions as { status: string; amount_cents: number; created_at: string }[]).map((s, i) => (
                      <li key={i}>
                        {s.status} · ${(s.amount_cents / 100).toFixed(0)} · {new Date(s.created_at).toLocaleString("es-AR")}
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
          ) : null}
        </div>
      )}
    </section>
  );
}
