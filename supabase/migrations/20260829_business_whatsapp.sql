-- WhatsApp Business integration (n8n) — tables, Vault, RPC
-- v1: business_whatsapp + whatsapp_sessions + orders extensions + create_order

CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Connection registry: maps a WhatsApp phone number to a BolivarPide business.
-- One business = one WhatsApp number (per-business number model).
CREATE TABLE IF NOT EXISTS public.business_whatsapp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  phone_number_id text UNIQUE NOT NULL,
  display_phone_number text,
  waba_id text,
  status text NOT NULL DEFAULT 'unverified'
    CHECK (status IN ('unverified', 'connected', 'error')),
  vault_token_ref uuid,               -- vault.secrets id holding the Meta access token
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_whatsapp_status
  ON public.business_whatsapp(status);

-- WhatsApp chat session state (per business + chat), persisted so the bot
-- cart/dialog survives n8n restarts.
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  chat_id text NOT NULL,               -- WhatsApp "from" (e.g. 54911XXXXXXXX)
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, chat_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_chat
  ON public.whatsapp_sessions(chat_id);

-- orders extensions for WhatsApp-originated orders (clients without an account)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'web'
    CHECK (source IN ('web', 'whatsapp')),
  ADD COLUMN IF NOT EXISTS wa_chat_id text,
  ADD COLUMN IF NOT EXISTS delivery_address text;

-- Updated_at triggers (match repo convention: separate function per table)
CREATE OR REPLACE FUNCTION public.touch_business_whatsapp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_whatsapp_session()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_business_whatsapp_updated ON public.business_whatsapp;
CREATE TRIGGER touch_business_whatsapp_updated
  BEFORE UPDATE ON public.business_whatsapp
  FOR EACH ROW EXECUTE FUNCTION public.touch_business_whatsapp();

DROP TRIGGER IF EXISTS touch_whatsapp_session_updated ON public.whatsapp_sessions;
CREATE TRIGGER touch_whatsapp_session_updated
  BEFORE UPDATE ON public.whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_whatsapp_session();

-- create_order: transactional insert of orders + order_items.
-- Called from /api/webhooks/whatsapp (service_role) with validated payload.
-- source: 'web' | 'whatsapp'; customer_user_id is null for WhatsApp walk-ins.
CREATE OR REPLACE FUNCTION public.create_order(
  p_business_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_source text DEFAULT 'web',
  p_wa_chat_id text DEFAULT NULL,
  p_delivery_address text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_total_cents bigint := 0;
  v_item jsonb;
BEGIN
  IF p_business_id IS NULL THEN
    RAISE EXCEPTION 'business_id requerido';
  END IF;
  IF p_source NOT IN ('web', 'whatsapp') THEN
    RAISE EXCEPTION 'source invalido';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'items requeridos';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_total_cents := v_total_cents
      + COALESCE((v_item ->> 'quantity')::int, 1)
      * COALESCE((v_item ->> 'unit_price_cents')::bigint, 0);
    IF (v_item ->> 'name') IS NULL OR (v_item ->> 'name') = '' THEN
      RAISE EXCEPTION 'item sin nombre';
    END IF;
  END LOOP;

  INSERT INTO public.orders (
    business_id,
    customer_user_id,
    customer_name,
    customer_phone,
    status,
    total_cents,
    notes,
    source,
    wa_chat_id,
    delivery_address
  ) VALUES (
    p_business_id,
    NULL,
    p_customer_name,
    p_customer_phone,
    'pending',
    v_total_cents,
    p_notes,
    p_source,
    p_wa_chat_id,
    p_delivery_address
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      name,
      quantity,
      unit_price_cents
    ) VALUES (
      v_order_id,
      NULLIF(v_item ->> 'product_id', '')::uuid,
      v_item ->> 'name',
      (v_item ->> 'quantity')::int,
      (v_item ->> 'unit_price_cents')::int
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- Only authenticated clients or the service role may create orders.
REVOKE ALL ON FUNCTION public.create_order(uuid, text, text, text, text, text, text, jsonb)
  FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_order(uuid, text, text, text, text, text, text, jsonb)
  TO authenticated, service_role;