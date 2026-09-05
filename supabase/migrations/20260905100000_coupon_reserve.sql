-- P0 #5: reserva atómica de un uso de cupón. PostgREST no permite incrementos
-- atómicos vía UPDATE, así que se hace en un RPC SECURITY DEFINER con chequeo +
-- escritura en una sola instrucción (evita el TOCTOU del chequeo read-only).
CREATE OR REPLACE FUNCTION public.reserve_coupon_use(p_coupon_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE public.coupons
    SET uses_count = uses_count + 1
    WHERE id = p_coupon_id
      AND is_active = true
      AND (max_uses IS NULL OR uses_count < max_uses);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_coupon_use(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reserve_coupon_use(uuid) TO service_role;