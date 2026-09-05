# Hito 02 — GPS real del repartidor → tracking en vivo del cliente

## Objetivo

Reemplazar la **simulación** del repartidor en el mapa del cliente
(`demoRouteProgress` en `src/lib/orders/routeGeometry.ts`) por **posiciones reales**
compartidas por el repartidor desde la consola de reparto, con fallback a la simulación
cuando no haya señal.

## Problema

El cliente ya ve un mapa (OSM + ruta OSRM) y un marcador que avanza solo
(`OrderTrackingMap.tsx`), pero el repartidor **no transmite nada** y la "ubicación" es
un artefacto visual. Para un marketplace de delivery, el tracking real es lo que define
la experiencia.

## Alcance

**In v1**
- **Consola driver** (`DriverBoard.tsx` → `DeliveryOrderCard`): botón **"Iniciar reparto"**
  en pedidos `delivering` asignados a mí → `navigator.geolocation.watchPosition`
  (frecuencia 3–5 s, `maximumAge` corto) mientras dura el viaje; botón **"Dejar de compartir"**.
- **Broadcast**: canal Realtime `tracking-${orderId}` con `{ lat, lng, ts }`.
- **Persistencia mínima**: tabla `delivery_locations`
  (`order_id, driver_user_id, lat, lng, created_at`) con insert throttleado (aprox. cada 10 s)
  para suscriptores tardíos y auditoría.
- **Cliente**: `OrderTrackingMap` se suscribe al canal y usa la última posición real;
  si no hay posiciones (otro driver, señal apagada, `pickup`) → **fallback** al
  `demoRouteProgress` actual.
- **Privacidad**: solo se comparte mientras `status='delivering'` y el pedido es de
  `fulfillment_type='delivery'`; al pasar a `delivered`/`rejected` se borra la posición
  compartida y se cierra el broadcast.
- **RLS**: `delivery_locations` legible por cliente del pedido, miembro del negocio y
  admin; escritura vía server action con `service_role` (mutaciones de orden siguen por RPC).

**Out (v2 posibles)**
- Historial completo de rutas (trazado del recorrido real en el cliente).
- Optimización de batería en PWA instalada (Background Sync / SW location).
- Múltiples repartidores visibles (agente libre).

## Decisiones a resolver en implementación

| Decisión | Opciones | Recomendación |
|----------|----------|---------------|
| Guardar posición vs solo broadcast | (a) tabla + broadcast; (b) solo broadcast | **(a)**: suscriptores tardíos y el negocio necesitan el último punto |
| Frecuencia de guardado | cada evento vs throttle | throttle ~10 s (menos filas, alcanza para tracking humano) |
| Qué pasa con la batería | watch continuo vs por intervalos (`setInterval` + `getCurrentPosition`) | **intervalo 3–5 s** con `getCurrentPosition` (el browser no permite watch indefinido en todas las plataformas) |
| Permiso denegado | bloquear "Iniciar reparto" vs arrancar sin compartir | arrancar sin compartir y avisar (el PIN igual confirma) |
| Consentimiento | implícito al tocar "Iniciar reparto" | implícito + texto de aviso en el flujo |

## Tareas

### Fase A — Datos y dominio
- [x] Migración `supabase/migrations/20260908000000_delivery_locations.sql`: tabla `delivery_locations`
      (`order_id, driver_user_id, lat, lng, created_at`) + índices (`order_id, created_at DESC`; `created_at`) +
      RLS de lectura proxied al pedido padre (customer / member / admin; escritura service-only) +
      alta en `supabase_realtime`.
- [x] Server actions `shareDeliveryLocationAction` / `stopSharingLocationAction`
      (`src/lib/delivery/locationActions.ts`): authz driver asignado + status delivering +
      delivery-type; escritura service-only. Limpieza automática al confirmar entrega
      (red de seguridad en `advanceOrderStatus`).
- [x] Helper puro `src/lib/delivery/location.ts` (throttle, vigencia, rango WGS84) + `location.check.ts`.

> Decisión de realtime: **`postgres_changes` sobre `delivery_locations`** (filtro `order_id=eq.X`) en vez de
> broadcast manual `tracking-${orderId}`. Consistente con el resto del repo y los eventos respetan RLS
> (solo el dueño del pedido recibe la posición). Cleanup de posiciones al entregar vía server action
> invocada desde `advanceOrderStatus` (idempotente).

### Fase B — Consola driver
- [x] Botón "Iniciar reparto / Dejar de compartir" en `DeliveryOrderCard` (estado `sharing` +
      `driveError`) con hook `src/hooks/useDriverLocation.ts` (getCurrentPosition por intervalo,
      throttle de guardado, fallback sin GPS y aviso).
- [x] Enviar posiciones al servidor (`shareDeliveryLocationAction`); al `delivered` se limpia
      (stop + `stopSharingLocationAction` + red de seguridad en `advanceOrderStatus`).

### Fase C — Cliente (tracking)
- [x] Suscripción `postgres_changes` a `delivery_locations` (filtro `order_id=eq.X`) en
      `OrderTrackingMap` + merge con la ruta: `liveFresh` (posición real reciente dentro de
      `LOCATION_MAX_AGE_MS`) reemplaza al marker simulado; fallback a `demoRouteProgress` cuando
      no hay posición o está stale.
- [x] Lectura inicial del último punto: `resolveOrderTrackingMap` ahora recibe `orderId` y agrega
      `latestLocation` (`delivery_locations`, último `created_at`) al `OrderTrackingMapData` /
      `OrderTrackingMapView`.

### Fase D — Verificación
- [x] Migración `20260908000000_delivery_locations.sql` aplicada a remoto (`supabase db push --include-all`,
      junto a la `20260906050000_whatsapp_summaries_type.sql` que había quedado sin aplicar).
      Verified vía REST: GET 200 `[]`, INSERT anon rechazado por RLS (solo service_role escribe).
- [ ] `pnpm test` + `tsc --noEmit` + `lint` + QA manual en dos dispositivos (driver en consola,
      cliente en `/pedido/[id]`).
- [x] Spec `docs/features/09-tracking-gps/` con sdd/tdd (README, sdd 01–02, tdd 01–03).

## Riesgos

- **Permisos en iOS/Android (PWA)**: la geolocalización requiere HTTPS y consentimiento; en iOS
  la sesión de permiso se pregunta una vez. Mitigación: flujo con instrucciones + fallback simulado.
- **Privacidad del cliente**: solo el dueño del pedido ve la posición; nunca una lista pública.
- **Frecuencia vs costo Realtime**: throttle server-side para no saturar el canal.

## Referencias

- `src/lib/orders/routeGeometry.ts` → `demoRouteProgress`, `pointOnPolyline`
- `src/components/orders/OrderTrackingMap.tsx`, `src/lib/orders/trackingMap.ts`
- `src/lib/delivery/` → consola del driver
- Visión legacy: `ARQUITECTURA.legacy.md` (tabla `order_tracking`, canal `tracking-${orderId}`)