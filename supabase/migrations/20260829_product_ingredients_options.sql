-- Add ingredients and customizable option groups to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ingredients text[] DEFAULT '{}'::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS options jsonb DEFAULT '[]'::jsonb;
