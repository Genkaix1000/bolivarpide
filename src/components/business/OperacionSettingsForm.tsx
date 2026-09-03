"use client";

import { useState, useTransition } from "react";
import {
  updateBusinessHoursAction,
  updateBusinessOperationAction,
} from "@/lib/business/settingsActions";
import type { BusinessHourRow } from "@/lib/business/hours";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const sectionCls =
  "rounded-[20px] border border-gray-100 bg-white p-6 dark:border-[#3d3732] dark:bg-[#1c1917] penpot-shadow sm:p-7";
const inputCls =
  "rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-400 dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-100";

function timeValue(t: string | null) {
  if (!t) return "09:00";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export function OperacionSettingsForm({
  businessId,
  isOpen,
  prepTime,
  hours,
}: {
  businessId: string;
  isOpen: boolean;
  prepTime: number;
  hours: BusinessHourRow[];
}) {
  const [opPending, startOp] = useTransition();
  const [hoursPending, startHours] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const byDay = Array.from({ length: 7 }, (_, weekday) => {
    const row = hours.find((h) => h.weekday === weekday);
    return {
      weekday,
      closed: row?.closed ?? weekday === 0,
      open_time: timeValue(row?.open_time ?? null),
      close_time: timeValue(row?.close_time ?? null),
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">Operación</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Estado del local, demora estimada y horarios de atención.
        </p>
      </div>

      <form
        className={sectionCls}
        action={(fd) => {
          setMsg(null);
          startOp(async () => {
            try {
              await updateBusinessOperationAction(fd);
              setMsg({ ok: true, text: "Operación guardada" });
            } catch (e) {
              setMsg({ ok: false, text: e instanceof Error ? e.message : "Error" });
            }
          });
        }}
      >
        <input type="hidden" name="businessId" value={businessId} />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Local abierto</h3>
            <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-gray-500">
              Apagá el local para dejar de recibir pedidos, sin importar el horario.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              name="isOpen"
              value="true"
              defaultChecked={isOpen}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-[#9a0002] peer-checked:after:translate-x-5 dark:bg-[#3d3732]" />
          </label>
        </div>

        <div className="my-6 border-t border-gray-100 dark:border-[#3d3732]" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400" htmlFor="prepTime">
              Tiempo estimado de preparación (min)
            </label>
            <input
              id="prepTime"
              name="prepTime"
              type="number"
              min={5}
              max={180}
              step={5}
              required
              defaultValue={prepTime}
              className={cn(inputCls, "w-28")}
            />
          </div>
          <button
            type="submit"
            disabled={opPending}
            className="cursor-pointer rounded-full bg-[#9a0002] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#850002] disabled:opacity-60"
          >
            {opPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>

      <form
        className={sectionCls}
        action={(fd) => {
          setMsg(null);
          startHours(async () => {
            try {
              await updateBusinessHoursAction(fd);
              setMsg({ ok: true, text: "Horarios guardados" });
            } catch (e) {
              setMsg({ ok: false, text: e instanceof Error ? e.message : "Error" });
            }
          });
        }}
      >
        <input type="hidden" name="businessId" value={businessId} />
        <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">Horarios</h3>
        <p className="mb-5 text-[11px] text-gray-500">
          {/* ponytail: un open/close por weekday; turnos cortados → migración multi-slot */}
          Un turno por día.
        </p>

        <ul className="divide-y divide-gray-100 dark:divide-[#3d3732]">
          {byDay.map((day) => (
            <li key={day.weekday} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="w-24 text-sm font-medium text-gray-800 dark:text-gray-200">
                {DAY_NAMES[day.weekday]}
              </span>
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input
                  type="checkbox"
                  name={`closed_${day.weekday}`}
                  defaultChecked={day.closed}
                  className="rounded border-gray-300"
                  onChange={(e) => {
                    const row = e.currentTarget.closest("li");
                    row?.querySelectorAll<HTMLInputElement>("input[type=time]").forEach((el) => {
                      el.disabled = e.currentTarget.checked;
                    });
                  }}
                />
                Cerrado
              </label>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="time"
                  name={`open_${day.weekday}`}
                  defaultValue={day.open_time}
                  disabled={day.closed}
                  className={inputCls}
                />
                <span className="text-xs text-gray-400">a</span>
                <input
                  type="time"
                  name={`close_${day.weekday}`}
                  defaultValue={day.close_time}
                  disabled={day.closed}
                  className={inputCls}
                />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-end gap-3">
          {msg ? (
            <p className={cn("text-xs font-medium", msg.ok ? "text-emerald-600" : "text-red-600")}>
              {msg.text}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={hoursPending}
            className="cursor-pointer rounded-full bg-[#9a0002] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#850002] disabled:opacity-60"
          >
            {hoursPending ? "Guardando…" : "Guardar horarios"}
          </button>
        </div>
      </form>
    </div>
  );
}
