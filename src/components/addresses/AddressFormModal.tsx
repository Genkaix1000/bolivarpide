"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { formatLocalMobile } from "@/lib/business/phone";
import { BOLIVAR_DEFAULTS, MAX_USER_ADDRESSES } from "@/lib/addresses/constants";
import { getCurrentPosition, reverseGeocode } from "@/lib/addresses/geocode";
import {
  deleteUserAddressAction,
  saveUserAddressAction,
} from "@/lib/addresses/actions";
import type { UserAddress } from "@/lib/addresses/types";
import { flashToast, flashToastUndo } from "@/components/FlashToast";

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
    setGeoPending(true);
    try {
      const pos = await getCurrentPosition();
      const { latitude, longitude } = pos.coords;
      const result = await reverseGeocode(latitude, longitude);
      if (!result) {
        setError("No pudimos obtener la dirección. Completala manualmente.");
        return;
      }
      if (!result.withinBolivar) {
        setError("Por ahora solo operamos en San Carlos de Bolívar");
        return;
      }
      setForm((f) => ({
        ...f,
        street: result.street,
        streetNumber: result.streetNumber ?? "",
        noNumber: !result.streetNumber,
        lat: result.lat,
        lng: result.lng,
      }));
    } catch {
      setError("No pudimos usar tu ubicación. Completá la dirección manualmente.");
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
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-x-3 top-[max(1rem,env(safe-area-inset-top))] z-[71] mx-auto max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/20 bg-white shadow-2xl custom-scrollbar dark:bg-[#231f1c] md:inset-x-auto md:left-1/2 md:-translate-x-1/2"
          >
            <form onSubmit={handleSubmit} className="flex flex-col p-6 md:p-8">
              <button
                type="button"
                onClick={onClose}
                className="mb-4 inline-flex w-fit items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#9a0002]"
              >
                <MaterialSymbol icon="arrow_back" size={14} />
                Volver
              </button>

              <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                {editing ? "Editar dirección" : "Nueva dirección"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {editing
                  ? "Actualizá los datos de entrega."
                  : `Podés guardar hasta ${MAX_USER_ADDRESSES} direcciones en Bolívar.`}
              </p>

              <div className="mt-6 space-y-5">
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={geoPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#9a0002]/25 bg-[#9a0002]/5 py-3 text-sm font-bold text-[#9a0002] transition hover:bg-[#9a0002]/10 disabled:opacity-60"
                >
                  <MaterialSymbol icon="my_location" size={18} />
                  {geoPending ? "Obteniendo ubicación…" : "Usar mi ubicación"}
                </button>

                <Field label="Calle">
                  <input
                    value={form.street}
                    onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                    placeholder="Av. San Martín"
                    className={inputClass}
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
                    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[12px] font-semibold text-gray-600">
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
                        className="h-4 w-4 rounded border-stone-300 text-[#9a0002] focus:ring-[#9a0002]"
                      />
                      Sin número
                    </label>
                  </div>
                </Field>

                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-[12px] text-stone-500">
                  {BOLIVAR_DEFAULTS.city} · {BOLIVAR_DEFAULTS.province} · CP{" "}
                  {BOLIVAR_DEFAULTS.postalCode}
                </div>

                <Field label="Indicaciones para la entrega" hint="Piso, timbre, referencias…">
                  <textarea
                    value={form.deliveryNotes}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryNotes: e.target.value }))}
                    rows={2}
                    placeholder="Ej. Timbre 3B, portón negro"
                    className={cn(inputClass, "resize-none")}
                  />
                </Field>

                <div className="border-t border-stone-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
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
                        <span className="flex shrink-0 items-center border-r border-stone-200 bg-stone-50 px-3.5 text-[13px] font-bold text-stone-500">
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
                          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] text-stone-900 outline-none placeholder:text-stone-400"
                          required
                        />
                      </div>
                    </Field>
                  </div>
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#9a0002] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#850002] disabled:opacity-60"
              >
                {pending ? "Guardando…" : editing ? "Guardar cambios" : "Guardar dirección"}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deletePending}
                  className={cn(
                    "mt-3 w-full rounded-full border py-3 text-sm font-bold transition",
                    deleteConfirm
                      ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                      : "border-red-200 text-red-600 hover:bg-red-50",
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
      <label className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label>
      {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-white";

const phoneWrapClass =
  "flex overflow-hidden rounded-lg border border-stone-200 bg-white transition focus-within:border-stone-400 dark:border-[#3d3732] dark:bg-[#2a2623]";
