-- Fase 1 — Visibilidad de los envíos fallidos.
--
-- Hasta ahora un envío que Meta rechazaba (token vencido, fuera de la ventana
-- de 24 h, número inválido) no dejaba rastro: la action devolvía el error a un
-- toast y el mensaje simplemente no aparecía en el chat. Peor: los `failed`
-- que llegan por webhook pisaban la fila sin guardar el motivo, así que el
-- negocio veía un tilde de "enviado" en un mensaje que nunca llegó.
--
-- `wa_message_id` es nullable (y UNIQUE tolera múltiples NULL en Postgres),
-- así que un outbound fallido se persiste sin id de Meta.
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS error_code integer,
  ADD COLUMN IF NOT EXISTS error_title text,
  ADD COLUMN IF NOT EXISTS error_details text;

COMMENT ON COLUMN public.whatsapp_messages.error_code
  IS 'Código de error de Meta (p. ej. 131047 fuera de ventana, 190 token vencido)';
COMMENT ON COLUMN public.whatsapp_messages.error_title
  IS 'Motivo corto del fallo, mostrado en el chat del panel';
COMMENT ON COLUMN public.whatsapp_messages.error_details
  IS 'Detalle largo de Meta (error_data.details) para diagnóstico';
