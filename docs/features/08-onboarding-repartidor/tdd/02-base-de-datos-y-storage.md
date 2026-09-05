# TDD 02 — Base de datos, storage y RLS

## Migración aplicada

Archivo: `supabase/migrations/20260907000000_delivery_profiles.sql` (aplicada vía `supabase db push` y verificada contra la DB real).

### 1. Tabla `delivery_profiles` (1:1 con `auth.users`)

```sql
CREATE TABLE public.delivery_profiles (
  user_id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type      text NOT NULL
                      CHECK (vehicle_type IN ('bicycle','motorcycle','car','on_foot')),
  status            text NOT NULL DEFAULT 'pending_review'
                      CHECK (status IN ('pending_review','approved','rejected')),
  dni_doc_path      text NOT NULL,
  dni_back_doc_path text NOT NULL,
  license_doc_path  text,
  cuil              text NOT NULL,
  availability      text NOT NULL DEFAULT 'flexible'
                      CHECK (availability IN ('flexible','noches','mediodia','completo')),
  rejection_reason  text,
  reviewed_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       timestamptz,
  submitted_at      timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

- Un solo registro por usuario (PK = `user_id`).
- `cuil` plano: sensible pero legible por el propio dueño y el admin; ver RLS.

### 2. RLS (tabla)

```sql
CREATE POLICY delivery_profiles_own_select   -- SELECT TO authenticated USING (user_id = auth.uid())
CREATE POLICY delivery_profiles_admin_select -- SELECT TO authenticated USING (public.is_platform_admin())
-- Sin INSERT/UPDATE/DELETE para authenticated: mutaciones SOLO service_role (server actions).
```

### 3. Bucket `kyc-documents` (privado)

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kyc-documents', 'kyc-documents', false, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','application/pdf']);

GRANT SELECT ON storage.objects TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON storage.objects FROM anon, authenticated;

CREATE POLICY kyc_documents_participant_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text
         OR public.is_platform_admin())
  );
```

- `public=false` → no hay `/object/public/...`; acceso solo por **signed URL**.
- Carpeta raíz = `user_id` del postulante → RLS de "dueño de carpeta".
- **Escrituras service-only** (sin policies de INSERT/UPDATE/DELETE para `authenticated`).
- GOTCHA: en políticas se requiere `(storage.foldername(name))[1]` (paréntesis alrededor del call); `foldername(name)[1]` da syntax error en Postgres.

### 4. Cómo se accede a los docs

| Contexto | Mecanismo |
|----------|-----------|
| Preview en el admin | `createSignedUrl(path, 180)` generada en la página `/admin` (service client) |
| Postulante | No hay URL pública; su doc vive en su carpeta (RLS) y la app no lo expone en esta feature |
| Cualquier otro | Ninguno (bucket privado + política restrictiva) |

No hay Realtime nuevo ni RPC: la postulación es un flujo pull + push (las notificaciones reusan `insertNotification`).

## Notas operativas

- Los `doc_path` guardados en DB son relativos al bucket (`<userId>/<kind>-<uuid>.ext`); siempre se limpian con `.replace(/^\//,"")` antes de firmar/borrar.
- Reinyección de docs: en el resubmit se borran los paths viejos de la fila previa; en error se borran los subidos en el intento.