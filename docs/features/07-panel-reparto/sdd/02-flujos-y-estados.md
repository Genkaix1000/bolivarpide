# SDD 02 — Flujos y estados

## Estado de reparto (ortogonal al lifecycle)

La máquina de estados de órdenes **no cambia** (`pending → preparing → delivering → delivered` + `rejected`/`cancelled`, endurecida en la fase de remediación). El reparto agrega una dimensión nueva encima:

```
Repartidor asignado:    ninguno ──asignar/tomar──▶ asignado ──delivered──▶ (se mantiene, histórico)
estado_orden:           delivering              delivering            delivered
```

| Estado de asignación | Regla de negocio |
|----------------------|------------------|
| **Sin dueño** | `delivery_driver_id IS NULL`. Visible en "Disponibles" de todos los drivers. Cualquier driver puede tomar. |
| **Asignado** | `delivery_driver_id = <driver>`. Visible solo en "En camino"/"Por salir" de ese driver. Solo owner/staff pueden reasignar/quitar. |
| **Entregado** | Al pasar a `delivered` el driver_id se mantiene como histórico (quién entregó). `status` terminal. |

### Cuándo se setea

- **Al despachar**: el operador elige repartidor al pasar `preparing → delivering` (opcional).
- **Pre-asignación**: owner/staff pueden asignar un pedido aún en `preparing` → el driver lo ve en "Por salir".
- **Toma libre**: el driver toma un `delivering` sin dueño (claim race-safe).

### Reglas de envejecimiento

- Asignación previa en `preparing` que nunca llega a `delivering`: la asignación **se mantiene** (el "Por salir" del driver sigue mostrándolo). Si el pedido se revierte o rechaza, la asignación se limpia (`CASE` en el UPDATE de la acción).
- `delivery_driver_id` se respeta en historial; para listar historial del driver se filtra por `delivery_driver_id = yo`.

## Claims (toma) — atomicidad

Dos drivers pueden intentar tomar el mismo pedido disponible. Fuera del RPC de estados, la toma se hace con **UPDATE condicional** vía `service_role` (mismo patrón que `rejectStaleOrder` en `acceptanceTimeout.ts`):

```ts
const { data } = await svc
  .from("orders")
  .update({ delivery_driver_id: userId, assigned_at: new Date().toISOString() })
  .eq("id", orderId)
  .eq("status", "delivering")
  .eq("delivery_driver_id", null)
  .select("id")
  .maybeSingle();

// data == null  → alguien más ganó (o el pedido cambió de estado) → no pisar
```

Solo un concurrente recibe fila; el que pierde refresca la lista. No hace falta RPC nuevo para la toma porque la condición cubre el race.

## Matriz de permisos por rol

| Acción | owner | staff | driver |
|--------|:-----:|:-----:|:------:|
| Ver comandera / pedidos | ✓ | ✓ | ✓ |
| Asignar / reasignar / quitar repartidor | ✓ | ✓ | ✗ |
| Tomar pedido disponible | ✗ | ✗ | ✓ |
| Avanzar estados (incl. `delivered`) | ✓ | ✓ | ✓ |
| Validar PIN de entrega | ✓ | ✓ | ✓ |
| Rechazar pedido | ✓ | ✓ | ✗* |
| Revertir estado | ✓ | ✓ | ✗* |
| Ver/editar Configuración | ✓ | ✓ | ✗ (UI role-gated) |

\* Ya bloqueado en `advanceOrderStatus`/`revertOrderStatus` y revalidado en el RPC `transition_order_status`.

## Flujo feliz (con asignación)

```
1. checkout → pending (paid / cash)
2. operador: A cocina → preparing
3. operador: A reparto → elige "Joaquín" → delivering + PIN + assigned Joaquín
4. push a Joaquín: "Nuevo pedido #1043 asignado"
5. Joaquín abre /reparto → tab "En camino" lo muestra
6. Joaquín entrega → ingresa PIN del cliente → delivered
7. Realtime: comandera y dispatch se actualizan; cliente ve stepper completo
```

## Flujo sin asignación (negocio sin equipo de reparto)

```
1..2. igual
3. operador: A reparto (sin elegir) → delivering + PIN, sin dueño
4. aparece en "Disponibles" para los drivers del negocio
5. (opción a) un driver toma → pasa a "En camino" de él (+ push opcional al negocio)
6. (opción b) nadie toma → el propio operador confirma el PIN desde la comandera (comportamiento actual)
```

## Casos borde

| Caso | Comportamiento esperado |
|------|-------------------------|
| Driver toma un pedido que justo fue asignado | Rechazo por condicional; no pisa al dueño |
| Pedido asignado que se revierte a `preparing` | Se limpia la asignación (driver_id = null) |
| Pedido asignado rechazado / cancelado | Se limpia la asignación |
| Driver sale del negocio (`left`) | Sus órdenes activas vuelven a "Disponibles"; `delivered` históricas conservan el `delivery_driver_id` (ver nota) |
| Driver confirma PIN de un pedido de otro | Permitido si es miembro activo (misma regla que hoy); la UI solo lo ofrece en los propios |
| Pickup | Nunca entra a reparto, se excluye en todas las consultas |

**Nota ON DELETE SET NULL:** si un driver es eliminado de `business_members` (no borra `auth.users`), sus órdenes asignadas quedan huérfanas. La acción "Quitar" del negocio cubre el caso; no se borra `auth.users` en el flujo normal.