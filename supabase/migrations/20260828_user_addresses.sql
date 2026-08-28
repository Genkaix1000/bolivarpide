CREATE TABLE IF NOT EXISTS public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  street text NOT NULL,
  street_number text,
  no_number boolean NOT NULL DEFAULT false,
  delivery_notes text NOT NULL DEFAULT '',
  contact_first_name text NOT NULL DEFAULT '',
  contact_last_name text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT 'San Carlos de Bolívar',
  province text NOT NULL DEFAULT 'Buenos Aires',
  postal_code text NOT NULL DEFAULT '6550',
  lat double precision,
  lng double precision,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_addresses_user_id_idx ON public.user_addresses (user_id);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own addresses"
  ON public.user_addresses FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own addresses"
  ON public.user_addresses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own addresses"
  ON public.user_addresses FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own addresses"
  ON public.user_addresses FOR DELETE TO authenticated
  USING (user_id = auth.uid());
