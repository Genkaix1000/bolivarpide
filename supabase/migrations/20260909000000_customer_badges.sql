-- Insignias de cliente: otorgamiento server-only.
--
-- 1. RPC grant_customer_badges (SECURITY DEFINER): merge idempotente por id sobre
--    user_profiles.awarded_badges (jsonb), con FOR UPDATE para serializar evaluaciones
--    concurrentes del mismo usuario. Solo service_role puede invocarla.
-- 2. REVOKE UPDATE (awarded_badges) a authenticated: el cliente deja de poder escribir
--    la columna; el único escritor es la RPC (permisos de owner por SECURITY DEFINER).
--
-- NOTA: el CHECK de notifications que agrega la categoría 'badges' vive en la migración
-- de reparación 20260909100000 (la tabla notifications no existía en esta DB y se
-- recrea allí ya con 'badges' en su CHECK).

-- --------------------------------------------------------------------------
-- 1. RPC grant_customer_badges
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_customer_badges(
  p_user_id uuid,
  p_badges jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current jsonb;
  v_existing_ids text[] := '{}'::text[];
  v_new_ids text[] := '{}'::text[];
  v_item jsonb;
  v_merge jsonb := '[]'::jsonb;
  v_new_count int := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'usuario requerido');
  END IF;

  -- UPSERT de la fila de perfil si todavía no existe
  INSERT INTO public.user_profiles (user_id, awarded_badges)
  VALUES (p_user_id, '[]'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock de fila: serializa evaluaciones concurrentes del mismo usuario
  SELECT awarded_badges INTO v_current
  FROM public.user_profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_current := COALESCE(v_current, '[]'::jsonb);

  SELECT COALESCE(array_agg(b->>'id'), '{}'::text[])
    INTO v_existing_ids
    FROM jsonb_array_elements(v_current) AS b;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_badges) LOOP
    IF NOT (v_item->>'id' = ANY (v_existing_ids)) THEN
      v_merge := v_merge || jsonb_build_array(v_item);
      v_new_ids := array_append(v_new_ids, v_item->>'id');
      v_new_count := v_new_count + 1;
    END IF;
  END LOOP;

  IF v_new_count > 0 THEN
    UPDATE public.user_profiles
       SET awarded_badges = v_current || v_merge,
           updated_at = now()
     WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'added', v_new_ids, 'count', v_new_count);
END;
$$;

REVOKE ALL ON FUNCTION public.grant_customer_badges(uuid, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.grant_customer_badges(uuid, jsonb) TO service_role;

-- --------------------------------------------------------------------------
-- 2. Revocar escritura directa del cliente sobre awarded_badges
-- --------------------------------------------------------------------------
REVOKE UPDATE (awarded_badges) ON public.user_profiles FROM authenticated;

-- --------------------------------------------------------------------------
-- 3. Índice auxiliar para las queries de stats por cliente
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_customer_delivered
  ON public.orders (customer_user_id)
  WHERE status = 'delivered';