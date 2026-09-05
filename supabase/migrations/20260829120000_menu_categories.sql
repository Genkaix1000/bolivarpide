-- Categorías de menú por negocio + imágenes de producto (ícono + foto)

CREATE TABLE IF NOT EXISTS public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);

CREATE INDEX IF NOT EXISTS menu_categories_business_sort
  ON public.menu_categories (business_id, sort_order);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS icon_path text;

-- Bucket público para logos, banners y fotos de productos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets',
  'business-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "business_assets_public_read" ON storage.objects;
CREATE POLICY "business_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-assets');

DROP POLICY IF EXISTS "business_assets_auth_insert" ON storage.objects;
CREATE POLICY "business_assets_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'business-assets');

DROP POLICY IF EXISTS "business_assets_auth_update" ON storage.objects;
CREATE POLICY "business_assets_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'business-assets');

DROP POLICY IF EXISTS "business_assets_auth_delete" ON storage.objects;
CREATE POLICY "business_assets_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'business-assets');

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "menu_categories_member_all" ON public.menu_categories;
CREATE POLICY "menu_categories_member_all"
  ON public.menu_categories
  FOR ALL
  USING (public.is_business_member(business_id) OR public.is_platform_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "menu_categories_public_read" ON public.menu_categories;
CREATE POLICY "menu_categories_public_read"
  ON public.menu_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = menu_categories.business_id AND b.published = true
    )
  );
