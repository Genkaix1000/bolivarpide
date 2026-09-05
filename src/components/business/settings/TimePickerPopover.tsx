"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock, CaretDown, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface TimePickerPopoverProps {
  name: string;
  value: string;
  onChange: (time: string) => void;
  label: string;
  disabled?: boolean;
  stepMinutes?: 15 | 30;
}

function generateTimeSlots(stepMinutes: number = 30): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const TIME_SLOTS_30 = generateTimeSlots(30);

export function TimePickerPopover({
  name,
  value,
  onChange,
  label,
  disabled = false,
  stepMinutes = 30,
}: TimePickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  const slots = stepMinutes === 30 ? TIME_SLOTS_30 : generateTimeSlots(stepMinutes);
  const formattedVal = value ? (value.length >= 5 ? value.slice(0, 5) : value) : "09:00";

  // Auto-scroll to selected time when opening
  useEffect(() => {
    if (open && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (time: string) => {
    onChange(time);
    setOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(customValue)) {
      onChange(customValue);
      setCustomValue("");
      setOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Hidden input for server action form submission */}
      <input type="hidden" name={name} value={formattedVal} disabled={disabled} />

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all duration-150",
          "border-[#e8e0d6]/90 bg-white hover:border-[#9a0002]/40 hover:bg-stone-50/80",
          "dark:border-[#332e2a] dark:bg-[#161412] dark:hover:border-[#9a0002]/40 dark:hover:bg-[#201c18]",
          open && "border-[#9a0002] ring-2 ring-[#9a0002]/20 dark:border-[#9a0002]",
          disabled && "cursor-not-allowed opacity-40 hover:border-[#e8e0d6] hover:bg-white dark:hover:border-[#332e2a] dark:hover:bg-[#161412]",
        )}
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 transition-colors dark:bg-[#231f1c] dark:text-stone-400",
            !disabled && "group-hover:bg-[#9a0002]/10 group-hover:text-[#9a0002]",
            open && "bg-[#9a0002]/10 text-[#9a0002]",
          )}
        >
          <Clock weight={open ? "fill" : "regular"} size={16} />
        </span>

        <div className="min-w-[62px]">
          <span className="block text-[9px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
            {label}
          </span>
          <span className="text-[14px] font-black tracking-tight text-stone-900 dark:text-stone-100">
            {formattedVal} <span className="text-[10px] font-normal text-stone-400">hs</span>
          </span>
        </div>

        <CaretDown
          weight="bold"
          size={12}
          className={cn(
            "shrink-0 text-stone-400 transition-transform duration-200 dark:text-stone-500",
            open && "rotate-180 text-[#9a0002]",
          )}
        />
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-2xl border",
            "border-[#e8e0d6] bg-white/98 shadow-xl backdrop-blur-xl",
            "dark:border-[#3d3732] dark:bg-[#1c1917]/98 dark:shadow-2xl",
            "animate-in fade-in zoom-in-95 duration-150",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e8e0d6]/80 px-3.5 py-2.5 dark:border-[#332e2a]">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500">
              {label}
            </span>
            <span className="text-[10px] font-medium text-stone-400">
              Formato 24 hs
            </span>
          </div>

          {/* Time Slots List */}
          <div className="max-h-56 overflow-y-auto p-1.5 custom-scrollbar">
            {slots.map((time) => {
              const isSelected = time === formattedVal;
              return (
                <button
                  key={time}
                  ref={isSelected ? activeItemRef : undefined}
                  type="button"
                  onClick={() => handleSelect(time)}
                  className={cn(
                    "group relative flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-100",
                    !isSelected &&
                      "text-stone-700 hover:bg-stone-100/80 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/[0.05] dark:hover:text-stone-50",
                    isSelected &&
                      "bg-[#9a0002]/10 font-bold text-[#9a0002] dark:bg-[#9a0002]/20 dark:text-red-400",
                  )}
                >
                  {/* Left Rail on Active (matching BusinessSidebar) */}
                  {isSelected && (
                    <>
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.15),transparent_70%)] dark:bg-[radial-gradient(120%_140%_at_0%_50%,rgba(154,0,2,0.3),transparent_70%)]"
                      />
                      <span
                        aria-hidden
                        className="absolute inset-y-1.5 left-1 w-[3px] rounded-full bg-[#9a0002]"
                      />
                    </>
                  )}

                  <span className={cn("relative z-[1]", isSelected && "pl-2")}>
                    {time} hs
                  </span>

                  {isSelected && (
                    <Check weight="bold" size={14} className="relative z-[1] text-[#9a0002] dark:text-red-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom minute entry footer */}
          <form
            onSubmit={handleCustomSubmit}
            className="flex items-center gap-1.5 border-t border-[#e8e0d6]/80 p-2 dark:border-[#332e2a]"
          >
            <input
              type="text"
              placeholder="Ej: 20:15"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              maxLength={5}
              className="w-full rounded-lg border border-[#e8e0d6] bg-stone-50 px-2 py-1 text-[11px] font-medium text-stone-800 outline-none focus:border-[#9a0002] dark:border-[#332e2a] dark:bg-[#231f1c] dark:text-stone-200"
            />
            <button
              type="submit"
              disabled={!/^([01]\d|2[0-3]):([0-5]\d)$/.test(customValue)}
              className="cursor-pointer shrink-0 rounded-lg bg-[#9a0002] px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-[#850002] disabled:opacity-40"
            >
              Fijar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
