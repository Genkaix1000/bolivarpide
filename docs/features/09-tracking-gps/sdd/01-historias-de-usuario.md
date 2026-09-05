# SDD 01 — Historias de usuario

## Repartidor (conduce la entrega)

### HU-D01 — Iniciar reparto y compartir ubicación

**Como** repartidor con un pedido asignado en camino
**Quiero** un botón "Iniciar reparto" que comparta mi ubicación GPS
**Para** que el cliente vea en vivo dónde está mi entrega

**Criterios de aceptación**

- El botón aparece en `DeliveryOrderCard` cuando `status='delivering' && assignedToMe` (`canActDeliver`).
- Al tocar "Iniciar reparto" arranca el muestreo: `navigator.geolocation.getCurrentPosition` cada ~4 s con `enableHighAccuracy`.
- Cada posición válida se envía a `shareDeliveryLocationAction` con throttle de persistencia (~10 s).
- El mismo botón pasa a "Compartiendo ubicación · Dejar de compartir".

---

### HU-D02 — Dejar de compartir

**Como** repartidor
**Quiero** poder dejar de compartir mi ubicación cuando quiera
**Para** no exponer mi recorrido más de lo necesario

**Criterios de aceptación**

- Al tocar "Dejar de compartir": se detiene el muestreo, se llama `stopSharingLocationAction` y se borran las posiciones guardadas del pedido.
- Al confirmar la entrega (`Confirmar entrega` → PIN correcto): el GPS se detiene automáticamente y el server limpia las posiciones (red de seguridad en `advanceOrderStatus`, idempotente).

---

### HU-D03 — Sin permiso o sin GPS

**Como** repartidor que no dio permiso de ubicación (o sin señal)
**Quiero** poder seguir con el reparto igual
**Para** no bloquear una entrega por un detalle técnico

**Criterios de aceptación**

- Si `navigator.geolocation` no existe → estado `unavailable`, no se envía nada.
- Si el permiso se rechaza → estado `denied`, no se envía nada.
- En ambos casos el botón muestra "GPS sin señal · Dejar de compartir" con un aviso ámbar.
- El PIN de entrega sigue funcionando: la entrega se puede confirmar sin compartir.

---

## Cliente (sigue su pedido)

### HU-C01 — Ver la posición real del repartidor en el mapa

**Como** cliente con un pedido a domicilio en camino
**Quiero** ver en el mapa de `/pedido/[id]` el marcador del repartidor moviéndose con su posición real
**Para** saber exactamente dónde está mi pedido

**Criterios de aceptación**

- `OrderTrackingMap` se suscribe a `delivery_locations` por `order_id` (`postgres_changes`, solo llegan eventos RLS-visibles).
- Si la última posición recibida/hay inicial está dentro de `LOCATION_MAX_AGE_MS` (20 s) → el marcador usa esa posición real.
- La lectura inicial (`latestLocation`) se toma en `resolveOrderTrackingMap` (último punto de `delivery_locations`).
- El trazo "activo" (ruta recorrida simulada) se oculta cuando hay posición real, para no mostrar un avance inconsistente.

---

### HU-C02 — Fallback a la simulación

**Como** cliente con un pedido en camino
**Quiero** que el marcador siga avanzando aunque el repartidor no comparta posición
**Para** no perder la referencia visual del avance

**Criterios de aceptación**

- Si no hay posición real reciente (nunca compartió, está stale > 20 s, otro driver, `pickup`) → el marcador cae al `demoRouteProgress` actual (avance simulado por la polilínea OSRM).
- La transición real→simulado no rompe el mapa ni la notificación de "cerca".

---

### HU-C03 — Privacidad del recorrido

**Como** cualquier usuario
**Quiero** que la posición del repartidor no sea pública
**Para** proteger el recorrido y al repartidor

**Criterios de aceptación**

- RLS de `delivery_locations`: SELECT solo para el `customer_user_id` del pedido, un miembro `active` del negocio o el admin de plataforma.
- INSERT/UPDATE/DELETE para `authenticated` → denegado (escritura SOLO `service_role` vía server action).
- Los eventos realtime respetan RLS: un tercero no recibe posiciones ajenas.
- Al `delivered`, las posiciones del pedido se eliminan (datos sensibles del recorrido no quedan persistidos).

---

## Notas de producto

- La frecuencia de guardado (~10 s) es un equilibrio: suficiente para tracking humano, sin saturar Realtime ni el storage.
- El consentimiento al GPS es **implícito** al tocar "Iniciar reparto", con aviso en el flujo si no hay permiso.