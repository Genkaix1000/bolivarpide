-- ============================================================================
-- BolivarPide — Seed del piloto WhatsApp (n8n)
-- ----------------------------------------------------------------------------
-- CORRER EN: Supabase SQL Editor del proyecto que apunta el .env
-- RE-EJECUTABLE: sí. Si el negocio ya existe, no lo duplica; actualiza
-- horarios, agrega productos faltantes y upsert de la conexión WhatsApp.
--
-- ANTES DE CORRER (una sola vez): reemplazá los 'REEMPLAZAR_...' del final
-- con los valores reales de tu app de Meta (WhatsApp > API Setup):
--   • Phone number ID
--   • WABA ID
-- Si los dejás como placeholders, corré el seed de nuevo cuando tengas los
-- valores reales: el ON CONFLICT actualizará business_whatsapp.
-- ============================================================================

do $$
declare
  v_business_id uuid;
  v_owner_user_id uuid;
begin

  -- ------------------------------------------------------------------
  -- 1) Negocio demo (idempotente por slug)
  -- ------------------------------------------------------------------
  insert into public.businesses (
    slug, name, tagline, category, address, city, province, postal_code,
    phone, is_open, published, plan, rating, reviews_count, prep_time_minutes,
    verification_level, verification_status
  )
  select
    'pizzeria-demo-bolivar', 'Pizzería Demo Bolívar', 'Las mejores pizzas del centro',
    'pizzeria', 'Av. San Martín 452', 'San Carlos de Bolivar', 'Buenos Aires', '6550',
    '+5492314443322', true, true, 'free', 4.8, 5, 30, 2, 'verified'
  where not exists (
    select 1 from public.businesses where slug = 'pizzeria-demo-bolivar'
  )
  returning id into v_business_id;

  if v_business_id is null then
    select id into v_business_id from public.businesses where slug = 'pizzeria-demo-bolivar';
  end if;

  -- Se re-publa por si quedó despublicado manualmente
  update public.businesses
     set published = true, is_open = true, plan = 'free'
   where id = v_business_id;

  -- ------------------------------------------------------------------
  -- 2) Owner (si existe un usuario con ese email en auth.users)
  -- ------------------------------------------------------------------
  select id into v_owner_user_id from auth.users where email = 'demo@bolivarpide.local';
  if v_owner_user_id is not null then
    insert into public.business_members (business_id, user_id, role, status, invited_at, responded_at)
    values (v_business_id, v_owner_user_id, 'owner', 'active', now(), now())
    on conflict (business_id, user_id) do nothing;
  end if;

  -- ------------------------------------------------------------------
  -- 3) Horarios (Lun–Sáb 09:00–23:00, Domingos cerrado)
  -- ------------------------------------------------------------------
  insert into public.business_hours (business_id, weekday, open_time, close_time, closed)
  values
    (v_business_id, 0, NULL, NULL, true),
    (v_business_id, 1, '09:00', '23:00', false),
    (v_business_id, 2, '09:00', '23:00', false),
    (v_business_id, 3, '09:00', '23:00', false),
    (v_business_id, 4, '09:00', '23:00', false),
    (v_business_id, 5, '09:00', '24:00', false),
    (v_business_id, 6, '10:00', '23:00', false)
  on conflict (business_id, weekday) do update
    set open_time = excluded.open_time,
        close_time = excluded.close_time,
        closed = excluded.closed;

  -- ------------------------------------------------------------------
  -- 4) Productos demo (idempotente por business_id + name)
  -- ------------------------------------------------------------------
  insert into public.products (business_id, name, description, category, price_cents, available, sort_order)
  select v_business_id, 'Pizza Muzza', 'Salsa de tomate, mozzarella y aceitunas', 'Pizzas', 1200000, true, 1
  where not exists (select 1 from public.products where business_id = v_business_id and name = 'Pizza Muzza');

  insert into public.products (business_id, name, description, category, price_cents, available, sort_order)
  select v_business_id, 'Pizza Napolitana', 'Mozzarella, tomate en rodajas y ajo', 'Pizzas', 1350000, true, 2
  where not exists (select 1 from public.products where business_id = v_business_id and name = 'Pizza Napolitana');

  insert into public.products (business_id, name, description, category, price_cents, available, sort_order)
  select v_business_id, 'Empanada de carne', 'Con pasas y aceitunas, al horno', 'Empanadas', 150000, true, 3
  where not exists (select 1 from public.products where business_id = v_business_id and name = 'Empanada de carne');

  insert into public.products (business_id, name, description, category, price_cents, available, sort_order)
  select v_business_id, 'Docena de empanadas', 'Mix a elección', 'Empanadas', 1440000, true, 4
  where not exists (select 1 from public.products where business_id = v_business_id and name = 'Docena de empanadas');

  insert into public.products (business_id, name, description, category, price_cents, available, sort_order)
  select v_business_id, 'Gaseosa 1.5L', 'Coca-Cola, Pepsi o Sprite', 'Bebidas', 350000, true, 5
  where not exists (select 1 from public.products where business_id = v_business_id and name = 'Gaseosa 1.5L');

  insert into public.products (business_id, name, description, category, price_cents, available, sort_order)
  select v_business_id, 'Agua mineral 500ml', 'Villavicencio o Glaciar', 'Bebidas', 100000, true, 6
  where not exists (select 1 from public.products where business_id = v_business_id and name = 'Agua mineral 500ml');

  -- ------------------------------------------------------------------
  -- 5) Conexión WhatsApp del piloto (upsert por business)
  --    ⚠️ REEMPLAZÁ los valores de abajo con los de tu app de Meta.
  --    El token NO va acá: lo usa la credencial de n8n (y Vault al conectar
  --    desde el panel). Sin token, el workflow igual lee el menú y crea pedidos.
  -- ------------------------------------------------------------------
  insert into public.business_whatsapp (
    business_id, phone_number_id, display_phone_number, waba_id, status, is_active
  )
  values (
    v_business_id,
    'REEMPLAZAR_PHONE_NUMBER_ID',       -- Phone number ID de Meta
    '+54 9 2314 000000',                 -- Número visible (solo descriptivo)
    'REEMPLAZAR_WABA_ID',                -- WhatsApp Business Account ID
    'connected',
    true
  )
  on conflict (business_id) do update
    set phone_number_id = excluded.phone_number_id,
        display_phone_number = excluded.display_phone_number,
        waba_id = excluded.waba_id,
        status = excluded.status,
        is_active = excluded.is_active;

  -- ------------------------------------------------------------------
  -- 6) Sanity check
  -- ------------------------------------------------------------------
  raise notice 'Business demo: %', v_business_id;

  if v_owner_user_id is null then
    raise notice 'AVISO: no existe usuario demo@bolivarpide.local. El negocio quedó publicado pero sin owner en business_members. El bot funciona igual para el piloto.';
  end if;

end $$;

-- ----------------------------------------------------------------------------
-- (OPCIONAL) Crear el usuario demo de auth para reclamar el negocio después.
-- DANGER: acá va el hash bcrypt de la contraseña. Para el piloto NO es necesario.
-- Usá la UI de Supabase (Authentication > Add user) para crear
--   email: demo@bolivarpide.local  /  clave: la que quieras
-- y luego volvé a correr este seed para que quede como owner.
-- ----------------------------------------------------------------------------