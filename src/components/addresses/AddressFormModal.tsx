"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { formatLocalMobile } from "@/lib/business/phone";
import { BOLIVAR_CENTER, BOLIVAR_DEFAULTS, MAX_USER_ADDRESSES } from "@/lib/addresses/constants";
import { getCurrentPosition, queryGeolocationAccess, reverseGeocode } from "@/lib/addresses/geocode";
import {
  deleteUserAddressAction,
  saveUserAddressAction,
} from "@/lib/addresses/actions";
import type { UserAddress } from "@/lib/addresses/types";
import { flashToast, flashToastUndo } from "@/components/FlashToast";

import { StreetAutocomplete } from "./StreetAutocomplete";
import { isWithinBolivar } from "@/lib/addresses/bolivar";

type Props = {
  open: boolean;
  editing: UserAddress | null;
  presetContact?: { firstName: string; lastName: string; phoneLocal: string };
  onClose: () => void;
  onSaved: (addr: UserAddress) => void;
  onDeleted: (deleted: UserAddress) => void;
};

function storedPhoneToLocal(stored: string) {
  const digits = stored.replace(/\D/g, "");
  const local = digits.startsWith("549") ? digits.slice(3) : digits;
  return formatLocalMobile(local);
}

const emptyForm = (preset?: Props["presetContact"]) => ({
  street: "",
  streetNumber: "",
  noNumber: false,
  deliveryNotes: "",
  contactFirstName: preset?.firstName ?? "",
  contactLastName: preset?.lastName ?? "",
  contactPhoneLocal: preset?.phoneLocal ?? "",
  lat: null as number | null,
  lng: null as number | null,
});

