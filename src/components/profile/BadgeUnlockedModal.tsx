"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { getRarityColor } from "@/lib/userProfile";
import type { BadgeDefinition } from "@/lib/badges/definitions";
import { cn } from "@/lib/utils";

interface BadgeUnlockedModalProps {
  badge: BadgeDefinition | null;
  onClose: () => void;
}

export function BadgeUnlockedModal({ badge, onClose }: BadgeUnlockedModalProps) {
  if (!badge) return null;

  const rarityStyle = getRarityColor(badge.rarity);
  const confettiColors = ["bg-amber-400", "bg-rose-400", "bg-sky-400", "bg-emerald-400", "bg-violet-400"];

  const content = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-sm"
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ type: "spring", damping: 20, stiffness: 320 }}
          className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-[#e8e0d6] bg-[#faf6f1] p-6 text-center shadow-2xl dark:border-[#3d3732] dark:bg-[#1c1917] z-10"
        >
          {/* Confetti burst (one-shot al montar) */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {confettiColors.map((c, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{ opacity: 0, x: (i % 2 === 0 ? -1 : 1) * (60 + i * 25), y: -90 - (i % 3) * 30, scale: 0.4 + (i % 3) * 0.2 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className={cn("absolute h-2.5 w-2.5 rounded-full", c)}
              />
            ))}
          </div>

          <motion.span
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 260, delay: 0.1 }}
            className="inline-flex"
          >
            <div className={cn("mt-2 mb-3 flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-lg", rarityStyle.bg, rarityStyle.border, rarityStyle.glow)}>
              {badge.emoji ? (
                <span className="select-none text-5xl leading-none">{badge.emoji}</span>
              ) : (
                <MaterialSymbol icon={badge.icon} size={48} className={rarityStyle.text} fill />
              )}
            </div>
          </motion.span>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9a0002] dark:text-red-400">
            ¡Logro desbloqueado!
          </p>
          <h3 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            {badge.title}
          </h3>
          <span className={cn("mt-1.5 inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider", rarityStyle.bg, rarityStyle.text, rarityStyle.border)}>
            {badge.rarity}
          </span>
          <p className="mt-3 text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
            {badge.description}
          </p>

          <button
            onClick={onClose}
            className="mt-5 w-full cursor-pointer rounded-xl bg-[#9a0002] py-2.5 text-[13px] font-bold text-white shadow-md transition-all hover:bg-[#6b0001] active:scale-95"
          >
            ¡Seguí así!
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}