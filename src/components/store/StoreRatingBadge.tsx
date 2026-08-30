"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { formatStoreRating, isNewStore } from "@/lib/business/storeRating";
import { cn } from "@/lib/utils";

type Props = {
  rating: number;
  reviewsCount: number;
  size?: "sm" | "md";
  className?: string;
};

export function StoreRatingBadge({ rating, reviewsCount, size = "sm", className }: Props) {
  if (isNewStore(reviewsCount)) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-[#9a0002]/10 font-bold text-[#9a0002] dark:text-red-400",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
          className,
        )}
      >
        <MaterialSymbol icon="new_releases" size={size === "sm" ? 12 : 14} />
        Nuevo
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-semibold text-amber-600 dark:text-amber-400",
        size === "sm" ? "text-[11px]" : "text-[13px]",
        className,
      )}
    >
      <MaterialSymbol icon="star" size={size === "sm" ? 12 : 14} fill />
      {formatStoreRating(rating)}
      {reviewsCount > 0 && (
        <span className="text-gray-400 font-normal">({reviewsCount})</span>
      )}
    </span>
  );
}
