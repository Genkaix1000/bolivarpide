# TDD 03 — Plan de pruebas

Archivos de check runnable (patrón ponytail, sin framework):

| Archivo | Cubre |
|---------|-------|
| `src/lib/delivery/queries.check.ts` | Mapeo de filas, filtros del board, race de toma, cleanup |
| `src/lib/delivery/rules.check.ts` | Permisos de gestión, bloqueo de asignación (pickup/estados) |
| `src/lib/orders/deliveryPin.check.ts` (existente) | Generación, verify, lock (regresión) |
| `src/lib/orders/lifecycle.check.ts` (existente) | Transiciones (regresión, driver ya soportado) |

Ejecutar: `pnpm test` (corre todos los `*.check.ts`).

---

## Matriz — permisos de asignación

| Acción | owner | staff | driver | Esperado |
|--------|:-----:|:-----:|:------:|----------|
| `assignOrderToDriver` | ✓ | ✓ | ✗ | driver → `{ ok:false, error:"Sin permiso" }` |
| `unassignOrder` | ✓ | ✓ | ✗ | driver → `{ ok:false, error:"Sin permiso" }` |
| `claimDeliveryOrder` | ✗ | ✗ | ✓ | owner/staff → `{ ok:false, error:"Sin permiso" }` |
| `advanceOrderStatus` (driver, delivered+PIN) | ✓ | ✓ | ✓ | permitido (RPC valida) |

---

## Matriz — toma de pedido (claim)

| Escenario | Condición previa | Resultado |
|-----------|------------------|-----------|
| Toma libre ok | `delivering`, `delivery_driver_id IS NULL` | ✓ `delivery_driver_id = yo`, `assigned_at` seteado |
| Ya tomado por otro | `delivering`, `delivery_driver_id = otro` | ✗ no pisa (update devuelve 0 filas) |
| Pedido cambió de estado | `delivering` → `delivered` entre leer y tomar | ✗ update condicional no aplica |
| Pedido no es del negocio | `business_id` distinto | ✗ (filtro business_id) |
| Doble click simultáneo | dos drivers, mismo pedido | solo 1 gana |

---

## Matriz — driver board (filtros de `listDriverDeliveries`)

| Fila (order) | Tab esperado | Notas |
|--------------|--------------|-------|
| `delivering`, `driver_id = yo` | En camino | CTA Entregado → PIN |
| `delivering`, `driver_id = yo`, `pickup` | **ninguno** | pickup nunca entra a reparto |
| `delivering`, `driver_id = null` | Disponibles | CTA Tomar pedido |
| `preparing`, `driver_id = yo` | Por salir | pre-asignado |
| `preparing`, `driver_id = null` | **ninguno** (driver) | solo en DispatchView |
| `delivered`, `driver_id = yo`, ≤ 24 h | Historial | sin CTA |
| `rejected`, `driver_id = yo`, ≤ 24 h | Historial | motivo visible |
| `delivered`, `driver_id = otro` | **ninguno** | no es mío |

---

## Matriz — dispatch queue (owner/staff)

| Escenario | Esperado |
|-----------|----------|
| `preparing` sin dueño | En cocina, control de asignación disponible |
| `preparing` con dueño | En cocina, muestra driver asignado |
| `delivering` con dueño | En reparto, Reasignar/Quitar |
| `delivering` sin dueño | En reparto, "sin asignar" + Asignar |
| Drivers activos | Contados solo `role='driver' status='active'` |
| Owner/staff con 0 drivers | Cola funcional sin asignaciones (sin fricción) |

---

## Matriz — notificación push al repartidor

| Acción | Notificación esperada | dedupeKey |
|--------|------------------------|-----------|
| Asignar #X a Joaquín | "Nuevo pedido asignado" (Joaquín) | `delivery-assign-<id>` |
| Quitar y reasignar #X a Joaquín | 1 solo push (dedupe) | `delivery-assign-<id>` |
| Tomar propio | sin push | — |
| Reasignar #X de Joaquín a Lucía | push a Lucía; aviso a Joaquín | distintos (Joaquín `delivery-unassign-<id>`) |

