"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { searchBolivarStreets } from "@/lib/addresses/bolivarStreets";

type Props = {
  value: string;
  onChange: (street: string) => void;
  onSelectStreet?: (street: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
};

export function StreetAutocomplete({
  value,
  onChange,
  onSelectStreet,
  placeholder = "Ej. Av. San Martín",
  disabled,
  required,
}: Props) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = searchBolivarStreets(value, 6);
  const hasExactMatch = suggestions.some(
    (s) => s.toLowerCase().trim() === value.toLowerCase().trim()
  );
  const showCustomOption = value.trim().length >= 3 && !hasExactMatch;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(street: string) {
    onChange(street);
    onSelectStreet?.(street);
    setOpen(false);
    setFocusedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown") {
        setOpen(true);
      }
      return;
    }

    const totalOptions = suggestions.length + (showCustomOption ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1 < totalOptions ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalOptions - 1));
    } else if (e.key === "Enter") {
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[focusedIndex]);
      } else if (focusedIndex === suggestions.length && showCustomOption) {
        e.preventDefault();
        handleSelect(value.trim());
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          className="w-full rounded-xl border border-[#e8e0d6] bg-white px-3.5 py-2.5 pr-9 text-[13px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#9a0002]/60 focus:ring-2 focus:ring-[#9a0002]/10 dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-white dark:placeholder:text-stone-500"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 flex h-6 w-6 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800"
          >
            <MaterialSymbol icon="close" size={14} />
          </button>
        ) : (
          <span className="pointer-events-none absolute right-3 text-stone-400">
            <MaterialSymbol icon="search" size={16} />
          </span>
        )}
      </div>

      {open && (suggestions.length > 0 || showCustomOption) && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-56 overflow-y-auto rounded-xl border border-[#e8e0d6] bg-white p-1.5 shadow-xl custom-scrollbar dark:border-[#3d3732] dark:bg-[#231f1c]">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Calles de Bolívar
          </div>
          {suggestions.map((street, idx) => {
            const isFocused = idx === focusedIndex;
            return (
              <button
                key={street}
                type="button"
                onMouseEnter={() => setFocusedIndex(idx)}
                onClick={() => handleSelect(street)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition",
                  isFocused
                    ? "bg-[#9a0002]/10 text-[#9a0002] dark:bg-[#9a0002]/20 dark:text-red-300"
                    : "text-stone-800 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-[#2a2623]"
                )}
              >
                <MaterialSymbol
                  icon="location_on"
                  size={15}
                  className="shrink-0 text-[#9a0002]"
                />
                <span className="flex-1 truncate">{street}</span>
              </button>
            );
          })}

          {showCustomOption && (
            <button
              type="button"
              onMouseEnter={() => setFocusedIndex(suggestions.length)}
              onClick={() => handleSelect(value.trim())}
              className={cn(
                "mt-1 flex w-full cursor-pointer items-center gap-2 border-t border-[#e8e0d6] pt-1.5 px-2.5 py-2 text-left text-[12px] font-semibold text-stone-600 dark:border-[#3d3732] dark:text-stone-300 transition",
                focusedIndex === suggestions.length && "bg-stone-100 dark:bg-[#2a2623]"
              )}
            >
              <MaterialSymbol icon="edit" size={14} className="shrink-0 text-stone-400" />
              <span>
                Usar: <span className="text-[#9a0002]">&quot;{value.trim()}&quot;</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
