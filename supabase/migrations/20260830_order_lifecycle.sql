-- Order lifecycle: delivering/rejected, PIN, timestamps, order_number per business

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'preparing', 'delivering', 'delivered', 'rejected',
    'accepted', 'ready', 'cancelled'
  ));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number int,
  ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'delivery'
    CHECK (fulfillment_type IN ('delivery', 'pickup')),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS delivery_pin text,
  ADD COLUMN IF NOT EXISTS pin_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS refund_pending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS note text;

CREATE TABLE IF NOT EXISTS public.business_order_counters (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  last_number int NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.next_order_number(p_business_id uuid)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  INSERT INTO public.business_order_counters (business_id, last_number)
  VALUES (p_business_id, 1)
  ON CONFLICT (business_id) DO UPDATE
  SET last_number = business_order_counters.last_number + 1
  RETURNING last_number INTO n;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.orders_set_order_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := public.next_order_number(NEW.business_id);
  END IF;
  IF NEW.delivery_address IS NOT NULL AND NEW.delivery_address <> '' THEN
    NEW.fulfillment_type := 'delivery';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_order_number ON public.orders;
CREATE TRIGGER trg_orders_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_set_order_number();

-- Backfill order numbers for existing rows (best-effort per business by created_at)
DO $$
DECLARE r record; n int;
BEGIN
  FOR r IN
    SELECT id, business_id FROM public.orders WHERE order_number IS NULL ORDER BY created_at
  LOOP
    n := public.next_order_number(r.business_id);
    UPDATE public.orders SET order_number = n WHERE id = r.id;
  END LOOP;
END;
$$;

UPDATE public.orders SET status = 'rejected', rejected_at = updated_at
WHERE status = 'cancelled' AND payment_status = 'paid';

UPDATE public.orders SET status = 'preparing'
WHERE status IN ('accepted', 'ready');

-- Realtime (no-op if already published)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END;
$$;
