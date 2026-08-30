# TDD — 02: Base de Datos, Storage & Auditoría

> **Módulo:** `04-leads-admin-y-onboarding`  
> **Fase:** 4  

---

## 1. Migración SQL: Columnas de Onboarding, Planes & Mercado Pago

```sql
-- 1. Actualizar tabla businesses con planes, categoría custom y MP OAuth
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS custom_category_input text,
  ADD COLUMN IF NOT EXISTS verification_level int NOT NULL DEFAULT 1 CHECK (verification_level IN (1, 2)),
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending_review', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS legal_id_type text CHECK (legal_id_type IN ('dni', 'cuit')),
  ADD COLUMN IF NOT EXISTS legal_id_number text,
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS legal_doc_front_path text,
  ADD COLUMN IF NOT EXISTS legal_doc_back_path text,
  ADD COLUMN IF NOT EXISTS mp_user_id text,
  ADD COLUMN IF NOT EXISTS mp_connected_at timestamptz;

-- Ajustar constraint de planes
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_plan_check;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_plan_check CHECK (plan IN ('free', 'impulso', 'lider'));

CREATE INDEX IF NOT EXISTS idx_businesses_custom_category ON public.businesses(category, custom_category_input);
```

---

## 2. Bucket Privado de Storage (`kyc-documents`)

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Subida y lectura solo para miembros del comercio o Administradores
CREATE POLICY "Members upload kyc documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents' AND
    public.is_business_member((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Members or admins read kyc documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents' AND (
      public.is_business_member((storage.foldername(name))[1]::uuid) OR
      public.is_platform_admin()
    )
  );
```

---

## 3. Tabla de Auditoría Administrativa (`admin_audit_log`)

```sql
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL, -- create_business_onboarding, approve_kyc_level_2, reject_kyc, set_published, change_plan, impersonate_start, impersonate_end
  target_type text,     -- business, user
  target_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read audit log"
  ON public.admin_audit_log FOR SELECT
  USING (public.is_platform_admin());
```
