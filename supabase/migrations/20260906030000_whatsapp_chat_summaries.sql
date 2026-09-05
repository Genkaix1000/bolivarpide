-- Fase 2 — Resumen de conversaciones agregado en la base.
--
-- `listChatConversations` traía TODOS los mensajes del negocio (sin LIMIT) en
-- cada carga, y el panel lo re-ejecutaba entero ante cualquier evento realtime
-- de `whatsapp_messages` u `orders` del negocio, aunque el evento fuera de otro
-- chat. Con historial acumulado eso crece sin techo.
--
-- La lista sólo necesita, por chat: último mensaje, no leídos y último inbound
-- (para la ventana de 24 h). Todo eso es una agregación; los mensajes se
-- cargan aparte y paginados sólo para el chat abierto.
CREATE OR REPLACE FUNCTION public.whatsapp_chat_summaries(
  p_business_id uuid,
  p_limit integer DEFAULT 200
)
RETURNS TABLE (
  chat_id text,
  customer_name text,
  last_text text,
  last_direction text,
  last_has_media boolean,
  last_at timestamptz,
  last_inbound_at timestamptz,
  unread_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    agg.chat_id,
    agg.customer_name,
    tail.text_body,
    tail.direction,
    (tail.media_json IS NOT NULL),
    agg.last_at,
    agg.last_inbound_at,
    agg.unread_count
  FROM (
    SELECT
      m.chat_id AS chat_id,
      max(m.created_at) AS last_at,
      max(m.created_at) FILTER (WHERE m.direction = 'inbound') AS last_inbound_at,
      count(*) FILTER (WHERE m.direction = 'inbound' AND m.read_at IS NULL)::int AS unread_count,
      -- Nombre de perfil más reciente que haya reportado Meta para ese chat.
      (array_agg(m.customer_name ORDER BY m.created_at DESC)
         FILTER (WHERE m.customer_name IS NOT NULL))[1] AS customer_name
    FROM public.whatsapp_messages m
    WHERE m.business_id = p_business_id
    GROUP BY m.chat_id
  ) agg
  JOIN LATERAL (
    SELECT m2.text_body, m2.direction, m2.media_json
    FROM public.whatsapp_messages m2
    WHERE m2.business_id = p_business_id
      AND m2.chat_id = agg.chat_id
    ORDER BY m2.created_at DESC, m2.id DESC
    LIMIT 1
  ) tail ON true
  ORDER BY agg.last_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 200), 500));
$$;

-- Backend-only: el panel entra por el service client después de
-- `requireBusinessAccess`, igual que el resto de las consultas del chat.
REVOKE ALL ON FUNCTION public.whatsapp_chat_summaries(uuid, integer)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.whatsapp_chat_summaries(uuid, integer)
  TO service_role;

-- Paginación hacia atrás del chat abierto: (business_id, chat_id, created_at DESC)
-- ya existe como idx_whatsapp_messages_chat y cubre tanto el LATERAL como el
-- keyset de `getChatDetail`.
