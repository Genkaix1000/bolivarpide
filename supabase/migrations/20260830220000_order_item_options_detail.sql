ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS options_detail jsonb NOT NULL DEFAULT '[]'::jsonb;
