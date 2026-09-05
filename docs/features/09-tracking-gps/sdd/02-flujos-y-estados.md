# SDD 02 — Flujos y estados

## Estados del compartir (consola del repartidor)

El hook `useDriverLocation` modela tres estados internos:

```
        tocar "Iniciar reparto"
        ▲                        │ start(businessId, orderId)
        │                        ▼
   (inactivo) ───────────►  active
                             │  ├─ GPS OK (permiso + pos válida) → sharing = true
                             │  └─ sin GPS / permiso denegado     → sharing = false, error ∈ {denied, unavailable}
        ▲                        │
        └────────────────────────┘
        stop() / unmount / confirmar entrega
```

| Estado del hook | Significado | ¿Envía posiciones? |
|-----------------|-------------|:-------------------:|
| `active=false` | Sin compartir | ✗ |
| `active=true, sharing=true` | Compartiendo con posiciones válidas | ✓ (throttle ~10 s) |
| `active=true, sharing=false, error=denied` | Permiso rechazado, sigue activo sin compartir | ✗ |
| `active=true, sharing=false, error=unavailable` | Sin geolocalización, sigue activo sin compartir | ✗ |

- El `error` se muestra como aviso ámbar bajo el botón.
- Al confirmar la entrega (`runDeliver`) se llama `stop()` — no se puede "quedar compartiendo" un pedido entregado.

## Ciclo de vida de los datos de posición

```
Repartidor (hook)                       Server (shareDeliveryLocationAction)            Cliente (OrderTrackingMap)
        │  getCurrentPosition c/4s              │  authz: driver asignado + delivering +      │
        │  → shareDeliveryLocationAction ────►  │  delivery-type → INSERT delivery_locations  │
        │                                       │        │ (service_role)                     │
        │                                       │        ▼                                     │
        │                                       │  postgres_changes (RLS) ──────────────────►  │  setLivePos({lat,lng,ts})
        │                                       │                                             │  isLocationFresh(ts, now)?
        │                                       │                                             │   └─ ✓ marker real
        │                                       │                                             │   └─ ✗ fallback demoRouteProgress
```

- **Lectura inicial**: `resolveOrderTrackingMap` consulta el último punto (`order by created_at desc limit 1`) y lo expone como `map.latestLocation` — así un cliente que abre la página a mitad de reparto ve la posición actual, no la simulación.
- **Throttle de persistencia**: el hook decide cuándo guardar (~10 s) con `shouldSaveLocation`; el server valida y persiste (no lleva estado en memoria — frágil en multi-instancia; el caudal máximo está acotado por el muestreo de ~6 filas/min).

## Momento de limpieza

| Evento | Quién limpia | Mecanismo |
|--------|--------------|-----------|
| "Dejar de compartir" (manual) | Driver → `stopSharingLocationAction` | DELETE `delivery_locations` del pedido (idempotente) |
| Entrega confirmada (`delivered`) | `advanceOrderStatus` → `stopSharingLocationAction` (red de seguridad en `after()`) | DELETE (mismo, idempotente) |
| Rechazo (comercio) | No aplica la limpieza en `advanceOrderStatus` (`only delivered`) — el reparto se cierra y la posición queda; v2 podría limpiar en cierre | — |

## Matriz de permisos

| Acción | Cliente (dueño) | Miembro negocio (active) | Admin | Repartidor asignado | Service (server action) |
|--------|:---------------:|:------------------------:|:-----:|:-------------------:|:------------------------:|
| Leer posiciones de un pedido | ✓ (propio) | ✓ | ✓ | ✓ (via member o service) | ✓ |
| Insertar posición de un pedido | ✗ | ✗ | ✗ | ✗ (solo vía acción, authz) | ✓ |
| Borrar posiciones de un pedido | ✗ | ✗ | ✗ | ✗ (solo vía acción, authz) | ✓ |
| Compartir un pedido ajeno / no asignado | ✗ | ✗ | ✗ | ✗ (server valida `delivery_driver_id = auth.uid()`) | — |

- **Escritura desde el cliente**: inexistente — todo pasa por server actions con `service_role` (mismo criterio que `orders`/`delivery_profiles`).
- **RLS de lectura proxied al pedido padre**: el cliente se autoriza por `orders.customer_user_id = auth.uid()`; el negocio por `is_business_member(business_id)` o `is_platform_admin()` (patrón idéntico a `order_items_select`).

## Flujo feliz (driver + cliente)

```
1. Repartidor con pedido en `delivering` asignado → toca "Iniciar reparto"
2. Hook pide permiso GPS y empieza a muestrear c/4 s
3. Cada posición válida se guarda (service_role) c/10 s → delivery_locations
4. El mapa del cliente `/pedido/[id]` recibe el evento postgres_changes (RLS OK)
5. `isLocationFresh` → marker real se mueve sobre el mapa (ruta base + store + destino)
6. Driver llega → "Confirmar entrega" con PIN → `delivered`
7. `advanceOrderStatus` borra las posiciones + el hook se detiene en la consola
8. Cliente ve "Entregado"; mapa sin marker activo
```

## Flujo con permiso denegado / fallback

```
1. Driver toca "Iniciar reparto", el navegador niega el permiso (o no hay geolocation)
2. Hook: active=true, sharing=false, error=denied/unavailable → aviso ámbar
3. No se insertan posiciones → el canal no recibe eventos
4. Cliente: `livePos` null / stale → usa `demoRouteProgress` (simulación) como hoy
5. El repartidor entrega con PIN normalmente; la posición nunca se compartió
```

## Casos borde

| Caso | Comportamiento esperado |
|------|-------------------------|
| Coordenadas fuera de rango (GPS corrupto `NaN`/∞) | `isValidLatLng` rechaza; no se inserta; `sharing=false` (no se rompe el loop) |
| El cliente abre la página a mitad de reparto | `latestLocation` = último punto persistido → marker real desde el inicio |
| Driver deja de enviar (señal perdida) | Pasados `LOCATION_MAX_AGE_MS` (20 s) el marker vuelve a la simulación |
| El repartidor intenta compartir un pedido que no es suyo | `shareDeliveryLocationAction` → error "El pedido no está asignado a vos" |
| Pedido que pasa de `delivering` (entregado/rechazado) | `advanceOrderStatus` limpia posiciones (delivered) |
| Pedido `pickup` | Nunca comparte: el server rechaza y el mapa no tiene destination |
| Entrega confirmada dos veces / doble cleanup | DELETE idempotente → sin error |
| El cliente es de OTRO pedido | RLS deniega el SELECT → no recibe eventos realtime |
| Múltiples posiciones rápidas | Throttle del hook (~10 s) + validación server por request; sin estado en memoria |