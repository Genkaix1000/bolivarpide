-- Cupones por comercio (pre-checkout)
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  code text NOT NULL,
  type text NOT NULL CHECK (type IN ('percent', 'fixed')),
  value numeric(12, 2) NOT NULL CHECK (value >= 0),
  min_order_cents int NOT NULL DEFAULT 0 CHECK (min_order_cents >= 0),
  max_uses int,
  uses_count int NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.coupons TO service_role;
REVOKE ALL ON public.coupons FROM anon, authenticated;
