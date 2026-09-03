"use client";

import { useRef, useState, useTransition } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";
import { formatLocalMobile } from "@/lib/business/phone";
import {
  removeBusinessImageAction,
  updateBusinessProfileAction,
  uploadBusinessImageAction,
} from "@/lib/business/settingsActions";
import {
  BUSINESS_BANNER_OPTS,
  BUSINESS_LOGO_OPTS,
  menuImageSizeHint,
  optimizeImageFile,
  type OptimizeImageOptions,
} from "@/lib/images/optimizeImage";
import { cn } from "@/lib/utils";

type Props = {
  businessId: string;
  name: string;
  slug: string;
  tagline: string | null;
  address: string | null;
  city: string;
  phone: string | null;
  logoPath: string | null;
  bannerPath: string | null;
};

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400 dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-100 dark:focus:border-gray-500";
const labelCls = "mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400";
const sectionCls =
  "rounded-[20px] border border-gray-100 bg-white p-6 dark:border-[#3d3732] dark:bg-[#1c1917] penpot-shadow sm:p-7";
const btnPrimary =
  "cursor-pointer rounded-full bg-[#9a0002] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#850002] disabled:opacity-60";
const btnSecondary =
  "cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-[#f5f1eb] disabled:opacity-60 dark:border-[#3d3732] dark:bg-transparent dark:text-gray-200 dark:hover:bg-[#2a2623]";

function localPhone(stored: string | null) {
  if (!stored) return "";
  const digits = stored.replace(/\D/g, "");
  const local = digits.startsWith("549")
    ? digits.slice(3)
    : digits.startsWith("54")
      ? digits.slice(2)
      : digits;
  return formatLocalMobile(local.slice(0, 10));
}

function ImageRow({
  businessId,
  kind,
  label,
  path,
  round,
  opts,
}: {
  businessId: string;
  kind: "logo" | "banner";
  label: string;
  path: string | null;
  round?: boolean;
  opts: OptimizeImageOptions;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const url = resolveBusinessAssetUrl(path);
  const sizeHint = menuImageSizeHint(opts);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    start(async () => {
      try {
        const optimized = await optimizeImageFile(file, opts);
        const fd = new FormData();
        fd.set("businessId", businessId);
        fd.set("kind", kind);
        fd.set("file", optimized);
        await uploadBusinessImageAction(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al subir");
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden bg-gray-100 dark:bg-[#2a2623]",
            round ? "h-16 w-16 rounded-full" : "h-16 w-28 rounded-xl",
          )}
        >
          {url ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <MaterialSymbol
              icon={kind === "logo" ? "storefront" : "image"}
              size={24}
              className="text-gray-400"
            />
          )}
          {pending ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[9px] font-semibold text-white">
              Optimizando…
            </span>
          ) : null}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Exacto {sizeHint}px
            {kind === "logo" ? " (cuadrado 1:1)" : " (horizontal 8:3)"}
            {" · "}
            WebP automático
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400">
            Si no coincide, se recorta al centro · PNG/JPEG/GIF/WebP · máx. 2 MB
          </p>
          {error ? <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p> : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className={btnPrimary}
        >
          {pending ? "Procesando…" : path ? "Cambiar imagen" : "+ Subir imagen"}
        </button>
        {path ? (
          <form
            action={(fd) => {
              setError(null);
              start(async () => {
                try {
                  await removeBusinessImageAction(fd);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Error");
                }
              });
            }}
          >
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="kind" value={kind} />
            <button type="submit" disabled={pending} className={btnSecondary}>
              Quitar
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function GeneralSettingsForm(props: Props) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
          Perfil del local
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Identidad, branding y datos de contacto visibles en la tienda.
        </p>
      </div>

      <section className={sectionCls}>
        <h3 className="mb-5 text-sm font-bold text-gray-900 dark:text-gray-100">Branding</h3>
        <div className="space-y-6">
          <ImageRow
            businessId={props.businessId}
            kind="logo"
            label="Logo"
            path={props.logoPath}
            round
            opts={BUSINESS_LOGO_OPTS}
          />
          <div className="border-t border-gray-100 dark:border-[#3d3732]" />
          <ImageRow
            businessId={props.businessId}
            kind="banner"
            label="Portada"
            path={props.bannerPath}
            opts={BUSINESS_BANNER_OPTS}
          />
        </div>
      </section>

      <form
        className={sectionCls}
        action={(fd) => {
          setMsg(null);
          start(async () => {
            try {
              await updateBusinessProfileAction(fd);
              setMsg({ ok: true, text: "Perfil guardado" });
            } catch (e) {
              setMsg({ ok: false, text: e instanceof Error ? e.message : "Error al guardar" });
            }
          });
        }}
      >
        <input type="hidden" name="businessId" value={props.businessId} />
        <h3 className="mb-5 text-sm font-bold text-gray-900 dark:text-gray-100">Identidad</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="name">
              Nombre del local
            </label>
            <input id="name" name="name" required defaultValue={props.name} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="slug">
              URL pública
            </label>
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-[11px] text-gray-400">/c/</span>
              <input id="slug" name="slug" required defaultValue={props.slug} className={inputCls} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="tagline">
              Eslogan
            </label>
            <input
              id="tagline"
              name="tagline"
              defaultValue={props.tagline ?? ""}
              placeholder="Ej. Lo mejor de Bolívar"
              className={inputCls}
            />
          </div>
        </div>

        <div className="my-6 border-t border-gray-100 dark:border-[#3d3732]" />

        <h3 className="mb-5 text-sm font-bold text-gray-900 dark:text-gray-100">
          Ubicación y contacto
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="address">
              Dirección
            </label>
            <input
              id="address"
              name="address"
              defaultValue={props.address ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="city">
              Ciudad
            </label>
            <input id="city" name="city" defaultValue={props.city} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="phone">
              Teléfono
            </label>
            <input
              id="phone"
              name="phone"
              defaultValue={localPhone(props.phone)}
              placeholder="2314 443322"
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          {msg ? (
            <p className={cn("text-xs font-medium", msg.ok ? "text-emerald-600" : "text-red-600")}>
              {msg.text}
            </p>
          ) : null}
          <button type="submit" disabled={pending} className={cn(btnPrimary, "px-5 py-2.5")}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
