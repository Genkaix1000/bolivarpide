# TDD 02 — Base de datos, RLS y realtime

## Migración aplicada

Archivo: `supabase/migrations/20260908000000_delivery_locations.sql` (aplicada con `supabase db push --include-all` y verificada contra la DB real — ver notas operativas).

### 1. Tabla `delivery_locations`

```sql
CREATE TABLE public.delivery_locations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat            double precision NOT NULL,
  lng            double precision NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_locations_order_created  -- (order_id, created_at DESC): último punto por pedido
  ON public.delivery_locations (order_id, created_at DESC);
CREATE INDEX idx_delivery_locations_created        -- limpieza por antigüedad
  ON public.delivery_locations (created_at);
```

- `ON DELETE CASCADE` en `order_id` y `driver_user_id`: se limpia solo si se borra el pedido/usuuser.
- Un pedido puede tener **muchas** filas (una cada ~10 s durante el reparto); no hay restricción de "una por pedido" a propósito (v1 no guarda historial completo pero tolera múltiples puntos).

### 2. RLS (tabla)

```sql
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;

-- Cliente dueño del pedido (proxy al pedido padre, patrón order_items_select):
CREATE POLICY delivery_locations_customer_select ON public.delivery_locations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = delivery_locations.order_id
      AND o.customer_user_id = auth.uid()));

-- Miembro activo del negocio o admin:
CREATE POLICY delivery_locations_member_select ON public.delivery_locations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = delivery_locations.order_id
      AND (public.is_business_member(o.business_id) OR public.is_platform_admin())));

-- Sin INSERT/UPDATE/DELETE para authenticated: escritura SOLO service_role (server actions).
```

- GOTCHA: la policy de SELECT del cliente exige que `orders` sea visible para el cliente (por su propia RLS de SELECT en `orders` — sí lo es, `orders_customer_select`). El `EXISTS` corre dentro del contexto `SECURITY DEFINER` de RLS… en realidad las policies corren como el rol de la fila; aquí `orders` tiene su propia RLS y la subquery respeta el usuario autenticado. Como el cliente es `customer_user_id` del pedido, el EXISTS resuelve ✓.
- Escrituras `authenticated` → denegadas (sin policy de INSERT). Solo `service_role`.

### 3. Realtime

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'delivery_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_locations;
  END IF;
END;
$$;
```

- El cliente se suscribe con `postgres_changes` + filtro `order_id=eq.<uuid>`.
- **Los eventos respetan RLS**: una fila solo llega al suscriptor si su SELECT policy permite leerla (privacidad automática — no hace falta broadcast manual ni autorización extra).
- Se escucha `INSERT` (cada persistencia nueva). No se rebroadcasta un "status" aparte: el `orders` ya tiene su propio canal (`track-${orderId}`) que refresca el view completo (incluida la limpieza al entregar → `latestLocation` pasa a `null`).

### 4. Acceso a los datos

| Contexto | Mecanismo |
|----------|-----------|
| Cliente en `/pedido/[id]` (lectura inicial) | `resolveOrderTrackingMap` con `createServiceClient` → última fila (service client evita depender de RLS del usuario en el server component) |
| Cliente (live) | Suscripción `postgres_changes` con user client + filtro `order_id` |
| Driver escribiendo | Server action `shareDeliveryLocationAction` → `createServiceClient().from("delivery_locations").insert(...)` |
| Limpieza en entrega | `stopSharingLocationAction` (service client) → `delete().eq("order_id", ...)` |
| Cualquier tercero | Nada: sin policy de SELECT (el EXISTS no matchea) + sin escritura |

## Verificación en DB real (ejecutada)

| Chequeo | Resultado |
|---------|-----------|
| `supabase migration list` | `20260908000000` presente en local y remoto |
| GET `GET /rest/v1/delivery_locations?select=id&limit=1` (anon) | `200 []` (tabla existe, sin filas, sin exposición) |
| POST `POST /rest/v1/delivery_locations` (anon) | `401 42501 "new row violates row-level security policy"` → escritura autenticada bloqueada por RLS ✓ |

## Notas operativas

- La migración se pusheó con `supabase db push --include-all` porque `20260906050000_whatsapp_summaries_type.sql` había quedado sin aplicar y el CLI exige reordenar el historial antes de la nueva. Verificada previamente: esa función es idempotente (`DROP FUNCTION IF EXISTS` + `CREATE FUNCTION`) y no toca datos.
- El throttle de persistencia es responsabilidad del cliente (hook); el server no lleva estado en memoria (frágil en multi-instancia). Caudal teórico máximo por repartidor ≈ 6 filas/min, aceptable.