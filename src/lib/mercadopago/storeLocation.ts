import { BOLIVAR_CENTER, BOLIVAR_DEFAULTS, MP_LOCATION_DEFAULTS } from "@/lib/addresses/constants";
import { matchBolivarStreet } from "@/lib/addresses/bolivarStreets";

export type MpStoreLocation = {
  streetName: string;
  streetNumber: string;
  cityName: string;
  stateName: string;
  latitude: number;
  longitude: number;
  reference: string;
};

/** MP stores: city_name/state_name/street_name solo letras y espacios (sin acentos ni puntuación). */
export function sanitizeMpPlaceName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseStreet(address: string | null): { streetName: string; streetNumber: string } {
  const raw = address?.trim();
  if (!raw) return { streetName: "Av San Martin", streetNumber: "150" };
  const m = raw.match(/^(.+?)\s+(\d+\w*)$/);
  if (m) {
    return {
      streetName: sanitizeMpPlaceName(matchBolivarStreet(m[1].trim()) ?? m[1].trim()),
      streetNumber: m[2].replace(/\D/g, "") || "S/N",
    };
  }
  return {
    streetName: sanitizeMpPlaceName(matchBolivarStreet(raw) ?? raw),
    streetNumber: "SN",
  };
}

async function geocodeInBolivar(streetName: string, streetNumber: string): Promise<{ lat: number; lng: number } | null> {
  const q = `${streetName} ${streetNumber}, ${BOLIVAR_DEFAULTS.city}, ${BOLIVAR_DEFAULTS.province}, Argentina`;
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Language": "es",
        "User-Agent": "BolivarPide/1.0 (contact: hola@bolivarpide.com)",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const rows = await res.json() as { lat?: string; lon?: string }[];
    const hit = rows[0];
    if (!hit?.lat || !hit?.lon) return null;
    return { lat: Number(hit.lat), lng: Number(hit.lon) };
  } catch {
    return null;
  }
}

/** Ubicación MP: ciudad Bolivar fija; calle del comercio; coords geocodificadas. */
export async function resolveMpStoreLocation(input: {
  address: string | null;
  city?: string | null;
  province?: string | null;
}): Promise<MpStoreLocation> {
  const { streetName, streetNumber } = parseStreet(input.address);
  const coords =
    (await geocodeInBolivar(streetName, streetNumber)) ?? BOLIVAR_CENTER;

  const reference = sanitizeMpPlaceName(
    [input.address?.trim(), MP_LOCATION_DEFAULTS.cityName].filter(Boolean).join(" "),
  );

  return {
    streetName,
    streetNumber,
    cityName: MP_LOCATION_DEFAULTS.cityName,
    stateName: MP_LOCATION_DEFAULTS.stateName,
    latitude: coords.lat,
    longitude: coords.lng,
    reference: reference || MP_LOCATION_DEFAULTS.cityName,
  };
}
