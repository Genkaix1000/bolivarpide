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
      reject(new Error("Tu navegador no soporta ubicación. Escribí tu calle manualmente."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        let msg = "No pudimos obtener tu ubicación.";
        if (err.code === err.PERMISSION_DENIED) {
          msg =
            "Permiso de ubicación bloqueado. En Chromium: ícono del candado en la barra de direcciones → Ubicación → Permitir.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "No hay señal de ubicación disponible. Probá en el celular o escribí la calle.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Tardó demasiado. Reintentá o escribí tu calle.";
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 120000,
      },
    );
  });
}

export async function queryGeolocationAccess(): Promise<
  "granted" | "prompt" | "denied" | "unsupported"
> {
  if (typeof window === "undefined" || !navigator.geolocation) return "unsupported";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state as "granted" | "prompt" | "denied";
  } catch {
    return "prompt";
  }
}
