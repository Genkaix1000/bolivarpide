"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { UserAwardBadge, getRarityColor } from "@/lib/userProfile";
import { cn } from "@/lib/utils";

interface BadgeDetailModalProps {
  badge: UserAwardBadge | null;
  onClose: () => void;
  locked?: boolean;
}

export function BadgeDetailModal({ badge, onClose, locked = false }: BadgeDetailModalProps) {
  if (!badge) return null;

  const rarityStyle = getRarityColor(badge.rarity);

  const content = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-sm bg-[#faf6f1] dark:bg-[#1c1917] border border-[#e8e0d6] dark:border-[#3d3732] rounded-[24px] shadow-2xl p-6 overflow-hidden flex flex-col items-center text-center z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] transition-colors cursor-pointer"
          >
            <MaterialSymbol icon="close" size={18} />
          </button>

          {/* Badge Icon Shield */}
          <div className="relative mt-2 mb-4">
            <div className={cn("w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-lg", rarityStyle.bg, rarityStyle.border)}>
              {badge.emoji ? (
                <span className="text-4xl select-none leading-none">{badge.emoji}</span>
              ) : (
                <MaterialSymbol icon={badge.icon} size={40} className={rarityStyle.text} fill />
              )}
            </div>
            <span className={cn("absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-xs", rarityStyle.bg, rarityStyle.text, rarityStyle.border)}>
              {badge.rarity}
            </span>
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {badge.title}
          </h3>

          <p className="text-[13px] text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
            {badge.description}
          </p>

          <div className="w-full mt-5 pt-4 border-t border-[#ede4d9] dark:border-[#2a2623] space-y-2 text-left">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">Otorgado por:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{locked ? "BolivarPide" : (badge.awardedBy || "BolivarPide Oficial")}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">Fecha de entrega:</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{locked ? "Aún sin desbloquear" : (badge.unlockedAt || "Reciente")}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">Categoría:</span>
              <span className="font-semibold text-[#9a0002] dark:text-red-400 capitalize">Distinción de Comunidad</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-5 py-2.5 bg-[#9a0002] hover:bg-[#6b0001] text-white text-[13px] font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Entendido
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
