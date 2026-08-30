# TDD 02 — Base de datos y Realtime

## Migración propuesta

Archivo: `supabase/migrations/20260830_order_lifecycle.sql`

### 1. Ampliar CHECK de status

```sql
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'preparing', 'delivering', 'delivered', 'rejected',
    -- legacy (no insertar desde UI nueva)
    'accepted', 'ready', 'cancelled'
  ));
```

### 2. Columnas nuevas

```sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number serial,  -- ver nota abajo
  ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'delivery'
    CHECK (fulfillment_type IN ('delivery', 'pickup')),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS delivery_pin_hash text,
  ADD COLUMN IF NOT EXISTS pin_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS refund_pending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
```

**Nota `order_number`:** secuencial **por negocio**, no global. Implementar con:

```sql
-- Opción lazy: columna + trigger por business_id
CREATE TABLE IF NOT EXISTS public.business_order_counters (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id),
  last_number int NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.next_order_number(p_business_id uuid)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  UPDATE business_order_counters
  SET last_number = last_number + 1
  WHERE business_id = p_business_id
  RETURNING last_number INTO n;
  IF NOT FOUND THEN
    INSERT INTO business_order_counters VALUES (p_business_id, 1) RETURNING last_number INTO n;
  END IF;
  RETURN n;
END;
$$;
```

Invocar desde `createCheckout` al insertar orden.

### 3. Migrar datos existentes

```sql
-- delivering no existía: preparing con items listos quedan preparing
-- cancelled operativos → rejected sin motivo (backfill)
UPDATE public.orders
SET status = 'rejected', rejected_at = updated_at
WHERE status = 'cancelled'
  AND payment_status = 'paid';

-- accepted / ready → preparing (colapsar pipeline viejo)
UPDATE public.orders
SET status = 'preparing'
WHERE status IN ('accepted', 'ready')
  AND status NOT IN ('delivered', 'cancelled', 'rejected');
```

### 4. Índices

```sql
CREATE INDEX IF NOT EXISTS idx_orders_business_status
  ON public.orders (business_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_active
  ON public.orders (customer_user_id, status)
  WHERE status NOT IN ('delivered', 'rejected', 'cancelled');
```

---

## Realtime

### Publicación

Verificar que `orders` esté en la publicación `supabase_realtime`:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
```

(Si ya está, no-op.)

### Columnas expuestas

Realtime envía la fila completa. **Nunca** incluir `delivery_pin_hash` en selects cliente — usar vista o select explícito.

### Payload cliente vs comercio

| Campo | Comercio | Cliente |
|-------|----------|---------|
| `status` | ✓ | ✓ |
| `delivery_pin_hash` | ✓ (solo validar) | ✗ |
| PIN plaintext | ✗ | ✓ via API autenticada al entrar `delivering` |

El PIN se expone **una vez** en `GET /api/orders/[id]/tracking` cuando `status = delivering`, no via Realtime.

---

## RLS

Políticas existentes en `orders` — extender:

```sql
-- Cliente lee su propio pedido (tracking)
CREATE POLICY orders_customer_select ON public.orders
  FOR SELECT TO authenticated
  USING (customer_user_id = auth.uid());

-- Comercio actualiza status (miembros activos)
CREATE POLICY orders_business_update ON public.orders
  FOR UPDATE TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
```

Validación de transiciones **siempre en server action** (service role o RPC), no confiar solo en RLS.

---

## RPC opcional (ponytail: solo si hace falta atomicidad)

```sql
CREATE OR REPLACE FUNCTION public.advance_order_status(
  p_order_id uuid,
  p_business_id uuid,
  p_target text,
  p_rejection_reason text DEFAULT NULL
) RETURNS jsonb ...
```

Empezar con server action + update condicional; RPC si aparecen race conditions en Realtime.

---

## order_items — sin cambios v1

Los ítems ya tienen `name`, `quantity`, `unit_price_cents`. Agregar `note` si no existe:

```sql
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS note text;
```

Checkout ya envía `note` en lines — persistir en insert.

---

## Webhook MP — sin cambios

Al recibir pago aprobado:

```
payment_status = 'paid', paid_at = now()
```

Eso dispara Realtime → alerta comercio. No auto-avanzar a `preparing` (el local decide).

---

## Diagrama ER (campos nuevos)

```
orders
├── order_number          int
├── fulfillment_type      delivery | pickup
├── rejection_reason      text?
├── delivery_pin_hash     text?
├── pin_attempts          int
├── pin_locked_until      timestamptz?
├── refund_pending        bool
├── accepted_at           timestamptz?
├── dispatched_at         timestamptz?
├── delivered_at          timestamptz?
└── rejected_at           timestamptz?

business_order_counters
├── business_id           PK
└── last_number           int
```
