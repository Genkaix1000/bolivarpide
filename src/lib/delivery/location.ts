/** Helper de ubicación del repartidor (puro, sin I/O: testeable y
 * reutilizable por actions/UI/hook). */

/** Intervalo de muestreo del GPS (getCurrentPosition) en ms. */
export const LOCATION_INTERVAL_MS = 4_000;

/** Umbral de persistencia: cada cuánto se guarda una fila en `delivery_locations`. */
export const LOCATION_SAVE_MS = 10_000;

/** Una posición real se considera vigente si tiene menos de esta antigüedad. */
export const LOCATION_MAX_AGE_MS = 20_000;

export type LatLng = {
  lat: number;
  lng: number;
};

/** ¿Recién llega y ya es hora de guardar? Evita insertar en cada tick. */
export function shouldSaveLocation(
  nowMs: number,
  lastSavedMs: number | null,
  saveWindowMs = LOCATION_SAVE_MS,
): boolean {
  if (lastSavedMs == null) return true;
  return nowMs - lastSavedMs >= saveWindowMs;
}

/** ¿La posición sigue siendo utilizable para el tracking del cliente? */
export function isLocationFresh(tsMs: number, nowMs: number, maxAgeMs = LOCATION_MAX_AGE_MS): boolean {
  return nowMs - tsMs <= maxAgeMs;
}

/** Rango válido de WGS84; rechaza valores imposibles (GPS corrupto/tests). */
export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
