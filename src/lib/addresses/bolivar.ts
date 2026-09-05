import { BOLIVAR_CENTER, BOLIVAR_RADIUS_KM } from "@/lib/addresses/constants";
import { haversineKm } from "./mapProjection";

export function isWithinBolivar(lat: number, lng: number) {
  return haversineKm(lat, lng, BOLIVAR_CENTER.lat, BOLIVAR_CENTER.lng) <= BOLIVAR_RADIUS_KM;
}

export function localityLooksLikeBolivar(locality: string | undefined) {
  if (!locality) return false;
  return /bol[ií]var/i.test(locality);
}