export function AddressFormModal({
  open,
  editing,
  presetContact,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [form, setForm] = useState(emptyForm(presetContact));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [geoPending, setGeoPending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDeleteConfirm(false);
    if (editing) {
      setForm({
        street: editing.street,
        streetNumber: editing.streetNumber ?? "",
        noNumber: editing.noNumber,
        deliveryNotes: editing.deliveryNotes,
        contactFirstName: editing.contactFirstName,
        contactLastName: editing.contactLastName,
        contactPhoneLocal: storedPhoneToLocal(editing.contactPhone),
        lat: editing.lat,
        lng: editing.lng,
      });
    } else {
      setForm(emptyForm(presetContact));
    }
  }, [open, editing, presetContact]);

  async function handleUseLocation() {
    setError(null);
    const access = await queryGeolocationAccess();
    if (access === "unsupported") {
      flashToast("Tu navegador no soporta ubicación. Escribí tu calle manualmente.");
      return;
    }
    if (access === "denied") {
      flashToast("Ubicación bloqueada. Candado en la barra → Ubicación → Permitir.");
      return;
    }

    setGeoPending(true);
    flashToast("Buscando tu ubicación…");

    try {
      const pos = await getCurrentPosition();
      const { latitude, longitude } = pos.coords;
      const within = isWithinBolivar(latitude, longitude);
      const targetLat = within ? latitude : BOLIVAR_CENTER.lat;
      const targetLng = within ? longitude : BOLIVAR_CENTER.lng;

      setForm((f) => ({
        ...f,
        lat: Number(targetLat.toFixed(6)),
        lng: Number(targetLng.toFixed(6)),
      }));

      if (!within) {
        flashToast("Estás fuera de Bolívar. Marcaremos el centro urbano.");
        return;
      }

      const result = await reverseGeocode(latitude, longitude);
      if (result?.street) {
        setForm((f) => ({
          ...f,
          street: result.street,
          streetNumber: result.streetNumber || f.streetNumber,
          noNumber: !result.streetNumber && f.noNumber,
          lat: Number(result.lat.toFixed(6)),
          lng: Number(result.lng.toFixed(6)),
        }));
        flashToast(`Detectamos: ${result.street}. Revisá el número.`);
      } else {
        flashToast("Ubicación tomada. Completá calle y número.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No pudimos obtener la ubicación.";
      setError(msg);
      flashToast(msg);
    } finally {
      setGeoPending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const saved = await saveUserAddressAction(form, editing?.id);
      flashToast(editing ? "Dirección actualizada." : "Dirección guardada.");
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeletePending(true);
    try {
      const deleted = await deleteUserAddressAction(editing.id);
      onDeleted(deleted);
      onClose();
      flashToastUndo({
        message: "Dirección eliminada.",
        onUndo: async () => {
          const { restoreUserAddressAction } = await import("@/lib/addresses/actions");
          const restored = await restoreUserAddressAction(deleted);
          onSaved(restored);
          flashToast("Dirección restaurada.");
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
      setDeleteConfirm(false);
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop on desktop */}
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] hidden bg-black/45 backdrop-blur-[2px] md:block"
          />

          {/* Fullscreen on mobile, centered modal on desktop */}
          <motion.div
            role="dialog"
            aria-modal
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[71] flex flex-col bg-[#faf6f1] overflow-y-auto custom-scrollbar dark:bg-[#161412] md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-h-[min(92vh,740px)] md:w-full md:max-w-lg md:rounded-[28px] md:border md:border-[#e8e0d6] md:bg-white md:shadow-2xl md:dark:border-[#3d3732] md:dark:bg-[#231f1c]"
          >
            {/* Mobile Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8e0d6] bg-[#faf6f1]/90 px-4 py-3.5 backdrop-blur-md dark:border-[#3d3732] dark:bg-[#161412]/90 md:hidden">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-600 hover:text-[#9a0002] dark:text-gray-300 dark:hover:text-red-400"
              >
                <MaterialSymbol icon="arrow_back" size={18} />
                <span>Volver</span>
              </button>
              <span className="text-[14px] font-bold text-gray-900 dark:text-white">
                {editing ? "Editar dirección" : "Nueva dirección"}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623]"
              >
                <MaterialSymbol icon="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col p-5 pb-10 md:p-8">
              {/* Desktop Header button */}
              <div className="hidden md:block">
                <button
                  type="button"
                  onClick={onClose}
                  className="mb-3 inline-flex w-fit items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#9a0002] dark:text-gray-400"
                >
                  <MaterialSymbol icon="arrow_back" size={14} />
                  Volver
                </button>

                <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  {editing ? "Editar dirección" : "Nueva dirección"}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {editing
                    ? "Actualizá los datos de entrega."
                    : `Podés guardar hasta ${MAX_USER_ADDRESSES} direcciones en Bolívar.`}
                </p>
              </div>

              {/* Mobile subheader */}
              <div className="mb-2 md:hidden">
                <p className="text-[13px] text-gray-500 dark:text-gray-400">
                  {editing
                    ? "Actualizá los datos de entrega."
                    : `Podés guardar hasta ${MAX_USER_ADDRESSES} direcciones en Bolívar.`}
                </p>
              </div>

              <div className="mt-4 space-y-4 md:mt-6 md:space-y-5">
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={geoPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#9a0002]/25 bg-[#9a0002]/8 py-3 text-sm font-bold text-[#9a0002] transition hover:bg-[#9a0002]/15 active:scale-[0.99] disabled:opacity-60 dark:bg-[#9a0002]/15 dark:text-red-300 cursor-pointer"
                >
                  <MaterialSymbol icon="my_location" size={18} />
                  {geoPending ? "Buscando ubicación…" : "Usar mi ubicación actual"}
                </button>

                <Field label="Calle" hint="Escribí para ver sugerencias de Bolívar">
                  <StreetAutocomplete
                    value={form.street}
                    onChange={(street) => setForm((f) => ({ ...f, street }))}
                    placeholder="Ej. Av. San Martín, Colombia, Alsina..."
                    required
                  />
                </Field>

                <Field label="Número">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      value={form.streetNumber}
                      onChange={(e) => setForm((f) => ({ ...f, streetNumber: e.target.value }))}
                      placeholder="450"
                      disabled={form.noNumber}
                      className={cn(inputClass, form.noNumber && "opacity-50")}
                    />
                    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={form.noNumber}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            noNumber: e.target.checked,
                            streetNumber: e.target.checked ? "" : f.streetNumber,
                          }))
                        }
                        className="h-4 w-4 rounded border-stone-300 text-[#9a0002] focus:ring-[#9a0002] dark:border-stone-600 cursor-pointer"
                      />
                      Sin número
                    </label>
                  </div>
                </Field>

                <div className="rounded-xl border border-[#e8e0d6] bg-white px-3.5 py-2.5 text-[12px] text-stone-600 dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-300">
                  {BOLIVAR_DEFAULTS.city} · CP {BOLIVAR_DEFAULTS.postalCode} · {BOLIVAR_DEFAULTS.province}
                </div>

                <Field label="Indicaciones para la entrega" hint="Piso, timbre, referencias, color de portón…">
                  <textarea
                    value={form.deliveryNotes}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryNotes: e.target.value }))}
                    rows={2}
                    placeholder="Ej. Timbre 3B, portón negro, entre calles..."
                    className={cn(inputClass, "resize-none")}
                  />
                </Field>

                <div className="border-t border-[#e8e0d6] pt-4 dark:border-[#3d3732]">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Datos de contacto
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Nombre">
                      <input
                        value={form.contactFirstName}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, contactFirstName: e.target.value }))
                        }
                        className={inputClass}
                        required
                      />
                    </Field>
                    <Field label="Apellido">
                      <input
                        value={form.contactLastName}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, contactLastName: e.target.value }))
                        }
                        className={inputClass}
                        required
                      />
                    </Field>
                  </div>
                  <div className="mt-3">
                    <Field label="Teléfono">
                      <div className={phoneWrapClass}>
                        <span className="flex shrink-0 items-center border-r border-[#e8e0d6] bg-[#f5f1eb] px-3.5 text-[13px] font-bold text-stone-600 dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-stone-300">
                          +54 9
                        </span>
                        <input
                          value={form.contactPhoneLocal}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              contactPhoneLocal: formatLocalMobile(e.target.value),
                            }))
                          }
                          placeholder="2314 443322"
                          inputMode="numeric"
                          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[13px] text-stone-900 outline-none placeholder:text-stone-400 dark:text-white dark:placeholder:text-stone-500"
                          required
                        />
                      </div>
                    </Field>
                  </div>
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-[12px] font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#9a0002] py-3.5 text-sm font-bold text-white shadow-md shadow-[#9a0002]/25 transition hover:brightness-110 active:brightness-90 disabled:opacity-60 cursor-pointer"
              >
                {pending ? "Guardando…" : editing ? "Guardar cambios" : "Guardar dirección"}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deletePending}
                  className={cn(
                    "mt-3 w-full rounded-full border py-3 text-sm font-bold transition cursor-pointer",
                    deleteConfirm
                      ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                      : "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30",
                  )}
                >
                  {deletePending
                    ? "Eliminando…"
                    : deleteConfirm
                      ? "¿Confirmar eliminación?"
                      : "Eliminar dirección"}
                </button>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</label>
      {hint && <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#e8e0d6] bg-white px-3.5 py-2.5 text-[13px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#9a0002]/60 focus:ring-2 focus:ring-[#9a0002]/10 dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-white dark:placeholder:text-stone-500";

const phoneWrapClass =
  "flex overflow-hidden rounded-xl border border-[#e8e0d6] bg-white transition focus-within:border-[#9a0002]/60 focus-within:ring-2 focus-within:ring-[#9a0002]/10 dark:border-[#3d3732] dark:bg-[#2a2623]";
