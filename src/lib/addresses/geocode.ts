import { isWithinBolivar, localityLooksLikeBolivar } from "@/lib/addresses/bolivar";

export type ReverseGeocodeResult = {
  street: string;
  streetNumber: string | null;
  lat: number;
  lng: number;
  withinBolivar: boolean;
};

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  footway?: string;
  house_number?: string;
  town?: string;
  city?: string;
  village?: string;
  municipality?: string;
};

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "es",
      "User-Agent": "BolivarPide/1.0 (contact: hola@bolivarpide.com)",
    },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { address?: NominatimAddress };
  const a = data.address;
  if (!a) return null;

  const street = (a.road || a.pedestrian || a.footway || "").trim();
  if (!street) return null;

  const locality = a.town || a.city || a.village || a.municipality;
  const withinBolivar =
    isWithinBolivar(lat, lng) || localityLooksLikeBolivar(locality);

  return {
    street,
    streetNumber: a.house_number?.trim() || null,
    lat,
    lng,
    withinBolivar,
  };
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no disponible"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });
}
