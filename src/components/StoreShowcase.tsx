"use client";

import { useState } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import type { PanelProduct } from "@/lib/mockData";
import type { BusinessInfo, FeaturedChain } from "@/lib/mockData";

export type StoreProfile = {
  name: string;
  bannerText: string;
  bannerImage?: string;
  bannerBgClass?: string;
  logoImage?: string;
  logoEmoji?: string;
  rating: number;
  followersLabel: string;
  productsCount: number;
  timeEstimate: string;
  deliveryFee: number;
  minOrder: number;
  address: string;
  lat: number;
  lng: number;
  chainId?: string;
};

export function profileFromChain(
  chain: FeaturedChain,
  productsCount: number,
  followersLabel: string
): StoreProfile {
  return {
    name: chain.name,
    bannerText: chain.bannerText,
    bannerImage: chain.bannerImage,
    bannerBgClass: chain.bannerBg,
    logoImage: chain.logoImage,
    logoEmoji: chain.logoEmoji,
    rating: chain.rating,
    followersLabel,
    productsCount,
    timeEstimate: chain.timeEstimate,
    deliveryFee: chain.deliveryFee,
    minOrder: chain.minOrder,
    address: chain.address,
    lat: chain.lat,
    lng: chain.lng,
    chainId: chain.id,
  };
}

export function profileFromBusiness(b: BusinessInfo, productsCount: number): StoreProfile {
  return {
    name: b.name,
    bannerText: b.tagline ?? b.name,
    bannerImage: b.bannerImage,
    bannerBgClass: "bg-[#5d4037]",
    logoImage: b.logoImage,
    logoEmoji: b.initials,
    rating: b.rating,
    followersLabel: b.followersLabel,
    productsCount,
    timeEstimate: `${b.prepTimeMinutes} min`,
    deliveryFee: b.deliveryFee,
    minOrder: b.minOrder,
    address: b.address,
    lat: b.lat,
    lng: b.lng,
    chainId: b.chainId,
  };
}

