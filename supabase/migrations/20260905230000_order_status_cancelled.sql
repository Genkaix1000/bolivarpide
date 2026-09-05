-- Estado máquina canónico: 6 estados (pending, preparing, delivering, delivered,
-- rejected, cancelled). Los valores legacy `accepted`/`ready` se consolidan en
-- `preparing`; `cancelled` pasa a ser un estado real (cliente cancela / QR falló
-- antes del pago), separado de `rejected` (comercio rechaza post-pago).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

UPDATE public.orders SET status = 'preparing'
WHERE status IN ('accepted', 'ready');

UPDATE public.orders
SET status = 'cancelled', cancelled_at = COALESCE(cancelled_at, updated_at)
WHERE status = 'cancelled' AND cancelled_at IS NULL;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','preparing','delivering','delivered','rejected','cancelled'));