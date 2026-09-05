-- Extend public.user_profiles with personal details, KYC verification flag and notification preferences
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS identity_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_orders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_promos boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_whatsapp boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_payment_method text NOT NULL DEFAULT 'cash';
