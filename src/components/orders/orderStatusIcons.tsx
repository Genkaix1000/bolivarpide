"use client";

import {
  CheckCircle,
  CookingPot,
  Moped,
  Receipt,
  Storefront,
  WarningCircle,
  XCircle,
  type Icon,
} from "@phosphor-icons/react";
import type { OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import { statusIcon, type OrderStatusIcon } from "@/lib/orders/active";

const STATUS_ICON: Record<OrderStatusIcon, Icon> = {
  Receipt,
  CookingPot,
  Moped,
  CheckCircle,
  XCircle,
};

export const ORDER_STEP_ICONS = {
  receipt: Receipt,
  cooking: CookingPot,
  moped: Moped,
  check: CheckCircle,
  storefront: Storefront,
} as const;

export function OrderStatusGlyph({
  status,
  size = 20,
  weight = "regular",
  className,
}: {
  status: OrderLifecycleStatus;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
}) {
  const IconCmp = STATUS_ICON[statusIcon(status)];
  return <IconCmp weight={weight} size={size} className={className} />;
}

export function OrderWarningGlyph({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return <WarningCircle weight="fill" size={size} className={className} />;
}
