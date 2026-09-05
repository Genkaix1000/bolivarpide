"use client";

import { useEffect, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  connectWhatsAppNumber,
  updateWhatsAppNotifySettings,
} from "@/lib/business/whatsapp";
import type { WhatsAppConnection } from "@/lib/business/whatsappQueries";

type BannerResult = { ok: boolean; text: string };

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function WhatsAppConnectionCard({
  businessId,
  connection,
  initial,
}: {
  businessId: string;
  connection: WhatsAppConnection | null;
  initial?: BannerResult | null;
}) {
  const [open, setOpen] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState(
    connection?.phone_number_id ?? "",
  );
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState(
    connection?.display_phone_number ?? "",
  );
  const [wabaId, setWabaId] = useState(connection?.waba_id ?? "");
  const [accessToken, setAccessToken] = useState("");
  const [notifyStatus, setNotifyStatus] = useState(
    connection?.notify_status ?? false,
  );
  const [templateOrderStatusName, setTemplateOrderStatusName] = useState(
    connection?.template_order_status_name ?? "",
  );
  const [templateOrderStatusLanguage, setTemplateOrderStatusLanguage] = useState(
    connection?.template_order_status_language ?? "es_AR",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState<BannerResult | null>(initial ?? null);
  const [notifyPending, setNotifyPending] = useState(false);
  const [notifyError, setNotifyError] = useState("");
  const [notifySaved, setNotifySaved] = useState(false);

  const active = connection?.is_active ?? false;
  const oauthHref = `/api/meta/oauth/start?businessId=${encodeURIComponent(businessId)}`;
  const expiresAt = connection?.token_expires_at ?? null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("whatsapp")) {
      params.delete("whatsapp");
      params.delete("why");
      const qs = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData();
    form.set("businessId", businessId);
    form.set("phoneNumberId", phoneNumberId);
    form.set("displayPhoneNumber", displayPhoneNumber);
    form.set("wabaId", wabaId);
    form.set("accessToken", accessToken);
    try {
      await connectWhatsAppNumber(form);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo conectar.");
    } finally {
      setPending(false);
    }
  }

  async function handleSaveNotify(e: React.FormEvent) {
    e.preventDefault();
    setNotifyPending(true);
    setNotifyError("");
    setNotifySaved(false);
    const form = new FormData();
    form.set("businessId", businessId);
    form.set("notifyStatus", String(notifyStatus));
    form.set("templateOrderStatusName", templateOrderStatusName);
    form.set("templateOrderStatusLanguage", templateOrderStatusLanguage);
    try {
      await updateWhatsAppNotifySettings(form);
      setNotifySaved(true);
    } catch (err) {
      setNotifyError(
        err instanceof Error ? err.message : "No se pudieron guardar los avisos.",
      );
    } finally {
      setNotifyPending(false);
    }
  }

  return (
    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#231f1c] border border-gray-100 dark:border-[#3d3732]">
      {banner && (
        <div
          className={`mb-3 px-3 py-2 rounded-lg text-[11px] font-semibold flex items-start gap-2 ${
            banner.ok
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
          }`}
        >
          <MaterialSymbol
            icon={banner.ok ? "check_circle" : "error"}
            size={15}
            className="mt-0.5 flex-shrink-0"
          />
          <span>{banner.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              active
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
          >
            <MaterialSymbol icon="chat" size={20} />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
              WhatsApp Business
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {active
                ? `Conectado · ${connection?.display_phone_number ?? connection?.phone_number_id ?? ""}`
                : connection
                  ? `${connection.display_phone_number ?? connection.phone_number_id} · pendiente de verificación`
                  : "Sin vincular — recibí y respondé mensajes por WhatsApp"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[11px] font-bold text-[#9a0002] hover:bg-[#9a0002]/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1"
        >
          <MaterialSymbol icon="tune" size={14} />
          Configuración avanzada
        </button>
      </div>

      {!active ? (
        <div className="mt-4 space-y-2">
          <a
            href={oauthHref}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#9a0002] hover:bg-[#850002] text-white text-xs font-bold rounded-full transition-all shadow-md cursor-pointer"
          >
            <MaterialSymbol icon="link" size={16} />
            Conectar con Meta / WhatsApp
          </a>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
            Te redirige a Meta para autorizar con tu cuenta. No vas a necesitar
            pegar tokens manualmente.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="rounded-xl border border-gray-200 dark:border-[#3d3732] p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <MaterialSymbol icon="verified" size={15} className="text-emerald-500" />
              <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200">
                {connection?.verified_name ?? "Número verificado"} ·{" "}
                {connection?.display_phone_number ?? connection?.phone_number_id}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 flex items-center gap-1.5">
              <MaterialSymbol icon="schedule" size={13} className="text-slate-400" />
              {expiresAt
                ? `Token vigente hasta el ${formatDate(expiresAt)}`
                : "Token de Meta vinculado"}
            </p>
          </div>
          <a
            href={oauthHref}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#9a0002]/5 hover:bg-[#9a0002]/10 text-[#9a0002] text-xs font-bold rounded-full transition-colors cursor-pointer"
          >
            <MaterialSymbol icon="refresh" size={16} />
            Reconectar con Meta
          </a>
        </div>
      )}

      {connection && (
        <form
          onSubmit={handleSaveNotify}
          className="mt-4 rounded-xl border border-gray-200 dark:border-[#3d3732] p-3 space-y-2.5"
        >
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyStatus}
              onChange={(e) => {
                setNotifyStatus(e.target.checked);
                setNotifySaved(false);
              }}
              className="mt-0.5"
            />
            <span className="block">
              <span className="block text-[12px] font-bold text-gray-700 dark:text-gray-200">
                Notificar estado del pedido por WhatsApp
              </span>
              <span className="block text-[10px] text-gray-400 mt-0.5">
                El cliente recibe el avance (cocina, en camino, entregado, rechazado). Dentro
                de las 24 h va texto libre; fuera de la ventana usa una template aprobada de
                Meta.
              </span>
            </span>
          </label>

          {notifyStatus && (
            <>
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                  Template de estado de pedido
                </label>
                <input
                  value={templateOrderStatusName}
                  onChange={(e) => {
                    setTemplateOrderStatusName(e.target.value);
                    setNotifySaved(false);
                  }}
                  placeholder="ej. shipping_update"
                  className="w-full bg-white dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:border-[#9a0002]/50"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Nombre de la template aprobada en tu WABA (los parámetros
                  se envían como: pedido, título, subtítulo). Sin template, el
                  aviso sale sólo dentro de las 24 h.
                </p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                  Idioma
                </label>
                <input
                  value={templateOrderStatusLanguage}
                  onChange={(e) => {
                    setTemplateOrderStatusLanguage(e.target.value);
                    setNotifySaved(false);
                  }}
                  placeholder="es_AR"
                  className="w-full bg-white dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:border-[#9a0002]/50"
                />
              </div>
            </>
          )}

          {notifyError && (
            <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
              {notifyError}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={notifyPending}
              className="px-4 py-1.5 bg-[#9a0002]/10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#9a0002]/15 text-[#9a0002] text-[11px] font-bold rounded-full transition-colors cursor-pointer"
            >
              {notifyPending ? "Guardando..." : "Guardar avisos"}
            </button>
            {notifySaved && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <MaterialSymbol icon="check_circle" size={13} />
                Guardado
              </span>
            )}
          </div>
        </form>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-gray-100 dark:border-[#3d3732] pt-4">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Solo para casos técnicos: pegá los datos tal como aparecen en tu App
            de Meta. El token se guarda cifrado en Supabase Vault.
          </p>

          <div>
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
              Phone Number ID
            </label>
            <input
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              required
              placeholder="ej. 1045..."
              className="w-full bg-white dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:border-[#9a0002]/50"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
              Número visible (opcional)
            </label>
            <input
              value={displayPhoneNumber}
              onChange={(e) => setDisplayPhoneNumber(e.target.value)}
              placeholder="ej. +54 9 2314 000000"
              className="w-full bg-white dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:border-[#9a0002]/50"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
              WABA ID (opcional)
            </label>
            <input
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
              placeholder="WhatsApp Business Account ID"
              className="w-full bg-white dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:border-[#9a0002]/50"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
              Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              required={!connection}
              placeholder={connection ? "Dejar vacío para no cambiar" : "Token de Meta"}
              className="w-full bg-white dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:border-[#9a0002]/50"
            />
          </div>

          {error && (
            <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full px-4 py-2.5 bg-[#9a0002] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#850002] text-white text-xs font-bold rounded-full transition-all shadow-md cursor-pointer"
          >
            {pending ? "Guardando..." : connection ? "Actualizar conexión" : "Vincular número"}
          </button>
        </form>
      )}
    </div>
  );
}

export { WhatsAppConnectionCard as default };