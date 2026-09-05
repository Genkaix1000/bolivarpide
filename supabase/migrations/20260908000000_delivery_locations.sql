-- Hito 02 — GPS real del repartidor → tracking en vivo.
-- Tabla delivery_locations: último punto conocido por pedido en reparto.
-- Estrategia service-only (mismo criterio que orders/delivery_profiles): las
-- escrituras se hacen SOLO desde server actions con service_role tras
-- requireBusinessAccess + check de que el driver está asignado al pedido.
-- La lectura se proxya a través del pedido padre (como order_items): el cliente
-- dueño del pedido, un miembro del negocio o el admin pueden leer las posiciones.

-- --------------------------------------------------------------------------
-- 1. Tabla delivery_locations
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.delivery_locations IS
  'Posición GPS compartida por el repartidor durante un reparto (últimos puntos).';
COMMENT ON COLUMN public.delivery_locations.order_id IS
  'Pedido en reparto al que corresponde la posición.';
COMMENT ON COLUMN public.delivery_locations.driver_user_id IS
  'Repartidor que compartió la posición.';
COMMENT ON COLUMN public.delivery_locations.lat IS
  'Latitud (WGS84).';
COMMENT ON COLUMN public.delivery_locations.lng IS
  'Longitud (WGS84).';

-- Lectura eficiente del último punto por pedido y limpieza por antigüedad.
CREATE INDEX IF NOT EXISTS idx_delivery_locations_order_created
  ON public.delivery_locations (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_locations_created
  ON public.delivery_locations (created_at);

-- --------------------------------------------------------------------------
-- 2. RLS: lectura proxy al pedido, escritura service-only.
-- --------------------------------------------------------------------------
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;

-- El cliente dueño del pedido lee las posiciones de su propio reparto.
CREATE POLICY "delivery_locations_customer_select"
  ON public.delivery_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = delivery_locations.order_id
        AND o.customer_user_id = auth.uid()
    )
  );

-- Un miembro del negocio o el admin de plataforma leen el reparto.
CREATE POLICY "delivery_locations_member_select"
  ON public.delivery_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = delivery_locations.order_id
        AND (public.is_business_member(o.business_id) OR public.is_platform_admin())
    )
  );

-- Sin INSERT/UPDATE/DELETE para authenticated: las posiciones se escriben por
-- service_role (server actions), igual que orders/pagos/delivery_profiles.

-- --------------------------------------------------------------------------
-- 3. Realtime (no-op si ya está publicada)
-- --------------------------------------------------------------------------
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
