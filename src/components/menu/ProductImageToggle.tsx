"use client";

import { useState } from "react";
import { FullscreenImageViewer } from "@/components/ui/FullscreenImageViewer";
import { ProductImagePlaceholder } from "@/components/menu/ProductImagePlaceholder";
import { cn } from "@/lib/utils";

export type ProductImageMode = "photo" | "icon";

export function getProductImageModes(
  iconUrl?: string | null,
  photoUrl?: string | null,
): ProductImageMode[] {
  const icon = iconUrl?.trim() || "";
  const photo = photoUrl?.trim() || "";
  const modes: ProductImageMode[] = [];
  if (icon) modes.push("icon");
  if (photo && photo !== icon) modes.push("photo");
  return modes;
}

export function getProductImageUrls(iconUrl?: string | null, photoUrl?: string | null): string[] {
  const icon = iconUrl?.trim() || "";
  const photo = photoUrl?.trim() || "";
  return getProductImageModes(iconUrl, photoUrl).map((m) => (m === "photo" ? photo : icon));
}

export function productListImage(iconUrl?: string | null, photoUrl?: string | null) {
  return iconUrl ?? photoUrl ?? undefined;
}

type ToggleProps = {
  iconUrl?: string | null;
  photoUrl?: string | null;
  className?: string;
  imageClassName?: string;
  defaultMode?: ProductImageMode;
  dotsClassName?: string;
  /** preview: solo ícono, sin carrusel ni fullscreen. expanded: carrusel + lightbox al tap */
  variant?: "preview" | "expanded";
};

export function ProductImageToggle({
  iconUrl,
  photoUrl,
  className,
  imageClassName,
  defaultMode,
  dotsClassName,
  variant = "preview",
}: ToggleProps) {
  const icon = iconUrl?.trim() || "";

  if (variant === "preview") {
    if (!icon) {
      return <ProductImagePlaceholder className={className} />;
    }
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <img src={icon} alt="" className={cn("h-full w-full object-cover", imageClassName)} />
      </div>
    );
  }

  const modes = getProductImageModes(iconUrl, photoUrl);
  const urls = getProductImageUrls(iconUrl, photoUrl);
  const pickInitial = () => {
    if (defaultMode === "icon" && modes.includes("icon")) return modes.indexOf("icon");
    if (defaultMode === "photo" && modes.includes("photo")) return modes.indexOf("photo");
    return 0;
  };
  const [index, setIndex] = useState(pickInitial);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const safeIndex = Math.min(index, Math.max(modes.length - 1, 0));
  const mode = modes[safeIndex];
  const src =
    mode === "photo" ? photoUrl : mode === "icon" ? iconUrl : photoUrl ?? iconUrl;

  if (!src) {
    return <ProductImagePlaceholder className={className} />;
  }

  return (
    <>
      <div className={cn("relative overflow-hidden", className)}>
        <button
          type="button"
          aria-label="Ver imagen en pantalla completa"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(true);
          }}
          className="block h-full w-full cursor-zoom-in"
        >
          <img src={src} alt="" className={cn("h-full w-full object-cover", imageClassName)} />
        </button>
        {modes.length > 1 && (
          <div
            className={cn(
              "absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-0.5 pt-2.5",
              dotsClassName,
            )}
          >
            {modes.map((m, idx) => {
              const active = idx === safeIndex;
              return (
                <button
                  key={m}
                  type="button"
                  aria-label={m === "photo" ? "Ver foto real" : "Ver ícono"}
                  aria-current={active}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(idx);
                  }}
                  className="flex h-9 min-w-9 cursor-pointer items-center justify-center"
                >
                  <span
                    className={cn(
                      "block rounded-full transition-all duration-300",
                      active
                        ? "h-2 w-6 bg-white shadow-sm shadow-black/30"
                        : "h-2 w-2 bg-white/45 hover:bg-white/70",
                    )}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <FullscreenImageViewer
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={urls}
        initialIndex={safeIndex}
        onIndexChange={setIndex}
      />
    </>
  );
}