---

## Matriz — UI (smoke / snapshot manual)

### DeliveryOrderCard

| Estado | Render |
|--------|--------|
| En camino | Dirección, contacto, ítems, CTA "Entregado" (PIN) |
| Disponible | CTA "Tomar pedido", sin input PIN |
| Por salir | Badge "se está preparando", sin CTA de entrega |
| Historial entregado | Atenuado, sin CTA |
| Historial rechazado | Motivo visible en rojo suave |
| Cash | Badge 💵 Efectivo (sin cobro: ya marcado paid en `preparing`) |

### DriverBoard

| Tab | Contenido |
|-----|-----------|
| En camino | Solo `delivering` propios |
| Disponibles | Solo `delivering` sin dueño |
| Por salir | Solo `preparing` propios |
| Historial | Solapas recientes |

### DispatchView

| Sección | Contenido |
|---------|-----------|
| En cocina | `preparing` con/o sin asignación |
| En reparto | `delivering` con repartidor actual |
| Repartidores | Drivers activos + contador de en ruta |

### Sidebar role-gated

| Rol | Items visibles |
|-----|----------------|
| owner / staff | Dashboard · Pedidos · Reparto · WhatsApp · Carta · Configuración |
| driver | Reparto · Mis locales · Ir al inicio (**sin** Configuración/pedidos/carta) |

---

## Matriz — Realtime

| Evento en `orders` (channel `reparto-${id}`) | DriverBoard | DispatchView |
|----------------------------------------------|-------------|--------------|
| INSERT `delivering` sin dueño | aparece en Disponibles | aparece en En reparto |
| `delivery_driver_id` → yo (asignación) | En camino (desde own board) | muestra driver |
| take de otro driver | desaparece de Disponibles | muestra dueño |
| `delivered` | pasa a Historial | pasa a historial/desaparece |
| `delivering` → `preparing` (revert) | sale de En camino (+ limpieza asignación) | vuelve a En cocina |

---

## Casos E2E manuales (checklist QA)

### Flujo feliz con asignación

1. Owner invita "Joaquín" como repartidor → Joaquín acepta en el hub.
2. Joaquín entra al negocio → **ve solo Reparto** en el sidebar.
3. Cliente pide, paga, `pending`.
4. Owner: A cocina → `preparing`.
5. Owner en Reparto: asigna #1043 a Joaquín → push a Joaquín.
6. Joaquín: "Por salir" muestra #1043 → owner despacha → `delivering` → "En camino".
7. Joaquín entrega → ingresa PIN del cliente → `delivered`.
8. Cliente ve stepper completo; comandera refleja entregado.

### Flujo libre (sin asignación)

1. Owner despacha sin elegir → `delivering` sin dueño.
2. Joaquín ve #1048 en "Disponibles" → toma.
3. Toma concurrente: segundo intento falla, lista se refresca (pertenece a Joaquín).
4. Entrega con PIN → `delivered`.

### Reversión / limpieza

1. Pedido asignado en `delivering` → owner revierte a `preparing` → la asignación se limpia.
2. El pedido deja de aparecer en "En camino" del driver.
3. Regresión: PIN incorrecto x5 → lock 15 min (server-side, inmutable por la UI).

### Regresiones que deben quedar intactas

- Comandera y confirmación PIN por owner/staff (sin drivers registrados).
- Cancelación cliente pre-pago (`cancelled`, sin alerta).
- Realtime de la comandera y topbar siguen funcionando con la columna nueva.

---

## Cobertura mínima v1

| Área | Tests auto | QA manual |
|------|------------|-----------|
| Permisos asignación | ✓ rules.check | ✓ |
| Race de toma | ✓ condicional (semántica) | ✓ doble pestaña |
| Filtros board | ✓ queries.check | ✓ |
| PIN / lifecycle | ✓ (existente, regresión) | ✓ |
| Push driver | — (integración trigger) | ✓ 2 dispositivos |
| Sidebar por rol | — | ✓ visual |
| UI tarjetas | — | ✓ visual |