function money(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function osmEmbedSrc(lat: number, lng: number, delta = 0.006) {
  const minLon = lng - delta;
  const minLat = lat - delta;
  const maxLon = lng + delta;
  const maxLat = lat + delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik`;
}

function googleMapsUrl(p: Pick<StoreProfile, "lat" | "lng">) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.lat},${p.lng}`)}`;
}

export function StoreMap({
  lat,
  lng,
  name,
  className,
}: {
  lat: number;
  lng: number;
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[#d8d4ce] dark:bg-[#231f1c] select-none",
        className
      )}
      aria-label={`Ubicación de ${name}`}
    >
      <iframe
        title=""
        tabIndex={-1}
        src={osmEmbedSrc(lat, lng)}
        className="pointer-events-none absolute left-0 top-0 h-[calc(100%+56px)] w-full border-0 grayscale contrast-[1.08] brightness-[1.12] saturate-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="pointer-events-none absolute inset-0 bg-[#f3efe8]/25 mix-blend-soft-light dark:bg-black/20" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5" />
      <div className="pointer-events-none absolute left-1/2 top-[46%] z-10 -translate-x-1/2 -translate-y-full">
        <div className="flex flex-col items-center drop-shadow-[0_6px_12px_rgba(154,0,2,0.35)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9a0002] text-white ring-[3px] ring-white dark:ring-[#1c1917]">
            <MaterialSymbol icon="storefront" size={18} />
          </div>
          <div className="-mt-1 h-2.5 w-2.5 rotate-45 rounded-[1px] bg-[#9a0002]" />
        </div>
      </div>
    </div>
  );
}

export function StoreLocationBlock({
  profile,
  mapClassName,
  stretchMap,
}: {
  profile: StoreProfile;
  mapClassName?: string;
  stretchMap?: boolean;
}) {
  return (
    <a
      href={googleMapsUrl(profile)}
      target="_blank"
      rel="noreferrer"
      aria-label={`Abrir ${profile.name} en Google Maps`}
      className={cn(
        "group block cursor-pointer outline-none",
        stretchMap ? "flex flex-1 flex-col min-h-0 gap-2.5" : "space-y-2.5"
      )}
    >
      <p className="flex items-start gap-1.5 text-[12px] leading-snug text-gray-500 shrink-0 transition-colors group-hover:text-[#9a0002]">
        <MaterialSymbol icon="location_on" size={16} className="mt-0.5 shrink-0 text-[#9a0002]" />
        <span className="underline-offset-2 group-hover:underline">{profile.address}</span>
      </p>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl transition-shadow group-hover:ring-2 group-hover:ring-[#9a0002]/25",
          stretchMap ? "flex-1 min-h-[120px] w-full" : "w-full"
        )}
      >
        <StoreMap
          lat={profile.lat}
          lng={profile.lng}
          name={profile.name}
          className={cn(stretchMap ? "h-full min-h-[120px] w-full" : "h-40 w-full", mapClassName)}
        />
        <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <MaterialSymbol icon="open_in_new" size={12} />
          Abrir en Maps
        </span>
      </div>
    </a>
  );
}

type Mode = "customer" | "owner";

type StockItem = Pick<PanelProduct, "id" | "name" | "image" | "available" | "soldCount">;

function QuickStockImage({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#ede4d9] dark:bg-[#231f1c] text-xl select-none">
        🍽
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setError(true)}
    />
  );
}

/** Grid compacto estilo media picker — carta rápida del dashboard */
export function StoreQuickStock({
  items,
  onToggle,
  cartaHref = "/negocio/carta",
  className,
}: {
  items: StockItem[];
  onToggle: (id: string) => void;
  cartaHref?: string;
  className?: string;
}) {
  const sorted = [...items].sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
  const topId = sorted[0]?.id;
  const pausedCount = items.filter((p) => !p.available).length;

  return (
    <div className={cn("rounded-2xl bg-[#f3efe8] dark:bg-[#141210] p-3", className)}>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <MaterialSymbol icon="menu_book" size={18} className="text-gray-500 shrink-0" />
          <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">Carta rápida</p>
        </div>
        <Link href={cartaHref} className="text-[11px] font-semibold text-[#9a0002] shrink-0 hover:underline">
          Ver carta
        </Link>
      </div>

      {pausedCount > 0 && (
        <p className="text-[10px] text-gray-400 mb-2">{pausedCount} en pausa · tocá para activar</p>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        {sorted.slice(0, 6).map((item) => {
          const isTop = item.id === topId;
          const paused = !item.available;
          return (
            <button
              key={item.id}
              type="button"
              title={paused ? `Activar ${item.name}` : `Pausar ${item.name}`}
              onClick={() => onToggle(item.id)}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-xl cursor-pointer transition-all",
                isTop && !paused && "ring-2 ring-[#9a0002] ring-offset-2 ring-offset-[#f3efe8] dark:ring-offset-[#141210]",
                paused && "opacity-50 grayscale"
              )}
            >
              <QuickStockImage src={item.image} alt={item.name} />

              {isTop && (
                <span className="absolute left-1 top-1 rounded-md bg-[#9a0002] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow-sm">
                  Top
                </span>
              )}

              {paused ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm">
                    <MaterialSymbol icon="play_arrow" size={18} fill />
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm">
                    <MaterialSymbol icon="pause" size={16} />
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Panel del local — misma UI del hub (lado derecho en desktop / bloque en mobile).
 * customer: hub público · owner: dashboard negocio
 */
export function StoreSidePanel({
  profile,
  mode,
  following,
  onFollowToggle,
  isOpen,
  onOpenToggle,
  className,
  /** Dashboard: stretch panel to match left column height */
  fillHeight,
  /** Dashboard sidebar: tighter banner, no stretch */
  compact,
  stockItems,
  onStockToggle,
  /** Hub desktop: full-height column. Dashboard: card that fits the grid. */
  variant = "panel",
}: {
  profile: StoreProfile;
  mode: Mode;
  following?: boolean;
  onFollowToggle?: () => void;
  isOpen?: boolean;
  onOpenToggle?: () => void;
  className?: string;
  fillHeight?: boolean;
  compact?: boolean;
  stockItems?: StockItem[];
  onStockToggle?: (id: string) => void;
  variant?: "panel" | "card";
}) {
  return (
    <aside
      className={cn(
        "flex flex-col bg-white dark:bg-[#1c1917]",
        variant === "panel" && "h-full border-l border-[#e8e0d6] dark:border-[#2a2623]",
        variant === "card" &&
          "overflow-hidden rounded-[20px] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.14)]",
        fillHeight && "h-full min-h-0",
        className
      )}
    >
      <div className="relative aspect-[8/3] w-full shrink-0 overflow-hidden bg-[#2a201c]">
        {profile.bannerImage ? (
          <img src={profile.bannerImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={cn("h-full w-full", profile.bannerBgClass ?? "bg-[#5d4037]")} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/20" />
        <div className="absolute right-3 top-3 flex gap-2">
          {mode === "owner" && onOpenToggle ? (
            <button
              type="button"
              onClick={onOpenToggle}
              className="inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm cursor-pointer"
            >
              <span
                className={cn("h-2 w-2 rounded-full", isOpen ? "bg-emerald-400 animate-pulse" : "bg-white/40")}
              />
              {isOpen ? "Abierto" : "Cerrado"}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm cursor-pointer"
                aria-label="Favorito"
              >
                <MaterialSymbol icon="favorite" size={18} />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm cursor-pointer"
                aria-label="Compartir"
                onClick={() => {
                  if (navigator.share) void navigator.share({ title: profile.name, url: window.location.href });
                  else void navigator.clipboard?.writeText(window.location.href);
                }}
              >
                <MaterialSymbol icon="ios_share" size={18} />
              </button>
            </>
          )}
        </div>
        <p className="absolute bottom-10 left-4 right-4 text-center text-[13px] font-semibold text-white/95 drop-shadow">
          {profile.bannerText}
        </p>
      </div>

      <div
        className={cn(
          "relative z-10 flex flex-col flex-1 min-h-0 px-6 pb-5",
          compact ? "-mt-8" : "-mt-10"
        )}
      >
        <div className="shrink-0 flex flex-col items-center text-center">
          <div
            className={cn(
              "overflow-hidden rounded-full border-[3px] border-white dark:border-[#1c1917] bg-white shadow-[0_10px_28px_-10px_rgba(0,0,0,0.4)]",
              compact ? "h-[64px] w-[64px]" : "h-[84px] w-[84px]"
            )}
          >
            {profile.logoImage ? (
              <img src={profile.logoImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl">{profile.logoEmoji}</div>
            )}
          </div>
          <h1 className={cn("mt-3 font-bold tracking-tight text-gray-900 dark:text-gray-50", compact ? "text-lg" : "text-[22px]")}>
            {profile.name}
          </h1>

          <div className={cn("flex w-full items-center", compact ? "mt-3" : "mt-4")}>
            <div className="flex flex-1 flex-col items-center">
              <span className="text-[17px] font-bold text-gray-900 dark:text-gray-100">
                {profile.followersLabel}
              </span>
              <span className="text-[11px] text-gray-400">Seguidores</span>
            </div>
            <div className="h-9 w-px bg-[#ebe6df] dark:bg-[#2a2623]" />
            <div className="flex flex-1 flex-col items-center">
              <span className="text-[17px] font-bold text-gray-900 dark:text-gray-100">
                {profile.productsCount}
              </span>
              <span className="text-[11px] text-gray-400">Productos</span>
            </div>
            <div className="h-9 w-px bg-[#ebe6df] dark:bg-[#2a2623]" />
            <div className="flex flex-1 flex-col items-center">
              <span className="flex items-center gap-0.5 text-[17px] font-bold text-gray-900 dark:text-gray-100">
                {profile.rating}
                <MaterialSymbol icon="star" size={15} fill className="text-amber-500" />
              </span>
              <span className="text-[11px] text-gray-400">Rating</span>
            </div>
          </div>

          {mode === "customer" && onFollowToggle && (
            <button
              type="button"
              onClick={onFollowToggle}
              className={cn(
                "mt-5 w-full rounded-full py-3 text-[14px] font-semibold cursor-pointer transition-colors",
                following
                  ? "border border-[#9a0002]/40 bg-[#9a0002]/8 text-[#9a0002]"
                  : "bg-[#9a0002] text-white hover:bg-[#6b0001]"
              )}
            >
              {following ? "Siguiendo" : "Seguir"}
            </button>
          )}

          {mode === "owner" && (
            <div className={cn("flex w-full gap-2", compact ? "mt-3" : "mt-5")}>
              <Link
                href={profile.chainId ? `/negocio/${profile.chainId}/configuracion/general` : "/negocio"}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#9a0002] py-2.5 text-[13px] font-semibold text-white hover:bg-[#6b0001]"
              >
                <MaterialSymbol icon="edit" size={16} />
                Editar
              </Link>
              {profile.chainId && (
                <Link
                  href={`/c/${profile.chainId}?from=negocio`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 dark:border-[#3d3732] py-2.5 text-[13px] font-semibold text-gray-800 dark:text-gray-200"
                >
                  Vista cliente
                </Link>
              )}
            </div>
          )}
        </div>

        <div className={cn("shrink-0 flex items-center gap-3 rounded-2xl bg-[#f3efe8] dark:bg-[#141210] px-3.5 py-3", compact ? "mt-3" : "mt-5")}>
          <div className={cn("flex shrink-0 items-center justify-center rounded-full bg-[#9a0002]/12 text-[#9a0002]", compact ? "h-9 w-9" : "h-11 w-11")}>
            <MaterialSymbol icon="delivery_dining" size={compact ? 18 : 22} />
          </div>
          <div className="min-w-0 text-left text-[12px] leading-snug text-gray-600 dark:text-gray-300">
            <p>
              <span className="font-bold text-gray-900 dark:text-gray-100">{profile.timeEstimate}</span>
              <span className="text-gray-400"> · </span>
              Envío {money(profile.deliveryFee)}
            </p>
          </div>
        </div>

        <div className={cn("shrink-0 rounded-2xl bg-[#f3efe8] dark:bg-[#141210] p-3", compact ? "mt-3" : "mt-4")}>
          <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-2">Ubicación</p>
          <StoreLocationBlock profile={profile} mapClassName={compact ? "h-28" : "h-40"} />
        </div>

        {mode === "owner" && stockItems && stockItems.length > 0 && onStockToggle && (
          <StoreQuickStock
            items={stockItems}
            onToggle={onStockToggle}
            cartaHref={profile.chainId ? `/negocio/${profile.chainId}/carta` : "/negocio/carta"}
            className={compact ? "mt-3" : "mt-4"}
          />
        )}
      </div>
    </aside>
  );
}
