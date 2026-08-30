ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS offer_qr_pay boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS absorb_fast_pay_fee boolean NOT NULL DEFAULT false;
