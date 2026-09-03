/** Resize + WebP en el browser antes de mandar a Server Actions (límite default 1 MB). */

import { MENU_IMAGE_ASPECT } from "@/lib/images/menuImageSpec";

export type SourceCrop = {
  /** Recorte en píxeles de la imagen original. */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type OptimizeImageOptions = {
  maxWidth: number;
  maxHeight: number;
  /** Recorte centrado a proporción menú (3:2) si no hay `crop`. */
  aspectRatio?: number;
  crop?: SourceCrop;
  quality?: number;
};

export function fitDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) return { width, height };
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export async function optimizeImageFile(file: File, opts: OptimizeImageOptions): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const quality = opts.quality ?? 0.82;

  let srcX = 0;
  let srcY = 0;
  let srcW = bitmap.width;
  let srcH = bitmap.height;

  if (opts.crop) {
    srcX = Math.max(0, Math.min(bitmap.width - 1, Math.round(opts.crop.x)));
    srcY = Math.max(0, Math.min(bitmap.height - 1, Math.round(opts.crop.y)));
    srcW = Math.max(1, Math.min(bitmap.width - srcX, Math.round(opts.crop.w)));
    srcH = Math.max(1, Math.min(bitmap.height - srcY, Math.round(opts.crop.h)));
  } else {
    const aspect = opts.aspectRatio;
    if (aspect && aspect > 0) {
      const current = srcW / srcH;
      if (current > aspect) {
        srcW = Math.round(srcH * aspect);
        srcX = Math.floor((bitmap.width - srcW) / 2);
      } else if (current < aspect) {
        srcH = Math.round(srcW / aspect);
        srcY = Math.floor((bitmap.height - srcH) / 2);
      }
    }
  }

  const { width, height } = fitDimensions(srcW, srcH, opts.maxWidth, opts.maxHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("No se pudo procesar la imagen.");
  }

  ctx.drawImage(bitmap, srcX, srcY, srcW, srcH, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });
  if (!blob) throw new Error("No se pudo convertir la imagen.");

  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.webp`, { type: "image/webp" });
}

/** Ícono de carta: ~2× el tamaño en pantalla de una card. */
export const MENU_ICON_OPTS: OptimizeImageOptions = {
  maxWidth: 480,
  maxHeight: 320,
  aspectRatio: MENU_IMAGE_ASPECT,
  quality: 0.8,
};

/** Foto de detalle: alcanza para sheet mobile a retina. */
export const MENU_PHOTO_OPTS: OptimizeImageOptions = {
  maxWidth: 720,
  maxHeight: 480,
  aspectRatio: MENU_IMAGE_ASPECT,
  quality: 0.82,
};

/** Logo del local: círculo 76px → export exacto 512×512 (1:1). */
export const BUSINESS_LOGO_OPTS: OptimizeImageOptions = {
  maxWidth: 512,
  maxHeight: 512,
  aspectRatio: 1,
  quality: 0.85,
};

/** Portada: cover cliente aspect 8:3 (= ~390×146 CSS). Export exacto 1200×450. */
export const BUSINESS_BANNER_OPTS: OptimizeImageOptions = {
  maxWidth: 1200,
  maxHeight: 450,
  aspectRatio: 1200 / 450,
  quality: 0.82,
};

export function menuImageSizeHint(opts: OptimizeImageOptions) {
  return `${opts.maxWidth}×${opts.maxHeight}`;
}
