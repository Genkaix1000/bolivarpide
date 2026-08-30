"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { flashToast } from "@/components/FlashToast";
import {
  MAP_TILE_SIZE,
  fitMapView,
  latLngToPoint,
  mapTileUrl,
  markerPixel,
  type LatLng,
} from "@/lib/addresses/mapProjection";
import {
  demoRouteProgress,
  fetchStreetRoute,
  isNearDestination,
  pointOnPolyline,
  trimPolyline,
} from "@/lib/orders/routeGeometry";
import type { OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import type { OrderTrackingMapData } from "@/lib/orders/trackingMap";
import { cn } from "@/lib/utils";

/** Estética fija del mapa de seguimiento — no sigue modo claro/oscuro de la app */
const MAP_BG = "#ebe8e4";
const MAP_TILE_FILTER = "grayscale(1) contrast(1.06) brightness(1.04) sepia(0.08)";

function latRouteToSvg(
  points: LatLng[],
  centerPoint: { x: number; y: number },
  zoom: number,
  w: number,
  h: number,
) {
  if (points.length < 2) return "";
  return points
    .map((p, i) => {
      const { left, top } = markerPixel(p, centerPoint, zoom, w, h);
      return `${i === 0 ? "M" : "L"} ${left.toFixed(1)} ${top.toFixed(1)}`;
    })
    .join(" ");
}

function StoreMarker({ left, top, label }: { left: number; top: number; label: string }) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left, top }}
      aria-label={label}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#1a1210] bg-[#9a0002] text-white shadow-md">
        <MaterialSymbol icon="storefront" size={22} fill />
      </div>
    </div>
  );
}

function HomeMarker({ left, top, label }: { left: number; top: number; label: string }) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left, top }}
      aria-label={label}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#1a1210] bg-white shadow-md">
        <MaterialSymbol icon="home" size={22} className="text-[#1a1210]" fill />
      </div>
    </div>
  );
}

function CourierMarker({ left, top }: { left: number; top: number }) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left, top }}
      aria-label="Repartidor en camino"
    >
      <span className="absolute inset-0 rounded-full bg-[#9a0002]/20 animate-ping" />
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#1a1210] bg-white shadow-md">
        <MaterialSymbol icon="two_wheeler" size={20} className="text-[#1a1210]" />
      </div>
    </div>
  );
}

