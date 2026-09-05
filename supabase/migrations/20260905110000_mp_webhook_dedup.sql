-- Webhook MP: dedupe por evento (no solo x-request-id) y trazabilidad por comercio.
-- Los reintentos de Mercado Pago llegan con nuevo x-request-id pero el MISMO
-- data.id + type; el unique index evita que se re-ejecute el handler (y con él,
-- markOrderPaid que hoy no tiene predicado y puede re-flipear un pedido).

ALTER TABLE public.mp_webhook_events
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Limpiar duplicados previos (mantener el más reciente) antes del unique index.
DELETE FROM public.mp_webhook_events a
USING public.mp_webhook_events b
WHERE a.event_type = b.event_type
  AND a.data_id = b.data_id
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mp_webhook_events_event
  ON public.mp_webhook_events (event_type, data_id);