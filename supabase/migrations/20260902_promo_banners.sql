-- Tabla de banners publicitarios y promocionales de portada (Home)
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL,
  badge text,
  cta_text text,
  cta_link text,
  image text NOT NULL,
  icon text NOT NULL DEFAULT 'local_offer',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: Lectura pública, escritura solo service_role
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public promo banners are viewable by everyone" ON public.promo_banners;
CREATE POLICY "Public promo banners are viewable by everyone"
  ON public.promo_banners
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access on promo_banners" ON public.promo_banners;
CREATE POLICY "Service role full access on promo_banners"
  ON public.promo_banners
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Semilla inicial
INSERT INTO public.promo_banners (title, subtitle, badge, cta_text, cta_link, image, icon, sort_order, is_active)
VALUES
  (
    'Envíos gratis en Bolívar',
    'En locales adheridos en pedidos a partir de $4.000',
    'PROMO',
    'Pedir ahora',
    '#trending',
    'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1400&q=80',
    'local_shipping',
    1,
    true
  ),
  (
    'Burger Week en Bolívar',
    'Doble smash beef, cheddar ahumado derretido y panceta crocante',
    'HOT DEALS',
    'Pedir en Burger Boz',
    '/c/burgerboz',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1400&q=80',
    'lunch_dining',
    2,
    true
  ),
  (
    'Noche de Pizza a la Leña',
    'Masa madre crocante con muzzarella fior di latte artesanal',
    '2X1 MARTES Y JUEVES',
    'Pedir en Pizza Store',
    '/c/pizzastore',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80',
    'local_pizza',
    3,
    true
  ),
  (
    'Hora del almuerzo',
    'Hasta 25% OFF en menús ejecutivos y platos del día',
    '12 A 15 HS',
    'Ver empanadas',
    '/c/empanadas-bolivar',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=80',
    'lunch_dining',
    4,
    true
  ),
  (
    'Café de Especialidad & Bakery',
    'Cappuccinos cremosos, medialunas de manteca y croissants tibios',
    'DESAYUNOS & MERIENDAS',
    'Ver McCafé',
    '/c/mccafe',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=80',
    'local_cafe',
    5,
    true
  ),
  (
    'Sushi World Bolívar',
    'Combinados de salmón fresco, rolls tempura y wok oriental',
    'PREMIUM ROLLS',
    'Pedir Sushi',
    '/c/sushiworld',
    'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1400&q=80',
    'set_meal',
    6,
    true
  ),
  (
    'Helados Artesanales Dolce',
    'Potes de 1 Kg con cucuruchos de regalo directo a tu puerta',
    'POSTRES',
    'Pedir Helado',
    '/c/helados-dolce',
    'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=1400&q=80',
    'icecream',
    7,
    true
  )
ON CONFLICT DO NOTHING;
