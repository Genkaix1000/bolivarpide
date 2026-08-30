export const MAP_TILE_SIZE = 256;

export type LatLng = { lat: number; lng: number };

export function latLngToPoint(lat: number, lng: number, zoom: number) {
  const scale = 1 << zoom;
  const siny = Math.sin((lat * Math.PI) / 180);
  const clampedSiny = Math.min(Math.max(siny, -0.9999), 0.9999);
  return {
    x: MAP_TILE_SIZE * (0.5 + lng / 360) * scale,
    y: MAP_TILE_SIZE * (0.5 - Math.log((1 + clampedSiny) / (1 - clampedSiny)) / (4 * Math.PI)) * scale,
  };
}

export function pointToLatLng(x: number, y: number, zoom: number): LatLng {
  const scale = 1 << zoom;
  const lng = (x / (MAP_TILE_SIZE * scale) - 0.5) * 360;
  const y2 = 0.5 - y / (MAP_TILE_SIZE * scale);
  const lat = 90 - (360 * Math.atan(Math.exp(-y2 * (2 * Math.PI)))) / Math.PI;
  return { lat, lng };
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
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

export function markerPixel(
  marker: LatLng,
  centerPoint: { x: number; y: number },
  zoom: number,
  viewWidth: number,
  viewHeight: number,
) {
  const p = latLngToPoint(marker.lat, marker.lng, zoom);
  return {
    left: p.x - centerPoint.x + viewWidth / 2,
    top: p.y - centerPoint.y + viewHeight / 2,
  };
}

export function fitMapView(
  points: LatLng[],
  viewWidth: number,
  viewHeight: number,
  padding = 48,
  bottomExtra = 0,
) {
  if (points.length === 0) {
    return { center: { lat: -36.2307, lng: -61.1189 }, zoom: 14 };
  }
  if (points.length === 1) {
    // Centrar el pin en el tercio superior (sheet abajo)
    const latOffset = 0.0018 + bottomExtra * 0.000004;
    return {
      center: { lat: points[0].lat - latOffset, lng: points[0].lng },
      zoom: bottomExtra > 100 ? 16 : 15,
    };
  }

  const minLat = Math.min(...points.map((p) => p.lat));
  const maxLat = Math.max(...points.map((p) => p.lat));
  const minLng = Math.min(...points.map((p) => p.lng));
  const maxLng = Math.max(...points.map((p) => p.lng));
  const latSpan = maxLat - minLat || 0.002;
  const center = {
    lat: (minLat + maxLat) / 2 - latSpan * (bottomExtra / Math.max(viewHeight, 1)) * 0.35,
    lng: (minLng + maxLng) / 2,
  };

  const spanKm = Math.max(
    haversineKm(minLat, minLng, maxLat, maxLng),
    haversineKm(minLat, minLng, minLat, maxLng),
    0.25,
  );

  let zoom = 16;
  if (spanKm > 0.4) zoom = 15;
  if (spanKm > 1.2) zoom = 14;
  if (spanKm > 3) zoom = 13;
  if (spanKm > 8) zoom = 12;

  const innerW = Math.max(viewWidth - padding * 2, 120);
  const innerH = Math.max(viewHeight - padding * 2 - bottomExtra, 120);
  for (let z = zoom; z >= 11; z--) {
    const nw = latLngToPoint(maxLat, minLng, z);
    const se = latLngToPoint(minLat, maxLng, z);
    if (se.x - nw.x <= innerW && se.y - nw.y <= innerH) {
      zoom = z;
      break;
    }
    zoom = z - 1;
  }

  return { center, zoom: Math.max(11, Math.min(17, zoom)) };
}

/** Tiles OSM + filtro plata fijo en el componente (sin Carto / sin API key) */
export function mapTileUrl(z: number, x: number, y: number) {
  const wrappedX = ((x % (1 << z)) + (1 << z)) % (1 << z);
  return `https://tile.openstreetmap.org/${z}/${wrappedX}/${y}.png`;
}
