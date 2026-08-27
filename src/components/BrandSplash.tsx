"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const LOADING_WORDS = [
  { text: "BUSCAS.", isOutline: true },
  { text: "PEDIS.", isOutline: false },
  { text: "TENES.", isOutline: true },
  { text: "BOLIVARPIDE.", isOutline: false },
];

/** Evita que Strict Mode mate el timer a mitad del splash */
const splashTimers = new Map<string, ReturnType<typeof setTimeout>>();

function BrandSplashScreen({ onSkip }: { onSkip: () => void }) {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const wordTimer = setInterval(() => {
      setWordIndex((prev) => {
        if (prev >= LOADING_WORDS.length - 1) {
          clearInterval(wordTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 320);
    return () => clearInterval(wordTimer);
  }, []);

  const currentWord = LOADING_WORDS[wordIndex];
  const characters = currentWord.text.split("");

  const outlineStyle: React.CSSProperties = {
    WebkitTextStrokeWidth: "2.5px",
    WebkitTextStrokeColor: "#ffffff",
    WebkitTextFillColor: "#9a0002",
    color: "#9a0002",
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onSkip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSkip();
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] bg-[#9a0002] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer"
    >
      <div
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{ height: "clamp(3.5rem, 14vw, 8rem)" }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={wordIndex}
            className="absolute inset-0 flex items-center justify-center tracking-tight font-bold uppercase leading-none"
            style={{ fontSize: "clamp(2.5rem, 11vw, 7rem)" }}
          >
            {characters.map((char, charIdx) => (
              <div key={charIdx} className="overflow-hidden inline-block" style={{ lineHeight: 1.2 }}>
                <motion.span
                  initial={{ y: "-100%" }}
                  animate={{ y: "0%" }}
                  exit={{ y: "100%" }}
                  transition={{
                    duration: 0.28,
                    delay: charIdx * 0.018,
                    ease: [0.33, 1, 0.68, 1],
                  }}
                  style={{
                    display: "inline-block",
                    ...(currentWord.isOutline ? outlineStyle : { color: "#ffffff" }),
                  }}
                  className="font-bold"
                >
                  {char}
                </motion.span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="absolute bottom-10 text-[12px] font-medium text-white/50">Tocá para continuar</p>
    </motion.div>
  );
}

/** Splash solo la 1ª visita (localStorage). Después no vuelve. */
export function useBrandSplash(storageKey: string, durationMs = 1400) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch {
      return;
    }

    setShow(true);

    if (splashTimers.has(storageKey)) return;

    const t = setTimeout(() => {
      splashTimers.delete(storageKey);
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        /* ignore */
      }
      setShow(false);
    }, durationMs);
    splashTimers.set(storageKey, t);

    // ponytail: no clearTimeout on cleanup — Strict Mode would abort the only timer
  }, [storageKey, durationMs]);

  const skip = () => {
    const t = splashTimers.get(storageKey);
    if (t) clearTimeout(t);
    splashTimers.delete(storageKey);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return { show, skip };
}

export function BrandSplash({ show, onSkip }: { show: boolean; onSkip: () => void }) {
  return (
    <AnimatePresence>{show && <BrandSplashScreen key="brand-splash" onSkip={onSkip} />}</AnimatePresence>
  );
}
