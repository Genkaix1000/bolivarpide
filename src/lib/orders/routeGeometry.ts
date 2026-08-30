import { haversineKm, type LatLng } from "@/lib/addresses/mapProjection";
import type { OrderLifecycleStatus } from "@/lib/orders/lifecycle";

export function polylineLengthKm(points: LatLng[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += haversineKm(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return sum;
}

/** t ∈ [0,1] sobre la polilínea por distancia */
export function pointOnPolyline(points: LatLng[], t: number): LatLng {
  if (points.length === 0) return { lat: 0, lng: 0 };
  if (points.length === 1 || t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  const total = polylineLengthKm(points);
  if (total <= 0) return points[0];
  const target = total * t;

  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const seg = haversineKm(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng,
    );
    if (walked + seg >= target) {
      const f = seg > 0 ? (target - walked) / seg : 0;
      return {
        lat: points[i - 1].lat + (points[i].lat - points[i - 1].lat) * f,
        lng: points[i - 1].lng + (points[i].lng - points[i - 1].lng) * f,
      };
    }
    walked += seg;
  }
  return points[points.length - 1];
}

export function trimPolyline(points: LatLng[], t: number): LatLng[] {
  if (points.length < 2 || t <= 0) return [points[0]];
  if (t >= 1) return points;

  const end = pointOnPolyline(points, t);
  const out: LatLng[] = [points[0]];
  const total = polylineLengthKm(points);
  const target = total * t;
  let walked = 0;

  for (let i = 1; i < points.length; i++) {
    const seg = haversineKm(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng,
    );
    if (walked + seg >= target) {
      out.push(end);
      return out;
    }
    out.push(points[i]);
    walked += seg;
  }
  out.push(end);
  return out;
}

/** ponytail: OSRM demo público; reemplazar por routing propio si rate-limit */
export async function fetchStreetRoute(from: LatLng, to: LatLng): Promise<LatLng[]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error("routing failed");
    const data = (await res.json()) as {
      routes?: { geometry?: { coordinates?: [number, number][] } }[];
    };
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!coords?.length) throw new Error("empty route");
    return coords.map(([lng, lat]) => ({ lat, lng }));
  } catch {
    return [from, to];
  }
}

const NEAR_KM = 0.5;

/** Demo: avance 0→1 mientras status=delivering (~3 min hasta casi llegar) */
export function demoRouteProgress(status: OrderLifecycleStatus, startedAtMs: number, nowMs: number): number {
  if (status !== "delivering") return 0;
  const elapsed = Math.max(0, nowMs - startedAtMs);
  const base = Math.min(0.94, elapsed / 180_000);
  return base;
}

export function isNearDestination(courier: LatLng, destination: LatLng): boolean {
  return haversineKm(courier.lat, courier.lng, destination.lat, destination.lng) <= NEAR_KM;
}

export const NEAR_DELIVERY_KM = NEAR_KM;
