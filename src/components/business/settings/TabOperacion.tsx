"use client";

import { useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  updateBusinessOperationSettings,
  updateBusinessHoursSchedule,
} from "@/lib/business/actions";
import type { BusinessRow } from "@/lib/business/queries";

type HourRow = {
  weekday: number;
  open_time: string;
  close_time: string;
  closed: boolean;
};

const WEEKDAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function TabOperacion({
  business,
  businessId,
  initialHours,
}: {
  business: BusinessRow;
  businessId: string;
  initialHours: HourRow[];
}) {
  const [isOpen, setIsOpen] = useState(business.is_open);
  const [prepTime, setPrepTime] = useState(business.prep_time_minutes || 30);
  const [savingState, setSavingState] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Normalize hours for all 7 days
  const [hours, setHours] = useState<HourRow[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const found = initialHours.find((h) => h.weekday === i);
      return (
        found || {
          weekday: i,
          open_time: "10:00",
          close_time: "23:00",
          closed: i === 0,
        }
      );
    });
  });

  async function handleToggleStatus(newVal: boolean) {
    setIsOpen(newVal);
    setSavingState(true);
    setStatusMsg(null);
    try {
      const fd = new FormData();
      fd.append("businessId", businessId);
      fd.append("isOpen", newVal ? "true" : "false");
      fd.append("prepTimeMinutes", String(prepTime));
      await updateBusinessOperationSettings(fd);
      setStatusMsg({ type: "ok", text: newVal ? "Comercio abierto para pedidos" : "Comercio cerrado temporalmente" });
    } catch {
      setStatusMsg({ type: "err", text: "No se pudo actualizar el estado" });
    } finally {
      setSavingState(false);
    }
  }

  async function handleSavePrepTime() {
    setSavingState(true);
    setStatusMsg(null);
    try {
      const fd = new FormData();
      fd.append("businessId", businessId);
      fd.append("isOpen", isOpen ? "true" : "false");
      fd.append("prepTimeMinutes", String(prepTime));
      await updateBusinessOperationSettings(fd);
      setStatusMsg({ type: "ok", text: "Tiempo de preparación actualizado" });
    } catch {
      setStatusMsg({ type: "err", text: "Error al actualizar tiempo" });
    } finally {
      setSavingState(false);
    }
  }

  function handleHourChange(weekday: number, field: keyof HourRow, val: any) {
    setHours((prev) =>
      prev.map((h) => (h.weekday === weekday ? { ...h, [field]: val } : h))
    );
  }

  async function handleSaveHours() {
    setSavingHours(true);
    setStatusMsg(null);
    try {
      await updateBusinessHoursSchedule(businessId, hours);
      setStatusMsg({ type: "ok", text: "Horarios de atención actualizados con éxito" });
    } catch {
      setStatusMsg({ type: "err", text: "Error al guardar los horarios" });
    } finally {
      setSavingHours(false);
    }
  }

  return (
    <div className="space-y-8">
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all ${
            statusMsg.type === "ok"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
          }`}
        >
          <MaterialSymbol icon={statusMsg.type === "ok" ? "check_circle" : "error"} size={18} />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Immediate operational state */}
      <section className="bg-white dark:bg-[#1c1917] rounded-[24px] p-6 sm:p-8 border border-stone-200/80 dark:border-[#332e2a] shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
            Control de Apertura
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Gestioná si tu local puede recibir pedidos inmediatamente en este momento.
          </p>
        </div>

        {/* Toggle switch like Crisply reference */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-[#231f1c] border border-stone-100 dark:border-stone-800">
          <div>
            <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100">
              {isOpen ? "Local Abierto" : "Local Cerrado"}
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {isOpen
                ? "Los clientes pueden realizar pedidos con normalidad."
                : "Se informa a los clientes que el local se encuentra cerrado."}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isOpen}
              disabled={savingState}
              onChange={(e) => handleToggleStatus(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-stone-600 peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Preparation time */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
            Tiempo estimado de preparación y entrega
          </label>
          <div className="flex items-center gap-3">
            <div className="relative max-w-[160px]">
              <input
                type="number"
                min="5"
                max="180"
                value={prepTime}
                onChange={(e) => setPrepTime(parseInt(e.target.value, 10) || 0)}
                className="w-full pl-3.5 pr-12 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1c] text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#9a0002]/30"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-bold select-none">
                min
              </span>
            </div>
            <button
              type="button"
              onClick={handleSavePrepTime}
              disabled={savingState}
              className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-bold transition cursor-pointer"
            >
              Guardar tiempo
            </button>
          </div>
        </div>
      </section>

      {/* Schedule Table / Grid */}
      <section className="bg-white dark:bg-[#1c1917] rounded-[24px] p-6 sm:p-8 border border-stone-200/80 dark:border-[#332e2a] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 dark:border-[#2a2623] pb-6">
          <div>
            <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
              Horarios Semanales de Atención
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Configurá los rangos horarios en los que tu cocina despacha pedidos.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveHours}
            disabled={savingHours}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#9a0002] hover:bg-[#800001] text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
          >
            {savingHours ? (
              <MaterialSymbol icon="progress_activity" size={16} className="animate-spin" />
            ) : (
              <MaterialSymbol icon="save" size={16} />
            )}
            <span>Guardar horarios</span>
          </button>
        </div>

        <div className="space-y-3">
          {hours.map((h) => (
            <div
              key={h.weekday}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-[#231f1c]/50 gap-3"
            >
              <div className="w-28 flex items-center gap-2">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  {WEEKDAYS[h.weekday]}
                </span>
              </div>

              <div className="flex items-center gap-4 flex-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!h.closed}
                    onChange={(e) => handleHourChange(h.weekday, "closed", !e.target.checked)}
                    className="rounded text-[#9a0002] focus:ring-[#9a0002]"
                  />
                  <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
                    {h.closed ? "Cerrado" : "Abierto"}
                  </span>
                </label>

                {!h.closed && (
                  <div className="flex items-center gap-2 ml-auto sm:ml-4">
                    <input
                      type="time"
                      value={h.open_time}
                      onChange={(e) => handleHourChange(h.weekday, "open_time", e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1c1917] text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                    />
                    <span className="text-xs text-stone-400">a</span>
                    <input
                      type="time"
                      value={h.close_time}
                      onChange={(e) => handleHourChange(h.weekday, "close_time", e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1c1917] text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
