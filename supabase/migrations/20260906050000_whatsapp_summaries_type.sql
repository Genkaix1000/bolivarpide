-- Fase 4 — La lista de chats necesita el tipo del último mensaje.
--
-- Sin él, todo lo que no fuera texto se mostraba como "📎 adjunto": una
-- ubicación, un audio y un contacto se veían iguales en la lista. Con el tipo
-- se arma el preview correcto ("📍 Ubicación", "🎤 Audio", …).
--
-- Cambia el tipo de retorno, así que hay que soltar la función antes:
-- CREATE OR REPLACE no puede modificar los OUT params.
DROP FUNCTION IF EXISTS public.whatsapp_chat_summaries(uuid, integer);

CREATE FUNCTION public.whatsapp_chat_summaries(
  p_business_id uuid,
  p_limit integer DEFAULT 200
)
RETURNS TABLE (
  chat_id text,
  customer_name text,
  last_text text,
  last_type text,
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
    tail.type,
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
    SELECT m2.text_body, m2.type, m2.direction, m2.media_json
    FROM public.whatsapp_messages m2
    WHERE m2.business_id = p_business_id
      AND m2.chat_id = agg.chat_id
    ORDER BY m2.created_at DESC, m2.id DESC
    LIMIT 1
  ) tail ON true
  ORDER BY agg.last_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 200), 500));
$$;

REVOKE ALL ON FUNCTION public.whatsapp_chat_summaries(uuid, integer)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.whatsapp_chat_summaries(uuid, integer)
  TO service_role;
