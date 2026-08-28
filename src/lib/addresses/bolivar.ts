import { BOLIVAR_CENTER, BOLIVAR_RADIUS_KM } from "@/lib/addresses/constants";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinBolivar(lat: number, lng: number) {
  return haversineKm(lat, lng, BOLIVAR_CENTER.lat, BOLIVAR_CENTER.lng) <= BOLIVAR_RADIUS_KM;
}

export function localityLooksLikeBolivar(locality: string | undefined) {
  if (!locality) return false;
  return /bol[ií]var/i.test(locality);
}
