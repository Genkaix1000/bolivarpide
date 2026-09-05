-- Enforcement de transiciones de órdenes: RPC SECURITY DEFINER que valida
-- membresía/rol y transición atómicamente (evita races: double-accept, PIN,
-- doble reject). La policy de UPDATE de `orders` pasa a exigir status invariante,
-- así solo este RPC (o service_role) puede mutar el estado.

-- --------------------------------------------------------------------------
-- 1. RPC transition_order_status
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transition_order_status(
  p_order_id uuid,
  p_business_id uuid,
  p_new_status text,
  p_rejection_reason text DEFAULT NULL,
  p_delivery_pin text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_role text;
  v_is_admin boolean;
  v_order RECORD;
  v_now timestamptz := now();
  v_requires_refund boolean := false;
  v_attempts int;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no autenticado');
  END IF;

  v_is_admin := public.is_platform_admin();
  IF v_is_admin THEN
    v_role := 'owner';
  ELSE
    SELECT role INTO v_role
    FROM public.business_members
    WHERE business_id = p_business_id AND user_id = v_user AND status = 'active'
    LIMIT 1;
    IF v_role IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'sin acceso a este comercio');
    END IF;
  END IF;

  SELECT o.status, o.payment_status, o.payment_method, o.delivery_pin,
         o.pin_attempts, o.pin_locked_until
    INTO v_order
    FROM public.orders o
    WHERE o.id = p_order_id AND o.business_id = p_business_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'pedido no encontrado');
  END IF;

  -- `cancelled` es del cliente (cancelación pre-pago) o del sistema.
  IF p_new_status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cancelar es operacion del cliente');
  END IF;

  -- Rechazo (comercio) con motivo
  IF p_new_status = 'rejected' THEN
    IF v_role = 'driver' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'sin permiso para rechazar');
    END IF;
    IF v_order.status IN ('delivered', 'rejected', 'cancelled') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'no se puede rechazar');
    END IF;
    IF p_rejection_reason IS NULL OR length(trim(p_rejection_reason)) < 10 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'motivo minimo 10 caracteres');
    END IF;
    IF v_order.payment_status = 'paid' AND v_order.payment_method IS DISTINCT FROM 'cash' THEN
      v_requires_refund := true;
    END IF;
  ELSIF p_new_status = 'delivered' AND v_order.status <> 'delivering' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'transicion no permitida');
  ELSIF p_new_status = 'delivering' AND v_order.status <> 'preparing' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'transicion no permitida');
  ELSIF p_new_status = 'preparing' AND v_order.status NOT IN ('pending', 'delivering') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'transicion no permitida');
  ELSIF p_new_status = 'pending' AND v_order.status <> 'preparing' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'transicion no permitida');
  END IF;

  -- Entrega requiere PIN correcto (contador + lock con persistencia real)
  IF p_new_status = 'delivered' THEN
    IF v_order.pin_locked_until IS NOT NULL AND v_order.pin_locked_until > v_now THEN
      RETURN jsonb_build_object('ok', false, 'error', 'PIN bloqueado por intentos fallidos');
    END IF;
    IF p_delivery_pin IS NULL OR p_delivery_pin <> v_order.delivery_pin THEN
      v_attempts := COALESCE(v_order.pin_attempts, 0) + 1;
      UPDATE public.orders
        SET pin_attempts = v_attempts,
            pin_locked_until = CASE WHEN v_attempts >= 5 THEN v_now + interval '15 minutes' ELSE NULL END,
            updated_at = v_now
        WHERE id = p_order_id;
      RETURN jsonb_build_object('ok', false, 'error', 'PIN incorrecto');
    END IF;
  END IF;

  UPDATE public.orders
    SET status = p_new_status,
        rejection_reason = CASE WHEN p_new_status = 'rejected' THEN p_rejection_reason ELSE rejection_reason END,
        delivery_pin = CASE
                         WHEN p_new_status = 'delivering' THEN lpad((floor(random() * 9000) + 1000)::int::text, 4, '0')
                         WHEN p_new_status IN ('delivered', 'rejected') THEN NULL
                         ELSE delivery_pin END,
        rejected_at = CASE WHEN p_new_status = 'rejected' THEN v_now ELSE rejected_at END,
        accepted_at = CASE
                         WHEN p_new_status = 'preparing' AND v_order.status = 'pending' THEN v_now
                         WHEN p_new_status = 'pending' THEN NULL
                         ELSE accepted_at END,
        dispatched_at = CASE
                          WHEN p_new_status = 'delivering' THEN v_now
                          WHEN p_new_status = 'preparing' AND v_order.status = 'delivering' THEN NULL
                          ELSE dispatched_at END,
        delivered_at = CASE WHEN p_new_status = 'delivered' THEN v_now ELSE delivered_at END,
        pin_attempts = CASE WHEN p_new_status IN ('delivered', 'rejected') THEN 0 ELSE pin_attempts END,
        pin_locked_until = CASE WHEN p_new_status IN ('delivered', 'rejected') THEN NULL ELSE pin_locked_until END,
        payment_status = CASE
                           WHEN p_new_status = 'preparing' AND v_order.payment_method = 'cash'
                                AND v_order.payment_status = 'awaiting_payment' THEN 'paid'
                           ELSE payment_status END,
        paid_at = CASE
                    WHEN p_new_status = 'preparing' AND v_order.payment_method = 'cash'
                         AND v_order.payment_status = 'awaiting_payment' THEN v_now
                    ELSE paid_at END,
        updated_at = v_now
    WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'ok', true,
    'status', p_new_status,
    'requires_refund', v_requires_refund
  );
END;
$$;

REVOKE ALL ON FUNCTION public.transition_order_status(uuid, uuid, text, text, text)
  FROM public, anon;
GRANT EXECUTE ON FUNCTION public.transition_order_status(uuid, uuid, text, text, text)
  TO authenticated, service_role;

-- --------------------------------------------------------------------------
-- 2. RLS: se revoca el UPDATE directo de `orders` a authenticated. Las
--    mutaciones de pedidos pasan SOLO por este RPC (SECURITY DEFINER) o por
--    service_role (checkout, webhook, cancelación cliente, auto-reject).
--    (No se puede comparar NEW vs OLD en una policy RLS de PostgreSQL.)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "orders_member_update" ON public.orders;
REVOKE UPDATE ON public.orders FROM authenticated;