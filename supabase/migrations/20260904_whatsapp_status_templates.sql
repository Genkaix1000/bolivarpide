-- WhatsApp order-status templates — per-business config
-- v1: business_whatsapp extensions + backfill defaults
--
-- Meta requires an approved template to message a customer OUTSIDE the 24h
-- customer-service window. Each connected business owns its WABA, so the
-- template name/language and the enable flag live on business_whatsapp.

ALTER TABLE public.business_whatsapp
  ADD COLUMN IF NOT EXISTS notify_status boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_order_status_name text,
  ADD COLUMN IF NOT EXISTS template_order_status_language text NOT NULL DEFAULT 'es_AR';

COMMENT ON COLUMN public.business_whatsapp.notify_status
  IS 'Send order-status updates to WhatsApp customers (fallback to template outside 24h window)';
COMMENT ON COLUMN public.business_whatsapp.template_order_status_name
  IS 'Approved Meta template name for order status (e.g. shipping_update)';
COMMENT ON COLUMN public.business_whatsapp.template_order_status_language
  IS 'Template language code (e.g. es_AR)';