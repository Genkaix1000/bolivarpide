# TDD 02 — Base de datos, RLS y seguridad

## Migraciones aplicadas

Archivos aplicados con `supabase db push` y verificados contra la DB real:

| Migración | Contenido |
|-----------|-----------|
| `20260906000001_platform_roles.sql` | Renombrada (colisión de timestamp con `delivery_assignment`, también `20260906000000`) para poder insertarla en el historial; se aplicó junto a `product_likes` (pendiente histórica). |
| `20260909000000_customer_badges.sql` | RPC `grant_customer_badges` + REVOKE + índice `idx_orders_customer_delivered` |
| `20260909100000_repair_missing_objects.sql` | **Reparación heredada**: la DB remota no tenía físicamente `notifications`, `promo_banners`, `push_subscriptions`, `app_settings` ni `notify_push_after_insert`/trigger, aunque el historial las marcaba aplicadas. Se recrearon desde sus migraciones originales (con `'badges'` ya en el CHECK de `notifications`). |
| `20260909200000_user_profiles_column_grants.sql` | Reemplaza el REVOKE por columna (inefectivo) por REVOKE de tabla + GRANT por columna (ver gotcha en §2). |
| `20260909300000_fix_grant_badges_array.sql` | Fix de la RPC: `text[] || text` falla; se usa `array_append`. Detectado contra la DB real en el primer otorgamiento. |

> Las otras "tablas" que el diagnóstico inicial listaba como faltantes (`whatsapp_status_templates`,
> `whatsapp_message_errors`, `whatsapp_chat_summaries`) **no eran tablas**: eran columnas/función
> que sí estaban aplicadas (verificadas en `business_whatsapp`, `whatsapp_messages` y
> `public.whatsapp_chat_summaries`).

### 1. RPC `grant_customer_badges` (SECURITY DEFINER)

```sql
CREATE OR REPLACE FUNCTION public.grant_customer_badges(
  p_user_id uuid,
  p_badges jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current jsonb;
  v_existing_ids text[] := '{}'::text[];
  v_new_ids text[] := '{}'::text[];
  v_item jsonb;
  v_merge jsonb := '[]'::jsonb;
  v_new_count int := 0;
BEGIN
  -- UPSERT de la fila de perfil si todavía no existe
  INSERT INTO public.user_profiles (user_id, awarded_badges)
  VALUES (p_user_id, '[]'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock de fila: serializa evaluaciones concurrentes del mismo usuario
  SELECT awarded_badges INTO v_current
  FROM public.user_profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_current := COALESCE(v_current, '[]'::jsonb);
  SELECT COALESCE(array_agg(b->>'id'), '{}'::text[])
    INTO v_existing_ids
    FROM jsonb_array_elements(v_current) AS b;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_badges) LOOP
    IF NOT (v_item->>'id' = ANY (v_existing_ids)) THEN
      v_merge := v_merge || jsonb_build_array(v_item);
      v_new_ids := v_new_ids || v_item->>'id';
      v_new_count := v_new_count + 1;
    END IF;
  END LOOP;

  IF v_new_count > 0 THEN
    UPDATE public.user_profiles
       SET awarded_badges = v_current || v_merge,
           updated_at = now()
     WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'added', v_new_ids, 'count', v_new_count);
END;
$$;

REVOKE ALL ON FUNCTION public.grant_customer_badges(uuid, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.grant_customer_badges(uuid, jsonb) TO service_role;
```

- **Idempotencia por `id`**: badges repetidas se descartan; `added` expone solo las nuevas.
- **Concurrencia**: `FOR UPDATE` sobre la fila serializa appends simultáneos.
- **Seguridad**: solo `service_role` puede invocarla (escritura server-only garantizada).

### 2. Revocar escritura directa del cliente de la columna

```sql
REVOKE UPDATE ON public.user_profiles FROM anon, authenticated;

GRANT UPDATE (
  display_name, first_name, last_name, phone, avatar_type, avatar_value,
  avatar_gradient_id, primary_address, identity_verified, identity_verified_at,
  notification_orders, notification_promos, notification_whatsapp,
  preferred_payment_method, updated_at
) ON public.user_profiles TO authenticated;
```

