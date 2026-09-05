-- Panel de reparto: asignación opcional repartidor → pedido.
-- El reparto es ORTOGONAL a la máquina de estados: `orders` sigue mutando su
-- estado solo via public.transition_order_status (RPC SECURITY DEFINER) o
-- service_role. El UPDATE de `orders` por authenticated sigue revocado.
-- La asignación se escribe únicamente por server actions con service_role,
-- tras requireBusinessAccess + check de rol.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

COMMENT ON COLUMN public.orders.delivery_driver_id IS
  'Repartidor asignado a la entrega (null = disponible para tomar).';
COMMENT ON COLUMN public.orders.assigned_at IS
  'Momento de asignacion/toma del repartidor.';

-- Consultas del driver (En camino / Por salir) y de Disponibles.
CREATE INDEX IF NOT EXISTS idx_orders_delivery_driver
  ON public.orders (delivery_driver_id)
  WHERE status IN ('preparing', 'delivering');

-- Backfill idempotente: limpia asignaciones de filas preexistentes que ya
-- estan fuera de reparto activo (sin valor historico). Las filas NUEVAS
-- conservan el driver como historico al llegar a delivered; este UPDATE solo
-- limpia datos preexistentes si los hubiera.
UPDATE public.orders
SET delivery_driver_id = NULL, assigned_at = NULL
WHERE status IN ('delivered', 'rejected', 'cancelled')
  AND delivery_driver_id IS NOT NULL;