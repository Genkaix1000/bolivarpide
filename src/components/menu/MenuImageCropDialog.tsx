"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { MENU_IMAGE_ASPECT } from "@/lib/images/menuImageSpec";
import {
  optimizeImageFile,
  menuImageSizeHint,
  type OptimizeImageOptions,
  type SourceCrop,
} from "@/lib/images/optimizeImage";
import { cn } from "@/lib/utils";

type Props = {
  file: File;
  title: string;
  optimizeOpts: OptimizeImageOptions;
  onCancel: () => void;
  onDone: (file: File) => void;
};

function coverScale(nw: number, nh: number, vw: number, vh: number) {
  return Math.max(vw / nw, vh / nh);
}

function clampPan(
  nx: number,
  ny: number,
  z: number,
  nw: number,
  nh: number,
  vw: number,
  vh: number,
) {
  const s = coverScale(nw, nh, vw, vh) * z;
  const rw = nw * s;
  const rh = nh * s;
  const maxX = Math.max(0, (rw - vw) / 2);
  const maxY = Math.max(0, (rh - vh) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, nx)),
    y: Math.max(-maxY, Math.min(maxY, ny)),
  };
}

/**
 * Encuadre 3:2: arrastrar + zoom, luego exporta WebP al tamaño del menú.
 * ponytail: sin lib de crop; upgrade a react-easy-crop si hace falta pinch nativo.
 */
export function MenuImageCropDialog({ file, title, optimizeOpts, onCancel, onDone }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    queueMicrotask(() => setSrc(url));
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setVp({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = natural && vp.w > 0 ? coverScale(natural.w, natural.h, vp.w, vp.h) * zoom : 1;
  const drawW = natural ? natural.w * scale : 0;
  const drawH = natural ? natural.h * scale : 0;

  function sourceCrop(): SourceCrop | null {
    if (!natural || vp.w <= 0) return null;
    const s = coverScale(natural.w, natural.h, vp.w, vp.h) * zoom;
    const rw = natural.w * s;
    const rh = natural.h * s;
    const imgLeft = vp.w / 2 - rw / 2 + pan.x;
    const imgTop = vp.h / 2 - rh / 2 + pan.y;
    return {
      x: -imgLeft / s,
      y: -imgTop / s,
      w: vp.w / s,
      h: vp.h / s,
    };
  }

  async function confirm() {
    const crop = sourceCrop();
    if (!crop) return;
    setBusy(true);
    setError(null);
    try {
      const out = await optimizeImageFile(file, { ...optimizeOpts, crop, aspectRatio: undefined });
      onDone(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo recortar la imagen.");
    } finally {
      setBusy(false);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !natural || vp.w <= 0) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setPan(
      clampPan(drag.current.panX + dx, drag.current.panY + dy, zoom, natural.w, natural.h, vp.w, vp.h),
    );
  }

  function onPointerUp() {
    drag.current = null;
  }

  function onZoom(z: number) {
    if (!natural || vp.w <= 0) {
      setZoom(z);
      return;
    }
    setZoom(z);
    setPan(clampPan(pan.x, pan.y, z, natural.w, natural.h, vp.w, vp.h));
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/70 backdrop-blur-[2px]">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="text-[14px] font-bold">{title}</p>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Cerrar"
        >
          <MaterialSymbol icon="close" size={20} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-4">
        <div
          ref={viewportRef}
          className="relative w-full max-w-md touch-none overflow-hidden rounded-2xl bg-stone-900"
          style={{ aspectRatio: String(MENU_IMAGE_ASPECT) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {src && natural && vp.w > 0 ? (
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                width: drawW,
                height: drawH,
                left: vp.w / 2 - drawW / 2 + pan.x,
                top: vp.h / 2 - drawH / 2 + pan.y,
              }}
            />
          ) : src ? (
            <img
              src={src}
              alt=""
              className="hidden"
              onLoad={(e) => {
                setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-white/35" />
        </div>
        <p className="mt-3 text-center text-[12px] text-white/70">Arrastrá para encuadrar</p>
        <p className="mt-1 text-center text-[11px] text-white/45">{menuImageSizeHint(optimizeOpts)}</p>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => onZoom(Number(e.target.value))}
          className="mt-3 w-full max-w-md accent-[#9a0002]"
          aria-label="Zoom"
        />
        {error ? <p className="mt-2 text-[12px] text-red-300">{error}</p> : null}
      </div>

      <div className="flex gap-2 px-4 pb-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="flex-1 cursor-pointer rounded-full border border-white/20 py-3 text-[13px] font-bold text-white hover:bg-white/10 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={busy || !natural}
          className={cn(
            "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#9a0002] py-3 text-[13px] font-bold text-white hover:bg-[#850002] disabled:opacity-50",
          )}
        >
          <MaterialSymbol icon="check" size={18} />
          {busy ? "Guardando…" : "Usar foto"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