- **GOTCHA (DB real)**: `REVOKE UPDATE (awarded_badges) ON ... FROM authenticated` (revoke por
  columna) **NO surte efecto real** cuando el rol hereda el privilegio del grant de TABLA
  (`relacl` `arwdDxtm` sobre `user_profiles`, algo típico en Supabase): PostgreSQL no crea un
  `attacl` negativo por columna en ese caso y `has_column_privilege(...)=true` se mantiene.
  La forma robusta es **revocar `UPDATE` a nivel de tabla** y **concederlo por columna** para
  las editables por el cliente (todas excepto `awarded_badges`). Así, el upsert de
  `saveUserProfileAction` sigue funcionando (incluye `updated_at` en el row) y `awarded_badges`
  queda excluido. Verificado con `has_column_privilege` sobre la DB real.
- `saveUserProfileAction` usa upsert con `onConflict: user_id`: el update solo toca las columnas
  del row, que ya no incluye `awarded_badges` (se quitó de `profileToRow`). El REVOKE anterior
  garantiza además que un cliente no pueda escribir esa columna de forma maliciosa.

### 3. CHECK de categoría de notificaciones (agrega `badges`)

```sql
ALTER TABLE public.notifications DROP CONSTRAINT notifications_category_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_category_check
  CHECK (category IN ('orders', 'payments', 'system', 'promos', 'badges'));
```

> Verificar el nombre real del constraint con `\d notifications` antes de aplicar
> (si el nombre difiere, usar el que reporte la DB; el CHECK línea 5 de
> `20260830211747_notifications.sql` es `category text NOT NULL CHECK (...)` con nombre
> autogenerado `notifications_category_check`).

### 4. Índices auxiliares (opcional pero útil para las queries de stats)

```sql
-- Pedidos entregados por usuario (COUNT/SUM con status fijo)
CREATE INDEX IF NOT EXISTS idx_orders_customer_delivered
  ON public.orders (customer_user_id) WHERE status = 'delivered';
```

- No se agregan tablas nuevas: la columna JSONB existente alcanza para v1.

## Acceso a los datos

| Contexto | Mecanismo |
|----------|-----------|
| Cliente leyendo su perfil (insignias) | `rowToProfile` → `user_profiles.awarded_badges` con user client (RLS own-profile) |
| Cliente escribiendo su perfil | Upsert SIN `awarded_badges` (grants por columna lo garantizan, ver §2) |
| Evaluador (stats) | `createServiceClient()` → `orders`, `user_addresses`, `product_likes`, `user_profiles` |
| Otorgar insignias | Server action `grantBadges` → RPC `grant_customer_badges` (service_role) |
| Notificación de desbloqueo | `insertNotification` con service client + dedupeKey |

## RLS — verificación en DB real (ejecutada)

| Chequeo | Resultado |
|---------|-----------|
| Tabla `notifications` recreada | ✓ (vacía, con CHECK `category IN (... 'badges')` y trigger `trg_notification_push`) |
| `has_column_privilege(authenticated, user_profiles, awarded_badges, UPDATE)` | `false` ✓ (tras REVOKE de tabla + GRANT por columna) |
| `has_column_privilege(authenticated, user_profiles, display_name, UPDATE)` | `true` ✓ |
| `has_column_privilege(service_role, user_profiles, awarded_badges, UPDATE)` | `true` ✓ |
| `select grant_customer_badges(...)` (anon) | `permission denied` (GRANT solo service_role) |
| RPC con badge nuevo | `{"ok":true,"added":["test-badge-a"],"count":1}` + fila persistida ✓ |
| RPC con badge repetido | `{"ok":true,"added":[],"count":0}` (dedupe idempotente ✓) |
| Índice `idx_orders_customer_delivered` | ✓ presente |

## Notas operativas

- **Fix de RPC detectado en el primer otorgamiento**: `v_new_ids := v_new_ids || v_item->>'id'`
  (sumar `text` a `text[]`) lanza `operator does not exist: text[] || jsonb`. Se corrigió con
  `array_append` en `20260909300000_fix_grant_badges_array.sql`.

- La migración es compatible con los datos existentes: `awarded_badges` ya está en todas las
  filas de `user_profiles`. Los badges heredados del seed decorativo se mantendrán; no se
  persiguen en este feature (no es daño: son ids que no colisionan con el catálogo real).
  Si se quiere empezar limpio: `UPDATE user_profiles SET awarded_badges = '[]'::jsonb;`
  en una corrida controlada (decisión del dueño, fuera del scope).
- El revoke no rompe el INSERT inicial de perfil (los perfiles se crean con el upsert y la
  columna tiene `DEFAULT '[]'`).
- La publicación realtime de `notifications` ya existe; la nueva categoría fluye por el mismo canal.