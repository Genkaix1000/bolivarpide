-- Fase 0 — Reparación de los mensajes entrantes guardados con epoch 0.
--
-- Causa: `parseMessage` leía el `timestamp` del webhook con un guard
-- `typeof v === "number"`, pero Meta lo serializa como STRING
-- ("timestamp": "1757030400"). El valor caía a 0 y el webhook persistía
-- `created_at = 1970-01-01` en TODO mensaje inbound.
--
-- Efecto en runtime: la ventana de 24 h (`isWithinReplayWindow`, derivada del
-- último inbound) quedaba vencida siempre => el negocio nunca podía responder
-- desde el panel y las notificaciones de estado nunca usaban texto libre.
--
-- No hay forma de recuperar la hora real de esos mensajes: `updated_at`
-- (DEFAULT now()) es la mejor aproximación al momento de ingesta disponible.
--
-- El LEAST(...) es deliberado: repara el orden y la fecha visible, pero deja
-- las filas FUERA de la ventana viva de 24 h. Sin ese clamp, mensajes viejos
-- reparados habilitarían texto libre fuera de ventana, que Meta rechaza
-- (error 131047) y que además viola la política de re-engagement.
UPDATE public.whatsapp_messages
SET created_at = LEAST(updated_at, now() - interval '25 hours')
WHERE direction = 'inbound'
  AND created_at < timestamptz '2020-01-01';
