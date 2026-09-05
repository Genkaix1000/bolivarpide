"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isValidLatLng,
  LOCATION_INTERVAL_MS,
  shouldSaveLocation,
} from "@/lib/delivery/location";

export type DriveError = "unavailable" | "denied" | null;

/**
 * Comparte la posición GPS del repartidor mientras dura un reparto.
 * Usa `getCurrentPosition` en un intervalo (más compatible en PWA/iOS que
 * `watchPosition`, que no es sostenible en todas las plataformas) y throttle
 * la persistencia server-side a ~LOCATION_SAVE_MS.
 *
 * Estados:
 * - `active`: el repartidor inició el compartir (viaje en curso).
 * - `sharing`: hay permiso + posición válida y se está enviando.
 * - `error`: 'denied' (permiso rechazado) | 'unavailable' (sin GPS). En ambos
 *   casos `active` queda true pero no se envía nada (el cliente hace fallback).
 */
export function useDriverLocation() {
  const [active, setActive] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<DriveError>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentRef = useRef<number | null>(null);
  const metaRef = useRef<{ businessId: string; orderId: string } | null>(null);
  const activeRef = useRef(false);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback((businessId: string, orderId: string) => {
    activeRef.current = true;
    setActive(true);
    metaRef.current = { businessId, orderId };

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("unavailable");
      setSharing(false);
      return;
    }

    const emit = () => {
      if (!activeRef.current) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!activeRef.current) return;
          const { latitude, longitude } = pos.coords;
          if (!isValidLatLng(latitude, longitude)) {
            setSharing(false);
            setError("unavailable");
            return;
          }
          setError(null);
          setSharing(true);
          const meta = metaRef.current;
          if (!meta) return;
          if (!shouldSaveLocation(Date.now(), lastSentRef.current)) return;
          lastSentRef.current = Date.now();
          // Import dinámico para no arrastrar una server action al bundle del hook.
          void import("@/lib/delivery/locationActions").then((m) =>
            m.shareDeliveryLocationAction({
              businessId: meta.businessId,
              orderId: meta.orderId,
              lat: latitude,
              lng: longitude,
            }),
          );
        },
        () => {
          if (!activeRef.current) return;
          setSharing(false);
          setError("denied");
        },
        { enableHighAccuracy: true, maximumAge: 2_000, timeout: 10_000 },
      );
    };

    emit();
    stopTimer();
    timerRef.current = setInterval(emit, LOCATION_INTERVAL_MS);
  }, [stopTimer]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    setSharing(false);
    setError(null);
    stopTimer();
  }, [stopTimer]);

  useEffect(() => stop, [stop]);

  return { active, sharing, error, start, stop };
}
