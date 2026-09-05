-- Platform RBAC: superadmin / soporte (extends legacy app_metadata.role = 'admin')

CREATE TABLE IF NOT EXISTS public.platform_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('superadmin', 'soporte')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.platform_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_users FROM anon, authenticated;
GRANT ALL ON public.platform_users TO service_role;

-- Legacy is_platform_admin() stays: role = 'admin' (both platform roles).

CREATE OR REPLACE FUNCTION public.is_platform_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false) IS NOT TRUE THEN false
    WHEN (auth.jwt() -> 'app_metadata' ->> 'platform_role') = 'superadmin' THEN true
    -- Migration window: admin without platform_role = superadmin
    WHEN (auth.jwt() -> 'app_metadata' ->> 'platform_role') IS NULL THEN true
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_support()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    AND coalesce(
      (auth.jwt() -> 'app_metadata' ->> 'platform_role') IN ('soporte', 'superadmin'),
      true  -- legacy admin without platform_role
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_superadmin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_support() TO authenticated, service_role;

-- Seed: existing platform admins + bootstrap email → superadmin in platform_users.
-- JWT claims (raw_app_meta_data) synced here so Edge/middleware sees platform_role
-- without waiting for a Server Action. New assigns still go through Server Actions.

INSERT INTO public.platform_users (user_id, role)
SELECT u.id, 'superadmin'
FROM auth.users u
WHERE u.raw_app_meta_data->>'role' = 'admin'
   OR lower(u.email) = lower(coalesce(current_setting('app.platform_bootstrap_email', true), 'matiasasin123@gmail.com'))
ON CONFLICT (user_id) DO NOTHING;

UPDATE auth.users u
SET raw_app_meta_data =
  coalesce(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin', 'platform_role', 'superadmin')
WHERE u.raw_app_meta_data->>'role' = 'admin'
   OR lower(u.email) = lower(coalesce(current_setting('app.platform_bootstrap_email', true), 'matiasasin123@gmail.com'));
