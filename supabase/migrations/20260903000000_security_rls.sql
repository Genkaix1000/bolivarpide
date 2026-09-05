-- Security hardening: RLS on unprotected tables, RPC hardening, storage + notifications lockdown.
-- Applied via SQL editor (2026-09-03). This migration is additive in behavior: it only
-- restricts access that is currently wide open.

-- =============================================================================
-- 1. RPC respond_business_membership
--    Invite accept / reject / leave. SECURITY DEFINER so an invited user can
--    transition their OWN status without being able to overwrite role
--    (no direct UPDATE policy for self on business_members).
-- =============================================================================
CREATE OR REPLACE FUNCTION public.respond_business_membership(
  p_action text,
  p_member_id uuid DEFAULT NULL,
  p_business_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_status text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'no autenticado';
  END IF;

  IF p_action IN ('accept', 'reject') THEN
    IF p_member_id IS NULL THEN
      RAISE EXCEPTION 'member_id requerido';
    END IF;
    v_status := CASE WHEN p_action = 'accept' THEN 'active' ELSE 'rejected' END;
    UPDATE public.business_members
      SET status = v_status, responded_at = now()
      WHERE id = p_member_id AND user_id = v_user AND status = 'invited';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'invitación no encontrada o ya respondida';
    END IF;
  ELSIF p_action = 'leave' THEN
    IF p_business_id IS NULL THEN
      RAISE EXCEPTION 'business_id requerido';
    END IF;
    UPDATE public.business_members
      SET status = 'left', responded_at = now()
      WHERE business_id = p_business_id
        AND user_id = v_user
        AND role <> 'owner'
        AND status IN ('active', 'invited');
    IF NOT FOUND THEN
      RAISE EXCEPTION 'no sos miembro activo de este comercio';
    END IF;
  ELSE
    RAISE EXCEPTION 'acción inválida';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_business_membership(text, uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.respond_business_membership(text, uuid, uuid) TO authenticated, service_role;

-- =============================================================================
-- 2. business_members
--    Read: own memberships + members of a business the user belongs to + admins.
--    Write: only ACTIVE members/admin of the same business (invites). Self
--    transitions (accept/reject/leave) go through respond_business_membership.
-- =============================================================================
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_select" ON public.business_members;
CREATE POLICY "members_select"
  ON public.business_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_business_member(business_id)
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS "members_insert" ON public.business_members;
CREATE POLICY "members_insert"
  ON public.business_members
  FOR INSERT
  WITH CHECK (public.is_business_member(business_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "members_update" ON public.business_members;
CREATE POLICY "members_update"
  ON public.business_members
  FOR UPDATE
  USING (public.is_business_member(business_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "members_delete" ON public.business_members;
CREATE POLICY "members_delete"
  ON public.business_members
  FOR DELETE
  USING (public.is_business_member(business_id) OR public.is_platform_admin());

-- =============================================================================
-- 3. orders
--    SELECT: customer for their own orders; member/admin for their business
--    orders. UPDATE: member/admin (status transitions run server-side with the
--    user client). NO INSERT policy -> anon/authenticated can't forge orders
--    (checkout and create_order always run as service_role / SECURITY DEFINER).
-- =============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_customer_select" ON public.orders;
CREATE POLICY "orders_customer_select"
  ON public.orders
  FOR SELECT
  USING (customer_user_id = auth.uid());

DROP POLICY IF EXISTS "orders_member_select" ON public.orders;
CREATE POLICY "orders_member_select"
  ON public.orders
  FOR SELECT
  USING (public.is_business_member(business_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "orders_member_update" ON public.orders;
CREATE POLICY "orders_member_update"
  ON public.orders
  FOR UPDATE
  USING (public.is_business_member(business_id) OR public.is_platform_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_platform_admin());

-- =============================================================================
-- 4. order_items
--    SELECT only, proxied through the parent order's visibility (customer owns
--    the order, or member/admin of the order's business). No write policies.
-- =============================================================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          o.customer_user_id = auth.uid()
          OR public.is_business_member(o.business_id)
          OR public.is_platform_admin()
        )
    )
  );

-- =============================================================================
-- 5. products
--    Public read: available products of published businesses. Members/admin:
--    full access to their own business products (carta CRUD runs with the user
--    client).
-- =============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read"
  ON public.products
  FOR SELECT
  USING (
    available = true
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = products.business_id AND b.published = true
    )
  );

DROP POLICY IF EXISTS "products_member_all" ON public.products;
CREATE POLICY "products_member_all"
  ON public.products
  FOR ALL
  USING (public.is_business_member(business_id) OR public.is_platform_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_platform_admin());

-- =============================================================================
-- 6. businesses
--    Public read: published only. Members/admin: full access (toggle open,
--    publish, verification, admin panel).
-- =============================================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "businesses_public_read" ON public.businesses;
CREATE POLICY "businesses_public_read"
  ON public.businesses
  FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "businesses_member_all" ON public.businesses;
CREATE POLICY "businesses_member_all"
  ON public.businesses
  FOR ALL
  USING (public.is_business_member(id) OR public.is_platform_admin())
  WITH CHECK (public.is_business_member(id) OR public.is_platform_admin());

-- =============================================================================
-- 7. business_hours
-- =============================================================================
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_hours_member_all" ON public.business_hours;
CREATE POLICY "business_hours_member_all"
  ON public.business_hours
  FOR ALL
  USING (public.is_business_member(business_id) OR public.is_platform_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_platform_admin());

-- =============================================================================
-- 8. business_whatsapp
--    Members can read their connection (settings card); writes stay service-only.
-- =============================================================================
ALTER TABLE public.business_whatsapp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_whatsapp_member_read" ON public.business_whatsapp;
CREATE POLICY "business_whatsapp_member_read"
  ON public.business_whatsapp
  FOR SELECT
  USING (public.is_business_member(business_id) OR public.is_platform_admin());

-- =============================================================================
-- 9. Backend-only tables: RLS + service_role-only access (no anon/auth grants).
-- =============================================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_order_counters ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.admin_audit_log TO service_role;
GRANT ALL ON public.whatsapp_sessions TO service_role;
GRANT ALL ON public.business_order_counters TO service_role;

REVOKE ALL ON public.leads FROM anon, authenticated;
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
REVOKE ALL ON public.whatsapp_sessions FROM anon, authenticated;
REVOKE ALL ON public.business_order_counters FROM anon, authenticated;

-- =============================================================================
-- 10. RPC hardening: remove authenticated from order/session RPCs (forgery
--     vector). create_order now validates unit prices when product_id is sent.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.create_order(
  p_business_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_source text DEFAULT 'web',
  p_wa_chat_id text DEFAULT NULL,
  p_delivery_address text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_total_cents bigint := 0;
  v_item jsonb;
  v_price_cents int;
BEGIN
  IF p_business_id IS NULL THEN
    RAISE EXCEPTION 'business_id requerido';
  END IF;
  IF p_source NOT IN ('web', 'whatsapp') THEN
    RAISE EXCEPTION 'source invalido';
  END IF;
  -- WhatsApp orders must come from an active connected number.
  IF p_source = 'whatsapp' AND NOT EXISTS (
    SELECT 1 FROM public.business_whatsapp w
    WHERE w.business_id = p_business_id
      AND w.status = 'connected'
      AND w.is_active = true
  ) THEN
    RAISE EXCEPTION 'WhatsApp no activo para este comercio';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'items requeridos';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_total_cents := v_total_cents
      + COALESCE((v_item ->> 'quantity')::int, 1)
      * COALESCE((v_item ->> 'unit_price_cents')::bigint, 0);
    IF (v_item ->> 'name') IS NULL OR (v_item ->> 'name') = '' THEN
      RAISE EXCEPTION 'item sin nombre';
    END IF;
    -- Price validation: only when the item references a real product of the
    -- same business (walk-in free-text items stay vendor-trusted via n8n).
    IF (v_item ->> 'product_id') IS NOT NULL THEN
      SELECT p.price_cents INTO v_price_cents
      FROM public.products p
      WHERE p.id = (v_item ->> 'product_id')::uuid
        AND p.business_id = p_business_id;
      IF v_price_cents IS NULL THEN
        RAISE EXCEPTION 'producto desconocido en este comercio';
      END IF;
      IF v_price_cents <> COALESCE((v_item ->> 'unit_price_cents')::bigint, 0) THEN
        RAISE EXCEPTION 'precio inválido para %', v_item ->> 'name';
      END IF;
    END IF;
  END LOOP;

  INSERT INTO public.orders (
    business_id,
    customer_user_id,
    customer_name,
    customer_phone,
    status,
    total_cents,
    notes,
    source,
    wa_chat_id,
    delivery_address
  ) VALUES (
    p_business_id,
    NULL,
    p_customer_name,
    p_customer_phone,
    'pending',
    v_total_cents,
    p_notes,
    p_source,
    p_wa_chat_id,
    p_delivery_address
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      name,
      quantity,
      unit_price_cents
    ) VALUES (
      v_order_id,
      NULLIF(v_item ->> 'product_id', '')::uuid,
      v_item ->> 'name',
      (v_item ->> 'quantity')::int,
      (v_item ->> 'unit_price_cents')::int
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(uuid, text, text, text, text, text, text, jsonb)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(uuid, text, text, text, text, text, text, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.whatsapp_session_add_item(uuid, text, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.whatsapp_session_add_item(uuid, text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.whatsapp_session_reset(uuid, text, text, jsonb, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.whatsapp_session_reset(uuid, text, text, jsonb, text) TO service_role;

-- next_order_number: make it robust regardless of the inserting role.
ALTER FUNCTION public.next_order_number(uuid) SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- 11. Storage business-assets: public READ stays; writes are service-only
--     (verified: all uploads run through createServiceClient).
-- =============================================================================
DROP POLICY IF EXISTS "business_assets_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "business_assets_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "business_assets_auth_delete" ON storage.objects;

GRANT SELECT ON storage.objects TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON storage.objects FROM anon, authenticated;

-- =============================================================================
-- 12. notifications: keep SELECT by policy; revoke DML from anon/auth
--     (read/unread marking happens server-side via /api/notifications).
-- =============================================================================
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
GRANT SELECT ON public.notifications TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.notifications FROM anon, authenticated;