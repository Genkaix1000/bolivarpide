# TDD 03 — Plan de pruebas

Archivos de check runnable (patrón ponytail):

| Archivo | Cubre |
|---------|-------|
| `src/lib/delivery/location.check.ts` | `shouldSaveLocation`, `isLocationFresh`, `isValidLatLng` |

Ejecutar: `pnpm test` (corre todos los `*.check.ts`).

---

## Matriz — `shouldSaveLocation`

| nowMs | lastSavedMs | window | Esperado |
|-------|-------------|--------|----------|
| 0 | `null` | 10 000 | ✓ true (primera vez) |
| 0 | 0 | 10 000 | ✗ false (recién guardado) |
| 9 999 | 0 | 10 000 | ✗ false (antes de la ventana) |
| 10 000 | 0 | 10 000 | ✓ true (en el límite) |
| 15 000 | 0 | 10 000 | ✓ true (pasada la ventana) |

## Matriz — `isLocationFresh`

| tsMs | nowMs | maxAgeMs | Esperado |
|------|-------|----------|----------|
| 0 | 20 000 | 20 000 | ✓ true (en el límite) |
| 0 | 20 001 | 20 000 | ✗ false (stale) |
| 1 000 | 1 000 | 20 000 | ✓ true (mismo instante) |

## Matriz — `isValidLatLng`

| lat | lng | Esperado |
|-----|-----|----------|
| 0 | 0 | ✓ true |
| -90 | -180 | ✓ true (mínimos) |
| 90 | 180 | ✓ true (máximos) |
| 90.1 | 0 | ✗ false |
| 0 | 180.5 | ✗ false |
| NaN | 0 | ✗ false |
| Infinity | 0 | ✗ false |
| 0 | NaN | ✗ false |

---

## Matriz — server actions (`shareDeliveryLocationAction`)

| Caso | Resultado esperado |
|------|--------------------|
| No autenticado | `requireBusinessAccess` falla |
| Rol ≠ driver (owner/staff) | `{ok:false, error:"Solo repartidores..."}` |
| Pedido ajeno (`delivery_driver_id ≠ user.id`) | `{ok:false, error:"El pedido no está asignado a vos"}` |
| Pedido no en `delivering` | `{ok:false, error:"Solo se comparte durante el reparto"}` |
| `fulfillment_type='pickup'` | `{ok:false, error:"Un retiro no comparte ubicación"}` |
| Coordenadas inválidas (`isValidLatLng` false) | `{ok:false, error:"Coordenadas inválidas"}` |
| Happy path | INSERT service_role OK → `{ok:true}` |

## Matriz — `stopSharingLocationAction`

| Caso | Resultado esperado |
|------|--------------------|
| Rol ≠ driver | `{ok:false, error:"Solo repartidores..."}` |
| Pedido ajeno | `{ok:false, error:"El pedido no está asignado a vos"}` |
| Happy path | DELETE del pedido OK → `{ok:true}` (idempotente: repetir → sigue `{ok:true}` y 0 filas) |

---

## Matriz — permisos y RLS

| Escenario | Esperado |
|-----------|----------|
| Cliente dueño lee posiciones de su pedido | ✓ (policy `customer_select`) |
| Cliente de OTRO pedido | 0 filas |
| Miembro `active` del negocio | ✓ (puede ver todos los repartos del negocio) |
| Admin de plataforma | ✓ |
| `authenticated` inserta/actualiza/borra | denegado (sin policy) — verificado: POST anon → `401 42501` |
| Evento realtime a tercero | no llega (RLS filtra el evento) |

---

## Matriz — cliente (`OrderTrackingMap`)

| Estado | Marker | Trazo activo |
|--------|--------|:------------:|
| `status='delivering'`, pos real reciente | real (`liveFresh`) | oculto |
| `status='delivering'`, sin pos / stale | fallback `pointOnPolyline(demoRouteProgress)` | visible |
| `status='pickup'` | sin courier (no hay destination) | — |
| `status='preparing'`/`pending` | sin courier | — |
| `delivered`/`rejected` | sin courier | — |

| Caso | Esperado |
|------|----------|
| Client abre a mitad de reparto | `latestLocation` inicial → marker real apenas monta |
| Driver deja de enviar > 20 s | marker vuelve a simulación |
| Nueva posición llega | `livePos`/`livePosTs` actualizados → marker salta a la posición real |
| `created_at` ausente en payload | `ts = Date.now()` (la posición cuenta como reciente) |

---

## Matriz — consola driver (`DeliveryOrderCard`)

| Estado del hook | Botón | Extra |
|-----------------|-------|-------|
| off | "Iniciar reparto (compartir GPS)" | — |
| on + sharing | "Compartiendo ubicación · Dejar de compartir" | — |
| on + !sharing (denied) | "GPS sin señal · Dejar de compartir" | aviso ámbar "Sin permiso de ubicación…" |
| on + !sharing (unavailable) | "GPS sin señal · Dejar de compartir" | aviso ámbar "GPS no disponible…" |

| Caso | Esperado |
|------|----------|
| Toggle off | `stop()` + `stopSharingLocationAction` + toast |
| Confirmar entrega | `PIN` → `advanceOrderStatus` → `stop()` + cleanup automático en server |
| Unmount de la tarjeta mientras comparte | timer limpiado (`useEffect(() => stop, [stop])`) |

---

## Casos E2E manuales (checklist QA)

1. **Dos dispositivos**: repartidor (consola, HTTPS, permisos GPS) y cliente (`/pedido/[id]`).
2. Driver: pedido `delivering` asignado → "Iniciar reparto" → acepta permiso → botón "Compartiendo ubicación".
3. Cliente: el marker se mueve siguiendo al repartidor (posiciones reales); el trazo activo simulado no aparece.
4. Kill del GPS del driver (o denegar permiso): cliente pasa a la simulación tras `LOCATION_MAX_AGE_MS`.
5. Driver "Dejar de compartir" → posición borrada; cliente vuelve a simulación.
6. Reapertura de `/pedido/[id]` a mitad de reparto → marker sobre la última posición persistida (no desde cero).
7. Entrega con PIN → mapa muestra "Entregado", se limpian posiciones (verificar `delivery_locations` del pedido = 0 filas).
8. Privacidad: un cliente con otro pedido no debe ver el marker real ni recibir eventos.
9. Regresión: `/negocio/[id]/reparto` (consola completa: tomar pedido, PIN, tabs) y `/pedido/[id]` sin cambios visuales en pickup.