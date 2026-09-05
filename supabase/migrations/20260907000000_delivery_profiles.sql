-- Onboarding de repartidores: perfil + documentación KYC + bucket privado.
-- Estrategia de escritura service-only (mismo criterio que orders/pagos):
-- las mutaciones de delivery_profiles y del bucket kyc-documents se hacen
-- SOLO desde server actions con service_role tras requireUser / requireAdmin.

-- --------------------------------------------------------------------------
-- 1. Tabla delivery_profiles (1:1 con auth.users)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type text NOT NULL
    CHECK (vehicle_type IN ('bicycle', 'motorcycle', 'car', 'on_foot')),
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected')),
  dni_doc_path text NOT NULL,
  dni_back_doc_path text NOT NULL,
  license_doc_path text,
  cuil text NOT NULL,
  availability text NOT NULL DEFAULT 'flexible'
    CHECK (availability IN ('flexible', 'noches', 'mediodia', 'completo')),
  rejection_reason text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.delivery_profiles IS
  'Postulación de repartidor con documentación KYC (revisión por admin).';

ALTER TABLE public.delivery_profiles ENABLE ROW LEVEL SECURITY;

-- El postulante solo lee su propia postulación (y su estado).
CREATE POLICY "delivery_profiles_own_select" ON public.delivery_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- El admin de plataforma lee todas las postulaciones.
CREATE POLICY "delivery_profiles_admin_select" ON public.delivery_profiles
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- Sin INSERT/UPDATE/DELETE para authenticated: las mutaciones van por
-- service_role (server actions), como orders/pagos/whatsapp.

-- --------------------------------------------------------------------------
-- 2. Bucket privado kyc-documents
-- --------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kyc-documents', 'kyc-documents', false, 5242880 /* 5MB */,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- SELECT de storage.objects ya otorgado a authenticated (necesario para leer
-- los buckets públicos). No se revoca a anon (rompería business-assets /
-- whatsapp-media). Se restringe el acceso a kyc-documents por RLS.
GRANT SELECT ON storage.objects TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON storage.objects FROM anon, authenticated;

-- Acceso al documento: el dueño de la carpeta (foldername[1] = user_id) o el
-- admin de plataforma. El bucket es privado: solo se accede vía signed URL
-- generada por service_role tras requireUser / requireAdmin.
CREATE POLICY "kyc_documents_participant_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_platform_admin()
    )
  );

-- Escrituras SOLO service_role: no hay policy de INSERT/UPDATE/DELETE para
-- authenticated en este bucket.