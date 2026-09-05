# TDD 01 — Arquitectura y contratos

## Dominio de reglas puras — `src/lib/delivery/location.ts` (sin `"use server"`)

```typescript
export const LOCATION_INTERVAL_MS = 4_000;   // muestreo de getCurrentPosition
export const LOCATION_SAVE_MS = 10_000;      // throttle de persistencia
export const LOCATION_MAX_AGE_MS = 20_000;   // vigencia de una posición para el cliente

export type LatLng = { lat: number; lng: number };

export function shouldSaveLocation(nowMs, lastSavedMs, saveWindowMs = LOCATION_SAVE_MS): boolean;
// null → true (primera); nowMs - last >= window → true

export function isLocationFresh(tsMs, nowMs, maxAgeMs = LOCATION_MAX_AGE_MS): boolean;
// nowMs - tsMs <= maxAgeMs → fresca

export function isValidLatLng(lat: number, lng: number): boolean;
// finito + [-90,90] × [-180,180]
```

## Server Actions — `src/lib/delivery/locationActions.ts` (`"use server"`)

```typescript
export type LocationResult = { ok: true } | { ok: false; error: string };

export async function shareDeliveryLocationAction(input: {
  businessId: string; orderId: string; lat: number; lng: number;
}): Promise<LocationResult>;
// Authz: requireBusinessAccess → rol driver; pedido con delivery_driver_id = user.id,
// status='delivering', fulfillment_type ≠ 'pickup'. Escribe con service client.

export async function stopSharingLocationAction(input: {
  businessId: string; orderId: string;
}): Promise<LocationResult>;
// Authz: rol driver + delivery_driver_id = user.id. DELETE delivery_locations del pedido.
```

## Hook — `src/hooks/useDriverLocation.ts` (`"use client"`)

```typescript
export type DriveError = "unavailable" | "denied" | null;
export function useDriverLocation(): {
  active: boolean;      // el viaje arrancó (compartiendo o intentando)
  sharing: boolean;     // realmente enviando posiciones válidas
  error: DriveError;
  start(businessId, orderId): void;
  stop(): void;
};
```

- Loop con `setInterval(emit, LOCATION_INTERVAL_MS)` → `getCurrentPosition(enableHighAccuracy, maximumAge 2s, timeout 10s)`.
- En cada posición válida: `setError(null); setSharing(true)`, y si `shouldSaveLocation(now, lastSent)` → `import("@/lib/delivery/locationActions").shareDeliveryLocationAction(...)` y actualiza `lastSent`.
- Import **dinámico** de la server action (no arrastrarla al bundle inicial del cliente).
- `stop()` cancela timer + reset; `useEffect(() => stop, [stop])` limpia en unmount.
- Regla del repo (React Compiler): no leer refs durante render → el timestamp se guarda como state.

## Componente — `src/components/delivery/DeliveryOrderCard.tsx`

- `const { active, sharing, error, start, stop } = useDriverLocation();`
- Botón dentro de `canActDeliver` (`status === 'delivering' && assignedToMe`):
  - off → "Iniciar reparto (compartir GPS)" (`start(businessId, order.id)`)
  - on + `sharing` → "Compartiendo ubicación · Dejar de compartir"
  - on + `!sharing` → "GPS sin señal · Dejar de compartir" + aviso ámbar con `error`
- Toggle off → `stop()` + `void stopSharingLocationAction(...)` + `flashToast`.
- `runDeliver` → tras éxito `stop()`.

## Mapa — `src/components/orders/OrderTrackingMap.tsx`

- Recibe `map: OrderTrackingMapData` (con `latestLocation`), `status`, `orderId`.
- **Lectura inicial**: `livePos` se inicia desde `map.latestLocation`; `livePosTs` desde `map.latestLocation.ts`.
- **Suscripción** (solo `status==='delivering' && fulfillmentType==='delivery'`):
  ```ts
  supabase.channel(`tracking-${orderId}`)
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'delivery_locations',
                              filter:`order_id=eq.${orderId}` }, cb).subscribe();
  ```
  En cb: `setLivePos({lat,lng})`, `setLivePosTs(created_at|Date.now())`.
- **Selección del marker**:
  ```ts
  const liveFresh = livePos && livePosTs != null && isLocationFresh(livePosTs, nowMs) ? livePos : null;
  const courier = status === 'delivering'
    ? liveFresh ?? (routePoints?.length >= 2 ? pointOnPolyline(routePoints, routeProgress) : null)
    : null;
  ```
- `nowMs` avanza con rAF usando `Date.now()` (tiempo real, comparable con `livePosTs`).
- `activeRouteSvg` se anula cuando `liveFresh` está presente (no mezclar avance simulado con marker real).
- La notificación "Tu pedido está cerca" usa `courier` → con posición real dispara en el punto real.

## Tipos del mapa — `src/lib/orders/trackingMap.ts` y `src/lib/orders/lifecycle.ts`

```typescript
// trackingMap.ts
export type OrderTrackingMapData = {
  showMap: boolean;
  fulfillmentType: "delivery" | "pickup";
  business: LatLng & { label: string };
  destination: (LatLng & { label: string }) | null;
  latestLocation: (LatLng & { ts: number }) | null;   // NUEVO
};
// resolveOrderTrackingMap({ ..., orderId }) → última fila de delivery_locations
//   (order by created_at desc limit 1) → latestLocation.

// lifecyle.ts
export type OrderTrackingMapView = { /* mismos campos */ latestLocation: {lat,lng,ts} | null };
// Sync del shape entre server y client (el view viaja por la API).
```

## Limpieza en entrega — `src/lib/orders/actions.ts`

- En `advanceOrderStatus`, dentro de un `after(async () => {...})` nuevo:
  `if (targetStatus === 'delivered') → import("@/lib/delivery/locationActions").stopSharingLocationAction(...)` (idempotente, catch + log).

## Tabla de archivos

| Archivo | Rol |
|---------|-----|
| `src/lib/delivery/location.ts` | Reglas puras (throttle, vigencia, rango WGS84) + constantes |
| `src/lib/delivery/location.check.ts` | Tests ponytail de `location.ts` |
| `src/lib/delivery/locationActions.ts` | Server actions share/stop (service-only) |
| `src/hooks/useDriverLocation.ts` | Loop de geolocalización + throttle en el cliente |
| `src/components/delivery/DeliveryOrderCard.tsx` | Botón Iniciar/Dejar de compartir + aviso |
| `src/components/orders/OrderTrackingMap.tsx` | Suscripción + merge real/fallback |
| `src/lib/orders/trackingMap.ts` | `latestLocation` en `OrderTrackingMapData` |
| `src/lib/orders/lifecycle.ts` | `latestLocation` en `OrderTrackingMapView` |
| `src/lib/orders/queries.ts` | Pasa `orderId` a `resolveOrderTrackingMap` |
| `src/lib/orders/actions.ts` | Limpieza automática al `delivered` |
| `supabase/migrations/20260908000000_delivery_locations.sql` | Tabla + RLS + publicación realtime |

## Dependencias

Ninguna nueva. Reutiliza:

- `@/lib/supabase/service` (`createServiceClient`, writes) y `@/lib/supabase/client` (suscripción realtime)
- `@/lib/business/queries` → `requireBusinessAccess`
- `@/lib/orders/routeGeometry` → `pointOnPolyline`, `demoRouteProgress`, `trimPolyline`
- `@/lib/delivery/location` (constantes/helpers compartidos hook + map)