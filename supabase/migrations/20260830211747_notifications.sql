CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('orders', 'payments', 'system', 'promos')),
  priority smallint NOT NULL DEFAULT 2 CHECK (priority BETWEEN 0 AND 2),
  title text NOT NULL,
  body text,
  emoji text,
  icon text,
  action_url text,
  entity_type text,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_list
  ON public.notifications (user_id, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id)
  WHERE read_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_idx
  ON public.notifications (user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;
