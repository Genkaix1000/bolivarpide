import { isWithinBolivar, localityLooksLikeBolivar } from "@/lib/addresses/bolivar";
import { matchBolivarStreet } from "@/lib/addresses/bolivarStreets";

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
  suburb?: string;
  neighbourhood?: string;
};

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  try {
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

    const rawStreet = (a.road || a.pedestrian || a.footway || "").trim();
    // Normalizar con catálogo oficial de Bolívar si es posible
    const street = matchBolivarStreet(rawStreet) || rawStreet;

    const locality = a.town || a.city || a.village || a.municipality || a.suburb;
    const withinBolivar =
      isWithinBolivar(lat, lng) || localityLooksLikeBolivar(locality);

    return {
      street,
      streetNumber: a.house_number?.trim() || null,
      lat,
      lng,
      withinBolivar,
    };
  } catch {
    return null;
  }
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Tu navegador no soporta geolocalización."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        let msg = "No pudimos obtener tu ubicación.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Permiso de ubicación denegado en tu navegador. Podés escribir tu calle arriba.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Señal de GPS no disponible en este momento.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Tiempo de espera agotado buscando tu ubicación.";
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
