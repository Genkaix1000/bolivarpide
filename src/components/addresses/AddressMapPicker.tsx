"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { BOLIVAR_CENTER } from "@/lib/addresses/constants";
import { cn } from "@/lib/utils";

import { MAP_TILE_SIZE, latLngToPoint, pointToLatLng } from "@/lib/addresses/mapProjection";

type Props = {
  lat: number | null;
  lng: number | null;
  onChangeCoords: (lat: number, lng: number) => void;
};

export function AddressMapPicker({ lat, lng, onChangeCoords }: Props) {
  const currentLat = lat ?? BOLIVAR_CENTER.lat;
  const currentLng = lng ?? BOLIVAR_CENTER.lng;

  const [zoom, setZoom] = useState(16);
  const [centerPoint, setCenterPoint] = useState(() =>
    latLngToPoint(currentLat, currentLng, 16)
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startPoint: { x: number; y: number } } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync center when external lat/lng changes
  useEffect(() => {
    if (lat != null && lng != null && !isDragging) {
      setCenterPoint(latLngToPoint(lat, lng, zoom));
    }
  }, [lat, lng, zoom, isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startPoint: { ...centerPoint },
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    const newPoint = {
      x: dragStartRef.current.startPoint.x - dx,
      y: dragStartRef.current.startPoint.y - dy,
    };
    setCenterPoint(newPoint);
  };

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;
    const coords = pointToLatLng(centerPoint.x, centerPoint.y, zoom);
    onChangeCoords(Number(coords.lat.toFixed(6)), Number(coords.lng.toFixed(6)));
  }, [isDragging, centerPoint, zoom, onChangeCoords]);

  const changeZoom = (delta: number) => {
    const nextZoom = Math.min(Math.max(zoom + delta, 13), 18);
    if (nextZoom === zoom) return;
    const coords = pointToLatLng(centerPoint.x, centerPoint.y, zoom);
    setZoom(nextZoom);
    setCenterPoint(latLngToPoint(coords.lat, coords.lng, nextZoom));
  };

  // Compute tiles to display in a 320x180 viewport
  const viewWidth = 360;
  const viewHeight = 200;
  const startTileX = Math.floor((centerPoint.x - viewWidth / 2) / MAP_TILE_SIZE);
  const endTileX = Math.floor((centerPoint.x + viewWidth / 2) / MAP_TILE_SIZE);
  const startTileY = Math.floor((centerPoint.y - viewHeight / 2) / MAP_TILE_SIZE);
  const endTileY = Math.floor((centerPoint.y + viewHeight / 2) / MAP_TILE_SIZE);

  const tiles: { key: string; url: string; left: number; top: number }[] = [];
  const maxTile = (1 << zoom) - 1;

  for (let tx = startTileX; tx <= endTileX; tx++) {
    for (let ty = startTileY; ty <= endTileY; ty++) {
      if (ty >= 0 && ty <= maxTile) {
        const wrappedX = ((tx % (maxTile + 1)) + (maxTile + 1)) % (maxTile + 1);
        const tileLeft = tx * MAP_TILE_SIZE - (centerPoint.x - viewWidth / 2);
        const tileTop = ty * MAP_TILE_SIZE - (centerPoint.y - viewHeight / 2);
        tiles.push({
          key: `${zoom}-${tx}-${ty}`,
          url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`,
          left: tileLeft,
          top: tileTop,
        });
      }
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-0.5">
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Ubicación en el mapa
        </label>
        <span className="text-[11px] text-[#9a0002] font-semibold">
          Arrastrá el mapa para centrar el pin
        </span>
      </div>

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          "relative h-48 w-full select-none overflow-hidden rounded-2xl border border-[#e8e0d6] bg-[#eae6e1] touch-none cursor-grab active:cursor-grabbing dark:border-[#3d3732] dark:bg-[#1a1715]"
        )}
      >
        {/* Tiles */}
        <div className="absolute inset-0 pointer-events-none">
          {tiles.map((t) => (
            <img
              key={t.key}
              src={t.url}
              alt=""
              loading="lazy"
              draggable={false}
              className="absolute h-[256px] w-[256px] select-none"
              style={{
                left: `${t.left}px`,
                top: `${t.top}px`,
              }}
            />
          ))}
        </div>

        {/* Center Target Pin (Mercado Libre style) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative flex flex-col items-center -translate-y-4">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full bg-[#9a0002] text-white shadow-lg ring-2 ring-white transition-transform",
              isDragging && "scale-110 -translate-y-1"
            )}>
              <MaterialSymbol icon="location_on" size={22} className="text-white" fill />
            </div>
            {/* Pin shadow */}
            <div className="mt-0.5 h-1.5 w-3 rounded-full bg-black/30 blur-[1px]" />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-2.5 right-2.5 flex flex-col gap-1 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              changeZoom(1);
            }}
            aria-label="Acercar"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 shadow text-stone-700 hover:bg-white active:scale-95 dark:bg-[#2a2623]/90 dark:text-stone-200"
          >
            <MaterialSymbol icon="add" size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              changeZoom(-1);
            }}
            aria-label="Alejar"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 shadow text-stone-700 hover:bg-white active:scale-95 dark:bg-[#2a2623]/90 dark:text-stone-200"
          >
            <MaterialSymbol icon="remove" size={16} />
          </button>
        </div>

        {/* Reset to Bolivar button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChangeCoords(BOLIVAR_CENTER.lat, BOLIVAR_CENTER.lng);
            setCenterPoint(latLngToPoint(BOLIVAR_CENTER.lat, BOLIVAR_CENTER.lng, zoom));
          }}
          className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold shadow text-stone-700 hover:bg-white active:scale-95 dark:bg-[#2a2623]/90 dark:text-stone-200"
        >
          <MaterialSymbol icon="near_me" size={12} className="text-[#9a0002]" />
          <span>Bolívar centro</span>
        </button>
      </div>
    </div>
  );
}
