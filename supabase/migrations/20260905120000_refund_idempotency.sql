-- Refund idempotente: trazabilidad del refund MP y soporte de la reserva condicional.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_mp_id text;