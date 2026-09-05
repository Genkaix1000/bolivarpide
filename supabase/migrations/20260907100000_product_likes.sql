-- Product likes for Reels feed (dumb counters; no recommendation engine).

CREATE TABLE IF NOT EXISTS public.product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_likes_actor CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_likes_user_product_uidx
  ON public.product_likes (user_id, product_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS product_likes_session_product_uidx
  ON public.product_likes (session_id, product_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_likes_product
  ON public.product_likes (product_id);

ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read (counts + own state via client filter).
DROP POLICY IF EXISTS "product_likes_public_read" ON public.product_likes;
CREATE POLICY "product_likes_public_read"
  ON public.product_likes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "product_likes_insert_own" ON public.product_likes;
CREATE POLICY "product_likes_insert_own"
  ON public.product_likes
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid() AND session_id IS NULL);

DROP POLICY IF EXISTS "product_likes_delete_own" ON public.product_likes;
CREATE POLICY "product_likes_delete_own"
  ON public.product_likes
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Guest likes go through server action + service role (avoids open anon write spam via RLS).
GRANT SELECT, INSERT, DELETE ON public.product_likes TO authenticated;
GRANT SELECT ON public.product_likes TO anon;
