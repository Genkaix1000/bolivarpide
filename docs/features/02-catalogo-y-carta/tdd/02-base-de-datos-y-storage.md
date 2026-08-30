# TDD — 02: Base de Datos, Storage & RLS

> **Módulo:** `02-catalogo-y-carta`  
> **Fase:** 2  

---

## 1. Esquema SQL de Productos

```sql
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'General',
  price_cents int NOT NULL CHECK (price_cents >= 0),
  available boolean NOT NULL DEFAULT true,
  image_path text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(business_id, category);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Lectura pública solo si el negocio está publicado
CREATE POLICY "Public read products if published"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = products.business_id AND b.published = true
    )
  );

-- Gestión para miembros activos o administradores
CREATE POLICY "Members manage products"
  ON public.products FOR ALL
  USING (public.is_business_member(business_id) OR public.is_platform_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_platform_admin());
```

---

## 2. Configuración de Storage Bucket (`product-images`)

```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Members upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    public.is_business_member((storage.foldername(name))[1]::uuid)
  );
```
