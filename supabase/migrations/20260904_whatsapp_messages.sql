-- WhatsApp chat integrated panel — message persistence for /negocio/[id]/whatsapp
-- v1: whatsapp_messages table + storage bucket for inbound media + RLS
--
-- Model: one row per WhatsApp message (inbound or outbound) for a business.
-- Chat = grouping by (business_id, chat_id). The 24h reply window is derived
-- from the latest inbound created_at, no extra column needed.

-- =============================================================================
-- 1. whatsapp_messages
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  chat_id text NOT NULL,               -- WhatsApp "from" (e.g. 54911XXXXXXXX)
  direction text NOT NULL DEFAULT 'inbound'
    CHECK (direction IN ('inbound', 'outbound')),
  type text NOT NULL DEFAULT 'text'
    CHECK (type IN ('text', 'image', 'audio', 'video', 'sticker', 'document', 'location', 'contacts', 'unknown')),
  text_body text,
  media_json jsonb,                    -- {remote_url, mime_type, file_size, caption, duration_ms, storage_path}
  wa_message_id text UNIQUE,           -- Meta message id (idempotency, NULL for outbound pre-confirm)
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
  customer_name text,
  read_at timestamptz,                 -- when the business opened the chat (unread = inbound AND read_at IS NULL)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat
  ON public.whatsapp_messages (business_id, chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_unread
  ON public.whatsapp_messages (business_id, direction, read_at)
  WHERE direction = 'inbound';

-- =============================================================================
-- 2. RLS: members/admin can SELECT (needed for Realtime + panel queries);
--    writes are service_role-only (webhook + server actions).
-- =============================================================================
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_messages_member_select" ON public.whatsapp_messages;
CREATE POLICY "whatsapp_messages_member_select"
  ON public.whatsapp_messages
  FOR SELECT
  USING (public.is_business_member(business_id) OR public.is_platform_admin());

REVOKE ALL ON public.whatsapp_messages FROM anon, authenticated;
GRANT SELECT ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;

-- =============================================================================
-- 3. Storage bucket for inbound media (images + audio + video).
--    Public read; writes service-only (mirrors security_rls storage lockdown).
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-media',
  'whatsapp-media',
  true,
  26214400,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic',
    'audio/ogg', 'audio/opus', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/webm',
    'video/mp4', 'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "whatsapp_media_public_read" ON storage.objects;
CREATE POLICY "whatsapp_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'whatsapp-media');

GRANT SELECT ON storage.objects TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON storage.objects FROM anon, authenticated;