"use client";

import { useState, useTransition } from "react";
import {
  updateBusinessHoursAction,
  updateBusinessOperationAction,
} from "@/lib/business/settingsActions";
import type { BusinessHourRow } from "@/lib/business/hours";
import { WeeklyScheduleManager } from "./settings/WeeklyScheduleManager";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { FieldHint } from "@/components/ui/FieldHint";
import { cn } from "@/lib/utils";

export function OperacionSettingsForm({
  businessId,
  isOpen: initialIsOpen,
  prepTime: initialPrepTime,
  hours,
}: {
  businessId: string;
  isOpen: boolean;
  prepTime: number;
  hours: BusinessHourRow[];
}) {
  const [opPending, startOp] = useTransition();
  const [hoursPending, startHours] = useTransition();
  const [isOpenState, setIsOpenState] = useState(initialIsOpen);
  const [prepTimeState, setPrepTimeState] = useState(initialPrepTime);
  const [opMsg, setOpMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [hoursMsg, setHoursMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const cardCls =
    "rounded-[24px] border border-[#e8e0d6]/90 bg-white p-6 shadow-xs dark:border-[#332e2a] dark:bg-[#1c1917] sm:p-7";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500">
          Configuración operativa
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-stone-900 dark:text-white">
          Operación y Horarios
        </h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Pausá pedidos al momento, definí demora de cocina y tu rutina semanal.
        </p>
      </div>

      <form
        className={cardCls}
        action={(fd) => {
          setOpMsg(null);
          startOp(async () => {
            try {
              await updateBusinessOperationAction(fd);
              setOpMsg({ ok: true, text: "Estado y tiempo guardados correctamente" });
            } catch (e) {
              setOpMsg({ ok: false, text: e instanceof Error ? e.message : "Error al guardar" });
            }
          });
        }}
      >
        <input type="hidden" name="businessId" value={businessId} />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors",
                isOpenState
                  ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-stone-100 text-stone-400 dark:bg-[#231f1c] dark:text-stone-500",
              )}
            >
              <MaterialSymbol icon="storefront" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">
                  Recepción de pedidos
                </h3>
                <FieldHint
                  text="Interruptor manual: pausá nuevos pedidos por lluvia, falta de stock o sobrecarga, sin tocar el horario semanal. Si el calendario dice abierto pero esto está apagado, el local no recibe pedidos."
                />
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    isOpenState
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-stone-100 text-stone-500 dark:bg-[#24201d] dark:text-stone-400",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isOpenState ? "bg-emerald-500 animate-pulse" : "bg-stone-400",
                    )}
                  />
                  {isOpenState ? "Aceptando pedidos" : "Recepción pausada"}
                </span>
              </div>
              <p className="mt-0.5 max-w-md text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                Independiente del horario semanal. Apagálo para pausar pedidos al momento.
              </p>
            </div>
          </div>

          <label className="relative inline-flex cursor-pointer items-center self-start sm:self-center">
            <input
              type="checkbox"
              name="isOpen"
              value="true"
              checked={isOpenState}
              onChange={(e) => setIsOpenState(e.target.checked)}
              className="peer sr-only"
            />
            <span className="h-7 w-12 rounded-full bg-stone-200 transition-colors after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-[#9a0002] peer-checked:after:translate-x-5 dark:bg-[#332e2a]" />
          </label>
        </div>

        <div className="my-6 border-t border-[#e8e0d6]/80 dark:border-[#332e2a]" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label
                className="block text-xs font-bold text-stone-700 dark:text-stone-300"
                htmlFor="prepTime"
              >
                Demora estimada de cocina
              </label>
              <FieldHint text="Minutos que ve el cliente al pedir. Usalo para alinear expectativa con la cocina real: si prometés 20 y tardás 45, baja la satisfacción. Los chips son atajos; podés cargar cualquier valor entre 5 y 180." />
            </div>
            <p className="text-[11px] text-stone-400">
              Tiempo en minutos mostrado al cliente al pedir.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="relative">
                <input
                  id="prepTime"
                  name="prepTime"
                  type="number"
                  min={5}
                  max={180}
                  step={5}
                  required
                  value={prepTimeState}
                  onChange={(e) => setPrepTimeState(Number(e.target.value))}
                  className="w-28 rounded-xl border border-[#e8e0d6] bg-stone-50 px-3 py-2 text-sm font-bold text-stone-900 outline-none focus:border-[#9a0002] dark:border-[#332e2a] dark:bg-[#201c18] dark:text-stone-100"
                />
                <span className="pointer-events-none absolute right-3 top-2 text-xs font-medium text-stone-400">
                  min
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setPrepTimeState(mins)}
                    className={cn(
                      "cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
                      prepTimeState === mins
                        ? "border-[#9a0002] bg-[#9a0002]/10 text-[#9a0002] dark:text-red-400"
                        : "border-[#e8e0d6] bg-white text-stone-600 hover:bg-stone-50 dark:border-[#332e2a] dark:bg-[#1c1917] dark:text-stone-300 dark:hover:bg-[#24201d]",
                    )}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end">
            {opMsg && (
              <span
                className={cn(
                  "text-xs font-bold",
                  opMsg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600",
                )}
              >
                {opMsg.text}
              </span>
            )}
            <button
              type="submit"
              disabled={opPending}
              className="cursor-pointer rounded-xl bg-[#9a0002] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#850002] disabled:opacity-60"
            >
              {opPending ? "Guardando…" : "Guardar estado"}
            </button>
          </div>
        </div>
      </form>

      <form
        className={cardCls}
        action={(fd) => {
          setHoursMsg(null);
          startHours(async () => {
            try {
              await updateBusinessHoursAction(fd);
              setHoursMsg({ ok: true, text: "Horarios semanales guardados con éxito" });
            } catch (e) {
              setHoursMsg({
                ok: false,
                text: e instanceof Error ? e.message : "Error al guardar horarios",
              });
            }
          });
        }}
      >
        <input type="hidden" name="businessId" value={businessId} />

        <div className="mb-5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500">
              Rutina semanal
            </p>
            <FieldHint text="Horario habitual que se repite cada semana. Definí apertura/cierre por día o usá una plantilla y después ajustá. El botón de copiar aplica el mismo rango a varios días. Recordá guardar al final." />
          </div>
          <h3 className="text-lg font-black tracking-tight text-stone-900 dark:text-stone-100">
            Horarios de atención
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Semana habitual. Se repite todas las semanas.
          </p>
        </div>

        <WeeklyScheduleManager initialHours={hours} />

        <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-[#e8e0d6]/80 pt-5 dark:border-[#332e2a] sm:flex-row">
          {hoursMsg ? (
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs font-bold",
                hoursMsg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600",
              )}
            >
              <MaterialSymbol
                icon={hoursMsg.ok ? "check_circle" : "error"}
                size={16}
              />
              <span>{hoursMsg.text}</span>
            </p>
          ) : (
            <span className="text-[11px] text-stone-400">
              Recordá guardar para aplicar los cambios.
            </span>
          )}

          <button
            type="submit"
            disabled={hoursPending}
            className="w-full cursor-pointer rounded-xl bg-[#9a0002] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#850002] disabled:opacity-60 sm:w-auto"
          >
            {hoursPending ? "Guardando horarios…" : "Guardar horarios semanales"}
          </button>
        </div>
      </form>
    </div>
  );
}
