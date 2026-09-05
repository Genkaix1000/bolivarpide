-- Mercado Pago: OAuth por comercio, store, POS, sesiones de pago QR.
-- Spec: docs/specs/payments-qr-mp.md

CREATE TABLE IF NOT EXISTS public.oauth_states (
  state         text PRIMARY KEY,
  code_verifier text NOT NULL,
  business_id   uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  redirect_url  text,
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.consume_oauth_state(p_state text)
RETURNS TABLE(code_verifier text, business_id uuid, redirect_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  DELETE FROM public.oauth_states
  WHERE oauth_states.state = p_state AND oauth_states.expires_at > now()
  RETURNING oauth_states.code_verifier, oauth_states.business_id, oauth_states.redirect_url;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_oauth_state(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_oauth_state(text) TO service_role;

CREATE TABLE IF NOT EXISTS public.mp_merchant_connections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  mp_user_id        text NOT NULL,
  access_token_enc  text,
  refresh_token_enc text,
  key_version       int NOT NULL DEFAULT 1,
  expires_at        timestamptz,
  nickname          text,
  display_name      text,
  email             text,
  status            text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked')),
  linked_at         timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mp_user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_mp_connections_mp_user ON public.mp_merchant_connections(mp_user_id);

CREATE TABLE IF NOT EXISTS public.mp_stores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  connection_id     uuid NOT NULL REFERENCES public.mp_merchant_connections(id) ON DELETE CASCADE,
  mp_store_id       text NOT NULL,
  external_store_id text NOT NULL,
  name              text NOT NULL,
  location          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mp_pos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id          uuid NOT NULL REFERENCES public.mp_stores(id) ON DELETE CASCADE,
  connection_id     uuid NOT NULL REFERENCES public.mp_merchant_connections(id) ON DELETE CASCADE,
  mp_pos_id         text NOT NULL,
  external_pos_id   text NOT NULL,
  operating_mode    text NOT NULL DEFAULT 'pdv',
  qr_static_image   text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, external_pos_id)
);

CREATE TABLE IF NOT EXISTS public.payment_sessions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id               uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  business_id            uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  channel                text NOT NULL DEFAULT 'qr_dynamic'
    CHECK (channel IN ('qr_dynamic', 'checkout_pro', 'cash')),
  mp_order_id            text,
  external_reference     text NOT NULL,
  idempotency_key        text NOT NULL UNIQUE,
  payment_transaction_id text,
  payment_id             text,
  amount_cents           int NOT NULL CHECK (amount_cents >= 0),
  qr_data                text,
  status                 text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'processed', 'expired', 'canceled', 'failed')),
  expires_at             timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_sessions_order ON public.payment_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_mp_order ON public.payment_sessions(mp_order_id);

CREATE TABLE IF NOT EXISTS public.mp_webhook_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  x_request_id  text NOT NULL,
  data_id       text NOT NULL,
  event_type    text NOT NULL,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed     boolean NOT NULL DEFAULT false,
  attempts      int NOT NULL DEFAULT 0,
  last_error    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (x_request_id)
);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text
    CHECK (payment_method IS NULL OR payment_method IN ('mercadopago_qr', 'cash')),
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'awaiting_payment', 'paid', 'expired', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS active_payment_session_id uuid REFERENCES public.payment_sessions(id),
  ADD COLUMN IF NOT EXISTS coupon_id uuid,
  ADD COLUMN IF NOT EXISTS subtotal_cents int,
  ADD COLUMN IF NOT EXISTS mp_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS mp_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_cash boolean NOT NULL DEFAULT true;

-- Backend-only tables
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mp_merchant_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mp_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mp_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mp_webhook_events ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.oauth_states TO service_role;
GRANT ALL ON public.mp_merchant_connections TO service_role;
GRANT ALL ON public.mp_stores TO service_role;
GRANT ALL ON public.mp_pos TO service_role;
GRANT ALL ON public.payment_sessions TO service_role;
GRANT ALL ON public.mp_webhook_events TO service_role;

REVOKE ALL ON public.oauth_states FROM anon, authenticated;
REVOKE ALL ON public.mp_merchant_connections FROM anon, authenticated;
REVOKE ALL ON public.mp_stores FROM anon, authenticated;
REVOKE ALL ON public.mp_pos FROM anon, authenticated;
REVOKE ALL ON public.payment_sessions FROM anon, authenticated;
REVOKE ALL ON public.mp_webhook_events FROM anon, authenticated;
