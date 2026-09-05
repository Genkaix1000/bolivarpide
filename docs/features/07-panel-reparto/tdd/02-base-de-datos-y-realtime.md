# TDD 02 — Base de datos y Realtime

## Migración propuesta

Archivo: `supabase/migrations/20260906_delivery_assignment.sql`

### 1. Columnas nuevas en `orders`

```sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

COMMENT ON COLUMN public.orders.delivery_driver_id IS
  'Repartidor asignado a la entrega (null = disponible para tomar).';
COMMENT ON COLUMN public.orders.assigned_at IS
  'Momento de asignación/toma del repartidor.';
```

### 2. Índice

```sql
CREATE INDEX IF NOT EXISTS idx_orders_delivery_driver
  ON public.orders (delivery_driver_id)
  WHERE status IN ('preparing', 'delivering');
```

Cubre las consultas del board por driver (En camino / Por salir). La consulta de Disponibles y de cola ya se apoyan en `idx_orders_business_status` (`business_id, status, created_at DESC`).

### 3. Sin cambios en RLS ni en el RPC

- El UPDATE de `orders` sigue **revocado** para `authenticated`: la asignación se escribe solo por `service_role` desde server actions (`requireBusinessAccess` + check de rol en JS).
- `transition_order_status` **no se toca**: las transiciones de estado (incluida la generación/validación del PIN) siguen siendo su responsabilidad exclusiva.
- No hay política RLS nueva para `delivery_driver_id` porque las lecturas del panel van por service client tras authz (`listKitchenOrders` es el precedente).

### 4. Cleanup de asignaciones (backfill)

Backfill idempotente: limpia asignaciones de órdenes que ya no están en reparto activo (consistencia inicial con estados legacy `delivered`, `cancelled`, `rejected`).

```sql
UPDATE public.orders
SET delivery_driver_id = NULL, assigned_at = NULL
WHERE status IN ('delivered', 'rejected', 'cancelled')
  AND delivery_driver_id IS NOT NULL;
```

(No aplica a filas nuevas: `delivered` conserva el driver como histórico; este backfill es solo para datos preexistentes sin valor.)

## Realtime

### Publicación

Sin cambios: `orders` ya está en `supabase_realtime`.

### Canales y filtros

| Superficie | Canal | Filtro | Evento |
|------------|-------|--------|--------|
| Comandera (existente) | `comandera-${businessId}` | `business_id=eq.X` | `*` |
| Topbar (existente) | `order-alerts-${businessId}` | `business_id=eq.X` | `*` |
| **DriverBoard (nuevo)** | `reparto-${businessId}` | `business_id=eq.X` | `*` |
| **DispatchView (nuevo)** | `reparto-${businessId}` | `business_id=eq.X` | `*` |

El payload del evento incluirá `delivery_driver_id` (columna de la fila). No es dato sensible (solo UUID de usuario miembro); los clientes ya autentican por rol antes de suscribirse.

Los boards **re-fetchean** el listado completo ante cualquier evento (no hacen merge de payload): el mismo approach de `ComanderaBoard` evita estado desincronizado (asignaciones, takes y PIN comparten el mismo channel).

## RLS

No se agregan políticas. Resumen de la postura existente que se respeta:

```
orders
├── SELECT cliente          customer_user_id = auth.uid()        (tracking)
├── SELECT negocio          miembro activo / RPC                 (vía service client)
├── SELECT anónimo          ✗
└── UPDATE                  REVOCADO a authenticated
                             → solo transition_order_status (RPC)
                             → o service_role (checkout, webhook, asignaciones)
```

## Diagrama ER (campos nuevos)

```
orders
├── delivery_driver_id      uuid? → auth.users(id) ON DELETE SET NULL
├── assigned_at             timestamptz?

idx_orders_delivery_driver  (delivery_driver_id) WHERE status IN ('preparing','delivering')

business_members            (sin cambios — el driver es el rol existente)
└── role IN ('owner','staff','driver')
```

## Notificaciones (push al repartidor)

Sin migración nueva: se inserta una fila en `notifications` con el `user_id` del driver y el trigger `trg_notification_push` dispara el Web Push vía edge `send-push` (chequea `notification_orders` del perfil, envía a todos los `push_subscriptions` del usuario).

```
assignOrderToDriver
  └─ insertNotification({ userId: driverId, category: "orders", ... })
       └─ trigger → net.http_post → send-push → Web Push
```

Verificación de deduplicación: `dedupeKey: "delivery-assign-${orderId}"` con `upsert ... ignoreDuplicates` evita doble notificación si se reasigna dos veces al mismo pedido (por ejemplo, quitar y reasignar no repite).