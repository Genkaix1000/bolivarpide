/** Resize + WebP en el browser antes de mandar a Server Actions (límite default 1 MB). */

export type OptimizeImageOptions = {
  maxWidth: number;
  maxHeight: number;
  /** Centro, cuadrado (íconos de menú). */
  square?: boolean;
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

  if (opts.square) {
    const side = Math.min(bitmap.width, bitmap.height);
    srcX = Math.floor((bitmap.width - side) / 2);
    srcY = Math.floor((bitmap.height - side) / 2);
    srcW = side;
    srcH = side;
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

export const MENU_ICON_OPTS: OptimizeImageOptions = {
  maxWidth: 512,
  maxHeight: 512,
  square: true,
  quality: 0.82,
};

export const MENU_PHOTO_OPTS: OptimizeImageOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.85,
};
