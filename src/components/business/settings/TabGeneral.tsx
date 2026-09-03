"use client";

import { useState } from "react";
import Image from "next/image";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { updateBusinessGeneralSettings } from "@/lib/business/actions";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";
import type { BusinessRow } from "@/lib/business/queries";

export function TabGeneral({
  business,
  businessId,
}: {
  business: BusinessRow;
  businessId: string;
}) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoUrl = resolveBusinessAssetUrl(business.logo_path);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      await updateBusinessGeneralSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Section (Inspired by Crisply reference) */}
      <section className="bg-white dark:bg-[#1c1917] rounded-[24px] p-6 sm:p-8 border border-stone-200/80 dark:border-[#332e2a] shadow-sm">
        <div className="border-b border-stone-100 dark:border-[#2a2623] pb-6 mb-6">
          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
            Perfil del Comercio
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Información visible para tus clientes en el catálogo web y pedidos.
          </p>
        </div>

        {/* Logo / Image preview & actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-stone-100 dark:border-[#2a2623]">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-stone-100 dark:bg-[#2a2623] border-2 border-stone-200 dark:border-stone-700 flex items-center justify-center flex-shrink-0 shadow-inner">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={business.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-2xl font-black text-stone-400">
                {business.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <a
                href={`/negocio/${businessId}/carta`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold hover:opacity-90 transition shadow-sm cursor-pointer"
              >
                <MaterialSymbol icon="image" size={16} />
                <span>Gestionar Logo en Carta</span>
              </a>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Formato recomendado en alta resolución para avatar del catálogo.
            </p>
          </div>
        </div>

        {/* Main Details Form */}
        <form onSubmit={handleSubmit} className="pt-6 space-y-5">
          <input type="hidden" name="businessId" value={businessId} />

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <MaterialSymbol icon="error" size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <MaterialSymbol icon="check_circle" size={18} />
              <span>Cambios guardados con éxito.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Nombre del comercio
              </label>
              <input
                type="text"
                name="name"
                defaultValue={business.name}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1c] text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#9a0002]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                URL pública (Slug)
              </label>
              <div className="flex rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#231f1c] overflow-hidden focus-within:ring-2 focus-within:ring-[#9a0002]/30">
                <span className="px-3 py-2.5 text-xs text-stone-400 select-none flex items-center border-r border-stone-200 dark:border-stone-700">
                  /c/
                </span>
                <input
                  type="text"
                  name="slug"
                  defaultValue={business.slug}
                  required
                  className="w-full px-3 py-2.5 bg-transparent text-stone-900 dark:text-stone-100 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Eslogan o descripción corta
            </label>
            <input
              type="text"
              name="tagline"
              defaultValue={business.tagline || ""}
              placeholder="Ej: Las mejores hamburguesas a la leña de Bolívar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1c] text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#9a0002]/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                defaultValue={business.address || ""}
                placeholder="Ej: Av. San Martín 123"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1c] text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#9a0002]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Ciudad
              </label>
              <input
                type="text"
                name="city"
                defaultValue={business.city || "Bolívar"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1c] text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#9a0002]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Teléfono de contacto
            </label>
            <input
              type="text"
              name="phone"
              defaultValue={business.phone || ""}
              placeholder="Ej: 2314 123456"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1c] text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#9a0002]/30"
            />
          </div>

          {/* Action button right-aligned like Crisply */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#9a0002] hover:bg-[#800001] text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <MaterialSymbol icon="progress_activity" size={16} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <MaterialSymbol icon="save" size={16} />
                  <span>Guardar cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
