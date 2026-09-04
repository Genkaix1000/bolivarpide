"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
};

export function FullscreenImageViewer({
  images,
  initialIndex = 0,
  open,
  onClose,
  onIndexChange,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setIndex(initialIndex);
        setDirection(0);
      });
    }
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        setDirection(-1);
        setIndex((i) => {
          const next = Math.max(0, i - 1);
          onIndexChange?.(next);
          return next;
        });
      }
      if (e.key === "ArrowRight") {
        setDirection(1);
        setIndex((i) => {
          const next = Math.min(images.length - 1, i + 1);
          onIndexChange?.(next);
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, images.length, onIndexChange]);

  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  const goPrev = () => {
    if (!hasPrev) return;
    setDirection(-1);
    const next = index - 1;
    setIndex(next);
    onIndexChange?.(next);
  };

  const goNext = () => {
    if (!hasNext) return;
    setDirection(1);
    const next = index + 1;
    setIndex(next);
    onIndexChange?.(next);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset < -60 || velocity < -400) goNext();
    else if (offset > 60 || velocity > 400) goPrev();
  };

  if (!open || images.length === 0) return null;

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal
          aria-label="Visor de imagen"
          className="fixed inset-0 z-[110] flex flex-col bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 pb-3"
            style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
          >
            {images.length > 1 ? (
              <span className="text-[13px] font-medium text-white/70">
                {index + 1} / {images.length}
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 cursor-pointer"
              aria-label="Cerrar"
            >
              <MaterialSymbol icon="close" size={22} />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2">
            {hasPrev && (
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/55 cursor-pointer md:left-4"
                aria-label="Imagen anterior"
              >
                <MaterialSymbol icon="chevron_left" size={28} />
              </button>
            )}

            <motion.div
              className="flex h-full w-full items-center justify-center touch-pan-y"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={onDragEnd}
            >
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.img
                  key={images[index]}
                  src={images[index]}
                  alt=""
                  custom={direction}
                  variants={{
                    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 80 : d < 0 ? -80 : 0 }),
                    center: { opacity: 1, x: 0 },
                    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -80 : d < 0 ? 80 : 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="max-h-[min(88dvh,100%)] max-w-[min(96vw,100%)] object-contain select-none"
                  draggable={false}
                />
              </AnimatePresence>
            </motion.div>

            {hasNext && (
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/55 cursor-pointer md:right-4"
                aria-label="Imagen siguiente"
              >
                <MaterialSymbol icon="chevron_right" size={28} />
              </button>
            )}
          </div>

          {images.length > 1 && (
            <div
              className="flex shrink-0 justify-center gap-1.5 pb-[max(16px,env(safe-area-inset-bottom))] pt-2"
            >
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir a imagen ${i + 1}`}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                    onIndexChange?.(i);
                  }}
                  className={cn(
                    "rounded-full transition-all cursor-pointer",
                    i === index ? "h-2 w-6 bg-white" : "h-2 w-2 bg-white/35 hover:bg-white/55",
                  )}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
