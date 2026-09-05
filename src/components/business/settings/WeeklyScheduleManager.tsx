"use client";

import React, { useEffect, useRef, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { FieldHint } from "@/components/ui/FieldHint";
import { TimePickerPopover } from "./TimePickerPopover";
import type { BusinessHourRow } from "@/lib/business/hours";
import { cn } from "@/lib/utils";

interface DaySchedule {
  weekday: number;
  name: string;
  short: string;
  closed: boolean;
  open_time: string;
  close_time: string;
}

const WEEKDAYS_CONFIG = [
  { weekday: 1, name: "Lunes", short: "LUN" },
  { weekday: 2, name: "Martes", short: "MAR" },
  { weekday: 3, name: "Miércoles", short: "MIÉ" },
  { weekday: 4, name: "Jueves", short: "JUE" },
  { weekday: 5, name: "Viernes", short: "VIE" },
  { weekday: 6, name: "Sábado", short: "SÁB" },
  { weekday: 0, name: "Domingo", short: "DOM" },
];

const PRESETS = [
  {
    name: "Turno noche",
    open: "20:00",
    close: "00:30",
    closedDays: [1],
    detail: "Mar a Dom · Lunes descanso",
    icon: "nightlight" as const,
  },
  {
    name: "Horario comercial",
    open: "09:00",
    close: "21:00",
    closedDays: [0],
    detail: "Lun a Sáb · Domingo descanso",
    icon: "storefront" as const,
  },
  {
    name: "Bar / cervecería",
    open: "20:00",
    close: "02:00",
    closedDays: [1, 2],
    detail: "Mié a Dom · Lun/Mar descanso",
    icon: "local_bar" as const,
  },
];

function timeValue(t: string | null, fallback = "20:00"): string {
  if (!t) return fallback;
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export function WeeklyScheduleManager({
  initialHours,
}: {
  initialHours: BusinessHourRow[];
}) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => {
    return WEEKDAYS_CONFIG.map((day) => {
      const row = initialHours.find((h) => h.weekday === day.weekday);
      return {
        weekday: day.weekday,
        name: day.name,
        short: day.short,
        closed: row ? row.closed : day.weekday === 0,
        open_time: timeValue(row?.open_time ?? null, "20:00"),
        close_time: timeValue(row?.close_time ?? null, "00:30"),
      };
    });
  });

  const [activeCopyMenu, setActiveCopyMenu] = useState<number | null>(null);
  const [activePresetMenu, setActivePresetMenu] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const presetMenuRef = useRef<HTMLDivElement>(null);
  const copyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeCopyMenu === null && !activePresetMenu) return;
    function onPointer(e: MouseEvent) {
      const t = e.target as Node;
      if (activePresetMenu && presetMenuRef.current?.contains(t)) return;
      if (activeCopyMenu !== null && copyMenuRef.current?.contains(t)) return;
      setActiveCopyMenu(null);
      setActivePresetMenu(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveCopyMenu(null);
        setActivePresetMenu(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [activeCopyMenu, activePresetMenu]);

  const showNotice = (msg: string) => {
    setCopyNotice(msg);
    setTimeout(() => setCopyNotice(null), 3000);
  };

  const toggleClosed = (weekday: number) => {
    setSchedule((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, closed: !d.closed } : d)),
    );
  };

  const updateTime = (weekday: number, field: "open_time" | "close_time", time: string) => {
    setSchedule((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, [field]: time } : d)),
    );
  };

  const copySchedule = (
    fromWeekday: number,
    target: "all_open" | "weekdays" | "weekend",
  ) => {
    const source = schedule.find((d) => d.weekday === fromWeekday);
    if (!source) return;

    setSchedule((prev) =>
      prev.map((d) => {
        if (target === "all_open") {
          return d.closed ? d : { ...d, open_time: source.open_time, close_time: source.close_time };
        }
        if (target === "weekdays") {
          const isWeekDay = d.weekday >= 1 && d.weekday <= 5;
          return isWeekDay
            ? { ...d, open_time: source.open_time, close_time: source.close_time, closed: false }
            : d;
        }
        if (target === "weekend") {
          const isWeekend = d.weekday === 6 || d.weekday === 0;
          return isWeekend
            ? { ...d, open_time: source.open_time, close_time: source.close_time, closed: false }
            : d;
        }
        return d;
      }),
    );

    setActiveCopyMenu(null);
    if (target === "all_open") showNotice("Horario aplicado a todos los días abiertos");
    if (target === "weekdays") showNotice("Horario aplicado a Lunes–Viernes");
    if (target === "weekend") showNotice("Horario aplicado a Sábado y Domingo");
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setSchedule((prev) =>
      prev.map((d) => ({
        ...d,
        closed: preset.closedDays.includes(d.weekday),
        open_time: preset.open,
        close_time: preset.close,
      })),
    );
    setActivePresetMenu(false);
    showNotice(`Plantilla “${preset.name}” aplicada`);
  };

  const openDaysCount = schedule.filter((d) => !d.closed).length;

  return (
    <div className="space-y-4">
      {/* Summary — estilo referencia: “N días por semana” + plantillas */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black tracking-tight text-stone-900 dark:text-stone-100">
            {openDaysCount === 0
              ? "Sin días de atención"
              : openDaysCount === 1
                ? "1 día por semana"
                : `${openDaysCount} días por semana`}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            {openDaysCount === 7
              ? "Atención todos los días"
              : openDaysCount === 0
                ? "Marcá al menos un día para recibir pedidos"
                : `${7 - openDaysCount} día${7 - openDaysCount === 1 ? "" : "s"} de descanso`}
          </p>
        </div>

        <div className="relative flex items-center gap-2 self-end sm:self-center" ref={presetMenuRef}>
          <FieldHint text="Plantillas: cargan apertura, cierre y días de descanso de una vez. Después podés ajustar día por día o aplicar un horario similar a varios días con el ícono de copiar." />
          <button
            type="button"
            onClick={() => {
              setActiveCopyMenu(null);
              setActivePresetMenu((p) => !p);
            }}
            className="group flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#e8e0d6] bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:border-[#9a0002]/40 hover:bg-stone-50 dark:border-[#332e2a] dark:bg-[#201c18] dark:text-stone-200"
          >
            <MaterialSymbol icon="bolt" size={16} className="text-[#9a0002] dark:text-red-400" />
            <span>Plantillas</span>
            <MaterialSymbol
              icon="expand_more"
              size={16}
              className={cn("text-stone-400 transition-transform", activePresetMenu && "rotate-180")}
            />
          </button>

          {activePresetMenu && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-2xl border border-[#e8e0d6] bg-white/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-[#3d3732] dark:bg-[#1c1917]/95">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                Elegir rutina
              </div>
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="flex w-full cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-stone-100 dark:hover:bg-white/[0.05]"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#9a0002]/10 text-[#9a0002] dark:bg-[#9a0002]/20 dark:text-red-400">
                    <MaterialSymbol icon={preset.icon} size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-stone-900 dark:text-stone-100">
                      {preset.name}
                    </span>
                    <span className="block text-[10px] text-stone-500">
                      {preset.open}–{preset.close} · {preset.detail}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {copyNotice && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <MaterialSymbol icon="check_circle" size={16} />
          <span>{copyNotice}</span>
        </div>
      )}

      <div className="space-y-2.5">
        {schedule.map((day) => {
          const isOpen = !day.closed;
          const isCopyOpen = activeCopyMenu === day.weekday;

          return (
            <div
              key={day.weekday}
              className={cn(
                "group relative flex flex-col justify-between gap-3 rounded-2xl border p-3.5 transition-all duration-200 sm:flex-row sm:items-center sm:p-4",
                isOpen
                  ? "border-[#e8e0d6] bg-white shadow-2xs dark:border-[#332e2a] dark:bg-[#1c1917]"
                  : "border-dashed border-stone-200/90 bg-stone-50/60 opacity-60 dark:border-[#2b2622] dark:bg-[#141210]/50",
              )}
            >
              {isOpen && (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.06),transparent_65%)] dark:bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.18),transparent_70%)]"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-y-2 left-0 w-[3.5px] rounded-r-full bg-[#9a0002]"
                  />
                </>
              )}

              <div className="relative z-1 flex items-center justify-between gap-3 sm:justify-start">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-11 items-center justify-center rounded-lg text-[11px] font-black tracking-wider",
                      isOpen
                        ? "bg-[#9a0002]/10 text-[#9a0002] dark:bg-[#9a0002]/20 dark:text-red-400"
                        : "bg-stone-200 text-stone-500 dark:bg-[#24201d] dark:text-stone-400",
                    )}
                  >
                    {day.short}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {day.name}
                    </h4>
                    <p className="text-[10px] text-stone-400">
                      {isOpen ? `${day.open_time} – ${day.close_time}` : "Descanso"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleClosed(day.weekday)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all",
                    isOpen
                      ? "border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200 dark:border-[#332e2a] dark:bg-[#201c18] dark:text-stone-400",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isOpen ? "bg-emerald-500 animate-pulse" : "bg-stone-400",
                    )}
                  />
                  {isOpen ? "Abierto" : "Cerrado"}
                </button>
              </div>

              <input
                type="checkbox"
                name={`closed_${day.weekday}`}
                value="on"
                checked={day.closed}
                onChange={() => {}}
                className="sr-only"
              />

              <div className="relative z-1 flex flex-wrap items-center gap-2 self-stretch sm:self-center">
                <TimePickerPopover
                  name={`open_${day.weekday}`}
                  value={day.open_time}
                  onChange={(time) => updateTime(day.weekday, "open_time", time)}
                  label="Apertura"
                  disabled={day.closed}
                />

                <span className="text-xs font-bold text-stone-300 dark:text-stone-600">—</span>

                <TimePickerPopover
                  name={`close_${day.weekday}`}
                  value={day.close_time}
                  onChange={(time) => updateTime(day.weekday, "close_time", time)}
                  label="Cierre"
                  disabled={day.closed}
                />

                {isOpen && (
                  <div className="relative ml-auto sm:ml-0" ref={isCopyOpen ? copyMenuRef : undefined}>
                    <button
                      type="button"
                      title="Aplicar horario similar"
                      onClick={() => {
                        setActivePresetMenu(false);
                        setActiveCopyMenu(isCopyOpen ? null : day.weekday);
                      }}
                      className={cn(
                        "flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#e8e0d6] bg-white text-stone-500 transition hover:border-[#9a0002]/40 hover:bg-stone-50 hover:text-[#9a0002] dark:border-[#332e2a] dark:bg-[#161412] dark:text-stone-400 dark:hover:bg-[#201c18] dark:hover:text-red-400",
                        isCopyOpen && "border-[#9a0002] text-[#9a0002]",
                      )}
                    >
                      <MaterialSymbol icon="content_copy" size={16} />
                    </button>

                    {isCopyOpen && (
                      <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-2xl border border-[#e8e0d6] bg-white/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-[#3d3732] dark:bg-[#1c1917]/95">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          Aplicar horario similar
                        </div>
                        <button
                          type="button"
                          onClick={() => copySchedule(day.weekday, "all_open")}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/[0.05]"
                        >
                          <MaterialSymbol icon="done_all" size={15} className="text-[#9a0002]" />
                          <span>A todos los días abiertos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => copySchedule(day.weekday, "weekdays")}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/[0.05]"
                        >
                          <MaterialSymbol icon="date_range" size={15} className="text-[#9a0002]" />
                          <span>A Lunes–Viernes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => copySchedule(day.weekday, "weekend")}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/[0.05]"
                        >
                          <MaterialSymbol icon="weekend" size={15} className="text-[#9a0002]" />
                          <span>A Sábado y Domingo</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
