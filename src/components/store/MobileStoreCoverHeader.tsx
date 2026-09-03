"use client";

import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { StoreRatingBadge } from "@/components/store/StoreRatingBadge";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  logoUrl?: string;
  logoEmoji: string;
  bannerUrl?: string;
  bannerBg?: string;
  rating: number;
  reviewsCount: number;
  isOpen?: boolean;
  backHref?: string;
  onBack?: () => void;
  backIcon?: "arrow_back" | "close";
};

export function MobileStoreCoverHeader({
  name,
  logoUrl,
  logoEmoji,
  bannerUrl,
  bannerBg = "from-[#4a342c] to-[#2a201c]",
  rating,
  reviewsCount,
  isOpen = true,
  backHref,
  onBack,
  backIcon = "arrow_back",
}: Props) {
  const displayName = name.trim();

  const backBtnClass =
    "flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/55 cursor-pointer";

  return (
    <header className="shrink-0 bg-white dark:bg-[#141210]">
      <div className="relative aspect-[8/3] w-full overflow-hidden bg-[#2a201c]">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={cn("h-full w-full bg-gradient-to-br", bannerBg)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-black/35" />

        <div
          className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 pb-3"
          style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
        >
          {backHref ? (
            <Link href={backHref} className={backBtnClass} aria-label="Volver">
              <MaterialSymbol icon={backIcon} size={20} />
            </Link>
          ) : (
            <button type="button" onClick={onBack} className={backBtnClass} aria-label="Cerrar">
              <MaterialSymbol icon={backIcon} size={20} />
            </button>
          )}
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isOpen ? "bg-emerald-400" : "bg-stone-400",
              )}
            />
            {isOpen ? "Abierto" : "Cerrado"}
          </span>
        </div>

        <p className="absolute inset-x-4 bottom-10 text-center text-[13px] font-medium text-white/95 drop-shadow-md lowercase">
          {displayName}
        </p>
      </div>

      <div className="relative bg-white px-4 pb-4 dark:bg-[#141210]">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[42%]">
          <div
            className="flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-full border-[4px] border-white bg-[#f0ebe4] text-2xl font-bold text-stone-500 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] dark:border-[#141210] dark:bg-[#231f1c] dark:text-stone-300"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              logoEmoji
            )}
          </div>
        </div>
        <div className="pt-12 text-center">
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 lowercase dark:text-gray-50">
            {displayName}
          </h1>
          <div className="mt-1.5 flex justify-center">
            <StoreRatingBadge rating={rating} reviewsCount={reviewsCount} size="md" />
          </div>
        </div>
      </div>
    </header>
  );
}
