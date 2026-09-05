-- Onboarding: categories, verification, plan tiers (free / impulso / lider)

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS custom_category_input text,
  ADD COLUMN IF NOT EXISTS verification_level int NOT NULL DEFAULT 1
    CHECK (verification_level IN (1, 2)),
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending_review', 'verified', 'rejected'));

UPDATE public.businesses SET plan = 'impulso' WHERE plan = 'premium';

ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_plan_check;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_plan_check
  CHECK (plan IN ('free', 'impulso', 'lider'));

CREATE INDEX IF NOT EXISTS idx_businesses_custom_category
  ON public.businesses(category, custom_category_input);
