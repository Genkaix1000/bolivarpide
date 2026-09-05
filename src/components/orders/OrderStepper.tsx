"use client";

import { cn } from "@/lib/utils";
import type { OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import { ORDER_STEP_ICONS } from "@/components/orders/orderStatusIcons";

const DELIVERY_STEPS = [
  { Icon: ORDER_STEP_ICONS.receipt, label: "Pedido" },
  { Icon: ORDER_STEP_ICONS.cooking, label: "Cocina" },
  { Icon: ORDER_STEP_ICONS.moped, label: "Camino" },
  { Icon: ORDER_STEP_ICONS.check, label: "Entregado" },
] as const;

const PICKUP_STEPS = [
  { Icon: ORDER_STEP_ICONS.receipt, label: "Pedido" },
  { Icon: ORDER_STEP_ICONS.cooking, label: "Cocina" },
  { Icon: ORDER_STEP_ICONS.storefront, label: "Para retirar" },
] as const;

export function OrderStepper({
  step,
  pickup,
  status,
}: {
  step: 0 | 1 | 2 | 3;
  pickup?: boolean;
  status?: OrderLifecycleStatus;
}) {
  const steps = pickup ? PICKUP_STEPS : DELIVERY_STEPS;
  const allDone = pickup && status === "delivered";

  return (
    <div className="flex items-center justify-between gap-1">
      {steps.map((s, i) => {
        const active = allDone ? true : i <= step;
        const current = allDone ? i === steps.length - 1 : i === step;
        const IconCmp = s.Icon;
        return (
          <div key={s.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              {i > 0 ? (
                <div
                  className={cn(
                    "h-0 flex-1 border-t-2 border-dashed",
                    active ? "border-[#9a0002]/50" : "border-stone-300 dark:border-stone-600",
                  )}
                />
              ) : (
                <div className="flex-1" />
              )}
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  active
                    ? "bg-[#9a0002]/15 text-[#9a0002] dark:bg-[#9a0002]/20 dark:text-[#ff6b6b]"
                    : "bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-500",
                  current &&
                    "ring-2 ring-[#9a0002] ring-offset-2 ring-offset-white dark:ring-offset-[#1c1917]",
                )}
              >
                <IconCmp weight={current ? "regular" : "light"} size={20} />
              </div>
              {i < steps.length - 1 ? (
                <div
                  className={cn(
                    "h-0 flex-1 border-t-2 border-dashed",
                    allDone || i < step
                      ? "border-[#9a0002]/50"
                      : "border-stone-300 dark:border-stone-600",
                  )}
                />
              ) : (
                <div className="flex-1" />
              )}
            </div>
            <span
              className={cn(
                "text-center text-[10px] font-medium leading-tight",
                active ? "text-stone-700 dark:text-stone-200" : "text-stone-400 dark:text-stone-500",
              )}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