export function OrderTrackingMap({
  map,
  status,
  orderId,
  className,
}: {
  map: OrderTrackingMapData;
  status: OrderLifecycleStatus;
  orderId: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 360, h: 640 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; start: { x: number; y: number } } | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [route, setRoute] = useState<LatLng[] | null>(null);
  const deliveringSince = useRef<number | null>(null);
  const nearNotified = useRef(false);

  const sheetInset = Math.round(size.h * 0.12);

  const fitPoints = useMemo(() => {
    const pts: LatLng[] = [map.business];
    if (map.destination) pts.push(map.destination);
    return pts;
  }, [map]);

  const [zoom, setZoom] = useState(15);
  const [centerPoint, setCenterPoint] = useState(() =>
    latLngToPoint(map.business.lat, map.business.lng, 15),
  );

  useEffect(() => {
    if (!map.destination) return;
    let cancelled = false;
    void fetchStreetRoute(map.business, map.destination).then((pts) => {
      if (!cancelled) setRoute(pts);
    });
    return () => {
      cancelled = true;
    };
  }, [map.business, map.destination]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const next = fitMapView(fitPoints, size.w, size.h, 40, sheetInset);
    setZoom(next.zoom);
    setCenterPoint(latLngToPoint(next.center.lat, next.center.lng, next.zoom));
  }, [fitPoints, size.w, size.h, sheetInset]);

  useEffect(() => {
    if (status === "delivering" && deliveringSince.current === null) {
      deliveringSince.current = Date.now();
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }
    if (status !== "delivering") {
      deliveringSince.current = null;
      nearNotified.current = false;
    }
  }, [status]);

  useEffect(() => {
    if (status !== "delivering" || map.fulfillmentType !== "delivery") return;
    let raf = 0;
    const tick = (t: number) => {
      setNowMs(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, map.fulfillmentType]);

  const routePoints = route ?? (map.destination ? [map.business, map.destination] : null);

  const routeProgress =
    status === "delivering" && deliveringSince.current != null
      ? demoRouteProgress(status, deliveringSince.current, nowMs || Date.now())
      : 0;

  const courier =
    status === "delivering" && routePoints && routePoints.length >= 2
      ? pointOnPolyline(routePoints, routeProgress)
      : null;

  useEffect(() => {
    if (!courier || !map.destination || status !== "delivering") return;
    if (!isNearDestination(courier, map.destination)) return;
    const key = `bp-near-${orderId}`;
    if (nearNotified.current || sessionStorage.getItem(key)) return;
    nearNotified.current = true;
    sessionStorage.setItem(key, "1");

    const msg = "Tu pedido está cerca — a unas 5 cuadras";
    flashToast(msg);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("BolivarPide", { body: msg, icon: "/favicon.ico" });
      } catch {
        /* ignore */
      }
    }
  }, [courier, map.destination, status, orderId]);

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      start: { ...centerPoint },
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setCenterPoint({
      x: dragStartRef.current.start.x - dx,
      y: dragStartRef.current.start.y - dy,
    });
  };

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  const businessPx = markerPixel(map.business, centerPoint, zoom, size.w, size.h);
  const destPx = map.destination
    ? markerPixel(map.destination, centerPoint, zoom, size.w, size.h)
    : null;
  const courierPx = courier ? markerPixel(courier, centerPoint, zoom, size.w, size.h) : null;

  const fullRouteSvg =
    routePoints && routePoints.length >= 2
      ? latRouteToSvg(routePoints, centerPoint, zoom, size.w, size.h)
      : null;
  const activeRouteSvg =
    routePoints && routeProgress > 0
      ? latRouteToSvg(trimPolyline(routePoints, routeProgress), centerPoint, zoom, size.w, size.h)
      : null;

  const startTileX = Math.floor((centerPoint.x - size.w / 2) / MAP_TILE_SIZE);
  const endTileX = Math.floor((centerPoint.x + size.w / 2) / MAP_TILE_SIZE);
  const startTileY = Math.floor((centerPoint.y - size.h / 2) / MAP_TILE_SIZE);
  const endTileY = Math.floor((centerPoint.y + size.h / 2) / MAP_TILE_SIZE);
  const maxTile = (1 << zoom) - 1;

  const tiles: { key: string; url: string; left: number; top: number }[] = [];
  for (let tx = startTileX; tx <= endTileX; tx++) {
    for (let ty = startTileY; ty <= endTileY; ty++) {
      if (ty < 0 || ty > maxTile) continue;
      const wrappedX = ((tx % (maxTile + 1)) + (maxTile + 1)) % (maxTile + 1);
      tiles.push({
        key: `${zoom}-${tx}-${ty}`,
        url: mapTileUrl(zoom, wrappedX, ty),
        left: tx * MAP_TILE_SIZE - (centerPoint.x - size.w / 2),
        top: ty * MAP_TILE_SIZE - (centerPoint.y - size.h / 2),
      });
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden touch-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="absolute inset-0" style={{ backgroundColor: MAP_BG }} />

      <div
        className="absolute inset-0 origin-center scale-[1.06]"
        style={{ filter: MAP_TILE_FILTER }}
      >
        {tiles.map((t) => (
          <img
            key={t.key}
            src={t.url}
            alt=""
            draggable={false}
            className="absolute h-[256px] w-[256px] select-none"
            style={{ left: t.left, top: t.top }}
          />
        ))}
      </div>

      {fullRouteSvg ? (
        <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
          <path
            d={fullRouteSvg}
            fill="none"
            stroke="rgba(26,18,16,0.2)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {activeRouteSvg ? (
            <path
              d={activeRouteSvg}
              fill="none"
              stroke="#1a1210"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </svg>
      ) : null}

      <StoreMarker left={businessPx.left} top={businessPx.top} label={map.business.label} />
      {destPx ? (
        <HomeMarker left={destPx.left} top={destPx.top} label={map.destination!.label} />
      ) : null}
      {courierPx ? <CourierMarker left={courierPx.left} top={courierPx.top} /> : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[28%] bg-gradient-to-t from-[#faf6f1]/90 via-transparent to-transparent" />
    </div>
  );
}
