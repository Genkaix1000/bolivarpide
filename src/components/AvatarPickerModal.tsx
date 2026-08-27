"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  UserAvatar,
  AvatarType,
  COLOR_PALETTES,
  CHARACTER_PRESETS,
  AVATAR_FRAMES,
  PLACEHOLDER_ICONS,
  getRarityColor,
} from "@/lib/userProfile";
import { UserAvatarView } from "@/components/UserAvatarView";
import { CharacterRenderer } from "@/components/avatar/CharacterSVGs";
import { cn } from "@/lib/utils";

interface AvatarPickerModalProps {
  isOpen: boolean;
  currentAvatar: UserAvatar;
  onClose: () => void;
  onSave: (avatar: UserAvatar) => void;
}

type MainCategory = "personajes" | "marcos" | "fondos" | "clasicos";

export function AvatarPickerModal({
  isOpen,
  currentAvatar,
  onClose,
  onSave,
}: AvatarPickerModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<UserAvatar>(currentAvatar);
  const [activeTab, setActiveTab] = useState<MainCategory>("personajes");
  const [classicSubTab, setClassicSubTab] = useState<"comida" | "estilo" | "emojis" | "initials">("comida");
  const [customInitials, setCustomInitials] = useState(
    currentAvatar.type === "initials" ? currentAvatar.value : "SA"
  );

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(currentAvatar);
      if (currentAvatar.type === "character") {
        setActiveTab("personajes");
      } else if (currentAvatar.type === "initials") {
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
    }
  }, [isOpen, currentAvatar]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectCharacter = (characterId: string) => {
    setSelectedAvatar((prev) => ({
      ...prev,
      type: "character",
      value: characterId,
    }));
  };

  const handleSelectFrame = (frameId: string) => {
    setSelectedAvatar((prev) => ({
      ...prev,
      frameId,
    }));
  };

  const handleSelectColor = (gradientId: string) => {
    setSelectedAvatar((prev) => ({
      ...prev,
      gradientId,
    }));
  };

  const handleSelectClassicIcon = (type: AvatarType, value: string) => {
    setSelectedAvatar((prev) => ({
      ...prev,
      type,
      value,
    }));
  };

  const handleInitialsChange = (val: string) => {
    const clean = val.toUpperCase().slice(0, 3);
    setCustomInitials(clean);
    setSelectedAvatar((prev) => ({
      ...prev,
      type: "initials",
      value: clean || "SA",
    }));
  };

  const handleSave = () => {
    onSave(selectedAvatar);
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: "spring", damping: 26, stiffness: 360 }}
          className="relative w-full max-w-[500px] bg-[#faf6f1] dark:bg-[#1c1917] border border-[#e8e0d6] dark:border-[#3d3732] rounded-[28px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col z-10 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-[#ede4d9] dark:border-[#2a2623]">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#9a0002]/10 text-[#9a0002] flex items-center justify-center">
                  <MaterialSymbol icon="face" size={16} fill />
                </span>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  Taller de Personaje
                </h3>
              </div>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                Elige tu personaje foodie, marco y color de fondo
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] transition-colors cursor-pointer"
            >
              <MaterialSymbol icon="close" size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-130px)] custom-scrollbar">
            {/* Live Interactive Preview Stage with Pop-out effect */}
            <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-[#f2ecdf] to-[#ebdcd0] dark:from-[#24201c] dark:to-[#1a1715] border border-[#ede4d9] dark:border-[#2e2924] overflow-visible">
              <div className="relative my-2 overflow-visible">
                <UserAvatarView
                  avatar={selectedAvatar}
                  size="2xl"
                  showFrame
                  className="drop-shadow-xl"
                />
              </div>
            </div>

            {/* Main Navigation Tabs */}
            <div className="flex p-1 bg-[#ede4d9] dark:bg-[#282420] rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("personajes");
                  if (selectedAvatar.type !== "character") {
                    handleSelectCharacter("char-cat-michi");
                  }
                }}
                className={cn(
                  "flex-1 py-2 px-2 text-[12px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeTab === "personajes"
                    ? "bg-white dark:bg-[#1c1917] text-[#9a0002] shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <MaterialSymbol icon="face" size={15} fill={activeTab === "personajes"} />
                <span>Personajes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("marcos")}
                className={cn(
                  "flex-1 py-2 px-2 text-[12px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeTab === "marcos"
                    ? "bg-white dark:bg-[#1c1917] text-[#9a0002] shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <MaterialSymbol icon="military_tech" size={15} />
                <span>Marcos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("fondos")}
                className={cn(
                  "flex-1 py-2 px-2 text-[12px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeTab === "fondos"
                    ? "bg-white dark:bg-[#1c1917] text-[#9a0002] shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <MaterialSymbol icon="palette" size={15} />
                <span>Fondo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("clasicos")}
                className={cn(
                  "flex-1 py-2 px-2 text-[12px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeTab === "clasicos"
                    ? "bg-white dark:bg-[#1c1917] text-[#9a0002] shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <MaterialSymbol icon="category" size={15} />
                <span>Iconos</span>
              </button>
            </div>

            {/* TAB CONTENT: Personajes */}
            {activeTab === "personajes" && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Elige tu personaje
                  </label>
                  <span className="text-[11px] text-[#9a0002] font-semibold">2 personajes</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {CHARACTER_PRESETS.map((char) => {
                    const isSelected = selectedAvatar.type === "character" && selectedAvatar.value === char.id;
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => handleSelectCharacter(char.id)}
                        className={cn(
                          "p-3.5 rounded-2xl flex flex-col items-center text-center transition-all duration-200 cursor-pointer active:scale-95 group relative",
                          isSelected
                            ? "bg-white dark:bg-[#231f1c] border-2 border-[#9a0002] shadow-md ring-2 ring-[#9a0002]/20 scale-102"
                            : "bg-white/80 dark:bg-[#231f1c]/70 border border-[#ede4d9] dark:border-[#302c28] hover:border-gray-400"
                        )}
                      >
                        <div className="w-18 h-18 mb-2 overflow-visible flex items-center justify-center">
                          <CharacterRenderer characterId={char.id} gradientId={selectedAvatar.gradientId} className="w-full h-full" />
                        </div>
                        <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#9a0002]/10 text-[#9a0002] mb-1">
                          {char.foodTag}
                        </span>
                        <h5 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 leading-tight">
                          {char.name}
                        </h5>
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{char.description}</p>
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#9a0002] text-white flex items-center justify-center shadow-sm text-[10px]">
                            <MaterialSymbol icon="check" size={12} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Marcos */}
            {activeTab === "marcos" && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Marcos de distinción (van por detrás del personaje)
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVATAR_FRAMES.map((frame) => {
                    const isSelected = selectedAvatar.frameId === frame.id || (!selectedAvatar.frameId && frame.id === "none");
                    const rarityStyle = getRarityColor(frame.rarity);
                    return (
                      <button
                        key={frame.id}
                        type="button"
                        onClick={() => handleSelectFrame(frame.id)}
                        className={cn(
                          "p-3 rounded-2xl flex items-center gap-3 transition-all duration-200 cursor-pointer active:scale-95 text-left relative",
                          isSelected
                            ? "bg-white dark:bg-[#231f1c] border-2 border-[#9a0002] shadow-md ring-2 ring-[#9a0002]/20"
                            : "bg-white/80 dark:bg-[#231f1c]/70 border border-[#ede4d9] dark:border-[#302c28] hover:border-gray-400"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#f4ede4] dark:bg-[#2a2623] flex items-center justify-center flex-shrink-0">
                          <MaterialSymbol icon={frame.icon} size={20} className={rarityStyle.text} fill />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-bold text-[12px] text-gray-900 dark:text-gray-100 truncate">
                              {frame.name}
                            </h5>
                            {frame.id !== "none" && (
                              <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.2 rounded border", rarityStyle.bg, rarityStyle.text, rarityStyle.border)}>
                                {frame.rarity}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{frame.description}</p>
                        </div>
                        {isSelected && (
                          <MaterialSymbol icon="check_circle" size={16} fill className="text-[#9a0002] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Fondos */}
            {activeTab === "fondos" && (
              <div className="space-y-3 animate-fade-in">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                  Color del disco circular
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {COLOR_PALETTES.map((color) => {
                    const isSelected = selectedAvatar.gradientId === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => handleSelectColor(color.id)}
                        className={cn(
                          "p-2.5 rounded-2xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer active:scale-95 text-left border",
                          isSelected
                            ? "border-[#9a0002] ring-2 ring-[#9a0002]/30 bg-white dark:bg-[#231f1c] shadow-sm"
                            : "border-[#ede4d9] dark:border-[#302c28] bg-white/70 dark:bg-[#231f1c]/70 hover:border-gray-400"
                        )}
                      >
                        <span className="w-6 h-6 rounded-full shadow-xs flex-shrink-0" style={{ backgroundColor: color.color }} />
                        <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
                          {color.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Clasicos */}
            {activeTab === "clasicos" && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex p-1 bg-[#ede4d9] dark:bg-[#282420] rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setClassicSubTab("comida")}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1",
                      classicSubTab === "comida"
                        ? "bg-white dark:bg-[#1c1917] text-[#9a0002] shadow-xs"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    <MaterialSymbol icon="restaurant" size={14} />
                    <span>Comida</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassicSubTab("estilo")}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1",
                      classicSubTab === "estilo"
                        ? "bg-white dark:bg-[#1c1917] text-[#9a0002] shadow-xs"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    <MaterialSymbol icon="auto_awesome" size={14} />
                    <span>Estilo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassicSubTab("emojis")}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1",
                      classicSubTab === "emojis"
                        ? "bg-white dark:bg-[#1c1917] text-[#9a0002] shadow-xs"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    <span>🍣</span>
                    <span>Emojis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClassicSubTab("initials");
                      handleInitialsChange(customInitials || "SA");
                    }}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1",
                      classicSubTab === "initials"
                        ? "bg-white dark:bg-[#1c1917] text-[#9a0002] shadow-xs"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    <MaterialSymbol icon="badge" size={14} />
                    <span>Iniciales</span>
                  </button>
                </div>

                {classicSubTab === "initials" ? (
                  <div className="p-4 rounded-xl bg-white dark:bg-[#231f1c] border border-[#ede4d9] dark:border-[#2e2924] space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300">
                        Tus iniciales o texto corto (máx. 3 caracteres)
                      </label>
                      <input
                        type="text"
                        maxLength={3}
                        value={customInitials}
                        onChange={(e) => handleInitialsChange(e.target.value)}
                        placeholder="SA"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#ddd4c8] dark:border-[#3d3732] bg-[#faf6f1] dark:bg-[#1c1917] text-gray-900 dark:text-gray-100 font-bold uppercase tracking-wider text-center text-lg focus:outline-none focus:border-[#9a0002]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[170px] overflow-y-auto custom-scrollbar p-1">
                    {PLACEHOLDER_ICONS.filter((item) => item.category === classicSubTab).map((item) => {
                      const isSelected =
                        selectedAvatar.type === item.type && selectedAvatar.value === item.value;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectClassicIcon(item.type, item.value)}
                          className={cn(
                            "aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all duration-200 cursor-pointer active:scale-95",
                            isSelected
                              ? "bg-[#9a0002]/10 dark:bg-[#9a0002]/20 border-2 border-[#9a0002] shadow-sm text-[#9a0002] scale-105"
                              : "bg-white dark:bg-[#231f1c] border border-[#ede4d9] dark:border-[#3d3732] text-gray-700 dark:text-gray-300 hover:border-gray-400"
                          )}
                        >
                          {item.type === "symbol" ? (
                            <MaterialSymbol icon={item.value} size={24} fill={isSelected} />
                          ) : (
                            <span className="text-2xl select-none leading-none">{item.value}</span>
                          )}
                          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate max-w-full mt-1">
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

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-2.5 px-5 sm:px-6 py-4 border-t border-[#ede4d9] dark:border-[#2a2623] bg-[#f5efe5]/80 dark:bg-[#161412]/80">
            <button
              type="button"
              onClick={() => {
                setSelectedAvatar({
                  type: "character",
                  value: "char-sushi-boy",
                  frameId: "none",
                  gradientId: "mustard",
                });
              }}
              className="text-[12px] font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer flex items-center gap-1"
            >
              <MaterialSymbol icon="restart_alt" size={14} />
              <span>Restablecer</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-[13px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-[#9a0002] hover:bg-[#6b0001] text-white text-[13px] font-bold rounded-xl transition-all shadow-md shadow-[#9a0002]/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <MaterialSymbol icon="check" size={16} />
                <span>Guardar avatar</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
