-- WhatsApp Business: habilitar el enlazado self-service vía OAuth (Meta Business Login).
-- + fixes de runtime del chat (updated_at, status rejected, Realtime).

-- 1) Estado OAuth del diálogo de Meta (mismo patrón que oauth_states de MP).
CREATE TABLE IF NOT EXISTS public.meta_oauth_states (
  state        text PRIMARY KEY,
  business_id  uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL,
  redirect_url text NOT NULL,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.consume_meta_oauth_state(p_state text)
RETURNS TABLE(business_id uuid, user_id uuid, redirect_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  DELETE FROM public.meta_oauth_states
  WHERE meta_oauth_states.state = p_state AND meta_oauth_states.expires_at > now()
  RETURNING meta_oauth_states.business_id, meta_oauth_states.user_id, meta_oauth_states.redirect_url;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_meta_oauth_state(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_meta_oauth_state(text) TO service_role;

ALTER TABLE public.meta_oauth_states ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.meta_oauth_states TO service_role;
REVOKE ALL ON public.meta_oauth_states FROM anon, authenticated;

-- 2) whatsapp_messages: columna updated_at (el webhook la escribe) y status 'rejected'.
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  ALTER TABLE public.whatsapp_messages DROP CONSTRAINT IF EXISTS whatsapp_messages_status_check;
  ALTER TABLE public.whatsapp_messages ADD CONSTRAINT whatsapp_messages_status_check
    CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed', 'rejected'));
END;
$$;

-- 3) Realtime del panel: publicar los mensajes de WhatsApp (no-op si ya está).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'whatsapp_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
  END IF;
END;
$$;

-- 4) Ciclo de vida del token y origen del vínculo por negocio.
ALTER TABLE public.business_whatsapp
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS connected_at timestamptz,
  ADD COLUMN IF NOT EXISTS meta_user_id text,
  ADD COLUMN IF NOT EXISTS verified_name text;