-- REPARACIÓN DE CONSISTENCIA: la DB remota marcaba estas migraciones como
-- aplicadas en supabase_migrations.schema_migrations, pero las tablas no existían
-- físicamente (desfase heredado del entorno; se detectó al aplicar customer_badges,
-- que depende de notifications para el CHECK de categoría).
--
-- Recrea de forma idempotente los objetos que faltan, replicando el contenido de
-- las migraciones originales:
--   20260830211747_notifications.sql          (tabla + índices + RLS + realtime)
--   20260902000000_promo_banners.sql          (tabla + RLS + seed)
--   20260904100000_push_subscriptions.sql     (tabla + app_settings + función + trigger)
--
-- Se aplica UNA vez con supabase db push; todo es IF NOT EXISTS / idempotente.

-- =============================================================================
-- 1. notifications (migración original + CHECK ya contemplando 'badges')
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('orders', 'payments', 'system', 'promos', 'badges')),
  priority smallint NOT NULL DEFAULT 2 CHECK (priority BETWEEN 0 AND 2),
  title text NOT NULL,
  body text,
  emoji text,
  icon text,
  action_url text,
  entity_type text,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_list
  ON public.notifications (user_id, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id)
  WHERE read_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_idx
  ON public.notifications (user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS/grants al estado final esperado por security_rls (20260903000000):
-- SELECT por policy propia; el resto DML revocado a authenticated (solo service_role
-- y el trigger SECURITY DEFINER escriben).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='notifications_select') THEN
    EXECUTE 'CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (user_id = auth.uid())';
  END IF;
END;
$$;

GRANT SELECT ON public.notifications TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.notifications FROM anon, authenticated;

-- Realtime (el canal de la campana usa postgres_changes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;

-- =============================================================================
-- 2. promo_banners (migración original + seed)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL,
  badge text,
  cta_text text,
  cta_link text,
  image text NOT NULL,
  icon text NOT NULL DEFAULT 'local_offer',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public promo banners are viewable by everyone" ON public.promo_banners;
CREATE POLICY "Public promo banners are viewable by everyone"
  ON public.promo_banners
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access on promo_banners" ON public.promo_banners;
CREATE POLICY "Service role full access on promo_banners"
  ON public.promo_banners
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

INSERT INTO public.promo_banners (title, subtitle, badge, cta_text, cta_link, image, icon, sort_order, is_active)
VALUES
  (
    'Envíos gratis en Bolívar',
    'En locales adheridos en pedidos a partir de $4.000',
    'PROMO',
    'Pedir ahora',
    '#trending',
    'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1400&q=80',
    'local_shipping',
    1,
    true
  ),
  (
    'Burger Week en Bolívar',
    'Doble smash beef, cheddar ahumado derretido y panceta crocante',
    'HOT DEALS',
    'Pedir en Burger Boz',
    '/c/burgerboz',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1400&q=80',
    'lunch_dining',
    2,
    true
  ),
  (
    'Noche de Pizza a la Leña',
    'Masa madre crocante con muzzarella fior di latte artesanal',
    '2X1 MARTES Y JUEVES',
    'Pedir en Pizza Store',
    '/c/pizzastore',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80',
    'local_pizza',
    3,
    true
  ),
  (
    'Hora del almuerzo',
    'Hasta 25% OFF en menús ejecutivos y platos del día',
    '12 A 15 HS',
    'Ver empanadas',
    '/c/empanadas-bolivar',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=80',
    'lunch_dining',
    4,
    true
  ),
  (
    'Café de Especialidad & Bakery',
    'Cappuccinos cremosos, medialunas de manteca y croissants tibios',
    'DESAYUNOS & MERIENDAS',
    'Ver McCafé',
    '/c/mccafe',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=80',
    'local_cafe',
    5,
    true
  ),
  (
    'Sushi World Bolívar',
    'Combinados de salmón fresco, rolls tempura y wok oriental',
    'PREMIUM ROLLS',
    'Pedir Sushi',
    '/c/sushiworld',
    'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1400&q=80',
    'set_meal',
    6,
    true
  ),
  (
    'Helados Artesanales Dolce',
    'Potes de 1 Kg con cucuruchos de regalo directo a tu puerta',
    'POSTRES',
    'Pedir Helado',
    '/c/helados-dolce',
    'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=1400&q=80',
    'icecream',
    7,
    true
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 3. push_subscriptions + app_settings + trigger a Edge Function
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx
  ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_update_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_update_own" ON public.push_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO service_role;

-- Config del disparador (URL de la función y secret compartido).
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO service_role;

CREATE OR REPLACE FUNCTION public.notify_push_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text;
  webhook_secret text;
  anon_key text;
BEGIN
  SELECT value INTO fn_url FROM public.app_settings WHERE key = 'push_function_url';
  IF fn_url IS NULL OR fn_url = '' THEN
    RETURN NEW;
  END IF;

  SELECT value INTO webhook_secret FROM public.app_settings WHERE key = 'push_webhook_secret';
  SELECT value INTO anon_key FROM public.app_settings WHERE key = 'supabase_anon_key';

  PERFORM net.http_post(
    fn_url,
    jsonb_build_object(
      'user_id', NEW.user_id::text,
      'category', NEW.category,
      'title', NEW.title,
      'body', COALESCE(NEW.body, ''),
      'action_url', COALESCE(NEW.action_url, ''),
      'payload', COALESCE(NEW.payload, '{}'::jsonb)
    ),
    '{}'::jsonb,
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(anon_key, ''),
      'x-push-secret', COALESCE(webhook_secret, '')
    ),
    5000
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_push ON public.notifications;
CREATE TRIGGER trg_notification_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notify_push_after_insert();