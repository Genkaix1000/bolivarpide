"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Opacity + translate only — scale causes visible reposition on open. */
export const NOTIFICATION_POPOVER_MOTION = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
} as const;

export function NotificationPopover({
  open,
  children,
  align = "right",
  className,
}: {
  open: boolean;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          {...NOTIFICATION_POPOVER_MOTION}
          className={cn(
            "absolute top-[calc(100%+6px)] z-50",
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
            className,
          )}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
