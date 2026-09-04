"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  UserAvatar,
  AvatarType,
  COLOR_PALETTES,
  PLACEHOLDER_ICONS,
} from "@/lib/userProfile";
import { UserAvatarView } from "@/components/UserAvatarView";
import { cn } from "@/lib/utils";

interface AvatarPickerModalProps {
  isOpen: boolean;
  currentAvatar: UserAvatar;
  onClose: () => void;
  onSave: (avatar: UserAvatar) => void;
}

type MainCategory = "fondos" | "clasicos";

export function AvatarPickerModal({
  isOpen,
  currentAvatar,
  onClose,
  onSave,
}: AvatarPickerModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<UserAvatar>(currentAvatar);
  const [activeTab, setActiveTab] = useState<MainCategory>("clasicos");
  const [classicSubTab, setClassicSubTab] = useState<"comida" | "estilo" | "emojis" | "initials">("comida");
  const [customInitials, setCustomInitials] = useState(
    currentAvatar.type === "initials" ? currentAvatar.value : "?",
  );

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setSelectedAvatar(currentAvatar);
      if (currentAvatar.type === "initials") {
        setActiveTab("clasicos");
        setClassicSubTab("initials");
        setCustomInitials(currentAvatar.value);
      } else if (currentAvatar.type === "emoji") {
        setActiveTab("clasicos");
        setClassicSubTab("emojis");
      } else {
        setActiveTab("clasicos");
        setClassicSubTab("comida");
      }
    });
  }, [isOpen, currentAvatar]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectColor = (gradientId: string) => {
    setSelectedAvatar((prev) => ({ ...prev, gradientId }));
  };

  const handleSelectClassicIcon = (type: AvatarType, value: string) => {
    setSelectedAvatar((prev) => ({ ...prev, type, value }));
  };

  const handleInitialsChange = (val: string) => {
    const clean = val.toUpperCase().slice(0, 3);
    setCustomInitials(clean);
    setSelectedAvatar((prev) => ({
      ...prev,
      type: "initials",
      value: clean || "?",
    }));
  };

  const handleSave = () => {
    onSave(selectedAvatar);
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: "spring", damping: 26, stiffness: 360 }}
          className="relative z-10 my-auto flex w-full max-w-[500px] flex-col overflow-hidden rounded-[28px] border border-[#e8e0d6] bg-[#faf6f1] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] dark:border-[#3d3732] dark:bg-[#1c1917]"
        >
          <div className="flex items-center justify-between border-b border-[#ede4d9] px-5 pb-3 pt-5 dark:border-[#2a2623] sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center rounded-lg bg-[#9a0002]/10 p-1 text-[#9a0002]">
                  <MaterialSymbol icon="palette" size={16} fill />
                </span>
                <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-lg">
                  Personalizar avatar
                </h3>
              </div>
              <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">
                Elegí icono, emoji o iniciales y el color de fondo
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#ede4d9] hover:text-gray-700 dark:hover:bg-[#2a2623] dark:hover:text-gray-200"
            >
              <MaterialSymbol icon="close" size={18} />
            </button>
          </div>

          <div className="custom-scrollbar max-h-[calc(85vh-130px)] space-y-5 overflow-y-auto p-5 sm:p-6">
            <div className="relative flex flex-col items-center justify-center overflow-visible rounded-2xl border border-[#ede4d9] bg-gradient-to-b from-[#f2ecdf] to-[#ebdcd0] p-6 dark:border-[#2e2924] dark:from-[#24201c] dark:to-[#1a1715]">
              <UserAvatarView avatar={selectedAvatar} size="2xl" className="drop-shadow-xl" />
            </div>

            <div className="flex gap-1 rounded-2xl bg-[#ede4d9] p-1 dark:bg-[#282420]">
              <button
                type="button"
                onClick={() => setActiveTab("clasicos")}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[12px] font-bold transition-all",
                  activeTab === "clasicos"
                    ? "bg-white text-[#9a0002] shadow-sm dark:bg-[#1c1917]"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200",
                )}
              >
                <MaterialSymbol icon="category" size={15} />
                Iconos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("fondos")}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[12px] font-bold transition-all",
                  activeTab === "fondos"
                    ? "bg-white text-[#9a0002] shadow-sm dark:bg-[#1c1917]"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200",
                )}
              >
                <MaterialSymbol icon="palette" size={15} />
                Fondo
              </button>
            </div>

            {activeTab === "fondos" && (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {COLOR_PALETTES.map((color) => {
                  const isSelected = selectedAvatar.gradientId === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => handleSelectColor(color.id)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all active:scale-95",
                        isSelected
                          ? "border-[#9a0002] bg-white ring-2 ring-[#9a0002]/30 dark:bg-[#231f1c]"
                          : "border-[#ede4d9] bg-white/70 hover:border-gray-400 dark:border-[#302c28] dark:bg-[#231f1c]/70",
                      )}
                    >
                      <span
                        className="h-6 w-6 shrink-0 rounded-full shadow-xs"
                        style={{ backgroundColor: color.color }}
                      />
                      <span className="truncate text-[11px] font-bold text-gray-800 dark:text-gray-200">
                        {color.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === "clasicos" && (
              <div className="space-y-3">
                <div className="flex gap-1 rounded-xl bg-[#ede4d9] p-1 dark:bg-[#282420]">
                  {(
                    [
                      ["comida", "restaurant", "Comida"],
                      ["estilo", "auto_awesome", "Estilo"],
                      ["emojis", null, "Emojis"],
                      ["initials", "badge", "Iniciales"],
                    ] as const
                  ).map(([tab, icon, label]) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setClassicSubTab(tab);
                        if (tab === "initials") handleInitialsChange(customInitials || "SA");
                      }}
                      className={cn(
                        "flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold transition-all",
                        classicSubTab === tab
                          ? "bg-white text-[#9a0002] shadow-xs dark:bg-[#1c1917]"
                          : "text-gray-600 dark:text-gray-400",
                      )}
                    >
                      {icon ? <MaterialSymbol icon={icon} size={14} /> : <span>🍣</span>}
                      {label}
                    </button>
                  ))}
                </div>

                {classicSubTab === "initials" ? (
                  <div className="space-y-3 rounded-xl border border-[#ede4d9] bg-white p-4 dark:border-[#2e2924] dark:bg-[#231f1c]">
                    <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300">
                      Tus iniciales (máx. 3)
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={customInitials}
                      onChange={(e) => handleInitialsChange(e.target.value)}
                      placeholder="AB"
                      className="w-full rounded-xl border border-[#ddd4c8] bg-[#faf6f1] px-3.5 py-2.5 text-center text-lg font-bold uppercase tracking-wider text-gray-900 focus:border-[#9a0002] focus:outline-none dark:border-[#3d3732] dark:bg-[#1c1917] dark:text-gray-100"
                    />
                  </div>
                ) : (
                  <div className="custom-scrollbar grid max-h-[170px] grid-cols-4 gap-2 overflow-y-auto p-1 sm:grid-cols-6">
                    {PLACEHOLDER_ICONS.filter((item) => item.category === classicSubTab).map((item) => {
                      const isSelected =
                        selectedAvatar.type === item.type && selectedAvatar.value === item.value;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectClassicIcon(item.type, item.value)}
                          className={cn(
                            "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl p-2 transition-all active:scale-95",
                            isSelected
                              ? "scale-105 border-2 border-[#9a0002] bg-[#9a0002]/10 text-[#9a0002] shadow-sm dark:bg-[#9a0002]/20"
                              : "border border-[#ede4d9] bg-white text-gray-700 hover:border-gray-400 dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-300",
                          )}
                        >
                          {item.type === "symbol" ? (
                            <MaterialSymbol icon={item.value} size={24} fill={isSelected} />
                          ) : (
                            <span className="select-none text-2xl leading-none">{item.value}</span>
                          )}
                          <span className="mt-1 max-w-full truncate text-[10px] font-medium text-gray-500 dark:text-gray-400">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2.5 border-t border-[#ede4d9] bg-[#f5efe5]/80 px-5 py-4 dark:border-[#2a2623] dark:bg-[#161412]/80 sm:px-6">
            <button
              type="button"
              onClick={() => {
                setSelectedAvatar({
                  type: "initials",
                  value: "?",
                  gradientId: "cherry",
                });
                setCustomInitials("?");
                setActiveTab("clasicos");
                setClassicSubTab("initials");
              }}
              className="flex cursor-pointer items-center gap-1 text-[12px] font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <MaterialSymbol icon="restart_alt" size={14} />
              Restablecer
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition-all hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#9a0002] px-5 py-2.5 text-[13px] font-bold text-white shadow-md shadow-[#9a0002]/20 transition-all hover:bg-[#6b0001] active:scale-95"
              >
                <MaterialSymbol icon="check" size={16} />
                Guardar avatar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
