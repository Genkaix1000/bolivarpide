"use server";

import { requireBusinessAccess } from "@/lib/business/queries";
import { createServiceClient } from "@/lib/supabase/service";
import { isValidLatLng } from "@/lib/delivery/location";

type LocationResult = { ok: true } | { ok: false; error: string };

/**
 * Comparte la posición GPS del repartidor para un pedido en reparto.
 * Autoriza: el propio repartidor asignado (`orders.delivery_driver_id = driver`),
 * con el pedido en `delivering` y entrega a domicilio (`fulfillment_type='delivery'`).
 * La escritura va con service_role (RLS de `delivery_locations` no permite INSERT
 * a authenticated), igual que orders/delivery_profiles.
 *
 * El throttle de persistencia (cada ~10 s) lo hace el cliente; acá solo se valida
 * y se persiste. No usamos estado en memoria del server: es frágil en multi-instancia
 * y el caudal máximo por driver está acotado por el muestreo del GPS (≈6 filas/min).
 */
export async function shareDeliveryLocationAction(input: {
  businessId: string;
  orderId: string;
  lat: number;
  lng: number;
}): Promise<LocationResult> {
  if (!isValidLatLng(input.lat, input.lng)) {
    return { ok: false, error: "Coordenadas inválidas" };
  }

  const { user, member, isAdmin } = await requireBusinessAccess(input.businessId);
  const role = member?.role ?? (isAdmin ? "owner" : "staff");
  if (role !== "driver") {
    return { ok: false, error: "Solo repartidores pueden compartir ubicación" };
  }

  const svc = createServiceClient();

  // El repartidor solo comparte posiciones de pedidos que le asignaron a él,
  // que estén en camino y que sean de entrega a domicilio.
  const { data: order } = await svc
    .from("orders")
    .select("id, status, fulfillment_type")
    .eq("id", input.orderId)
    .eq("business_id", input.businessId)
    .eq("delivery_driver_id", user.id)
    .maybeSingle();
  if (!order) {
    return { ok: false, error: "El pedido no está asignado a vos" };
  }
  if (order.status !== "delivering") {
    return { ok: false, error: "Solo se comparte durante el reparto" };
  }
  if (order.fulfillment_type === "pickup") {
    return { ok: false, error: "Un retiro no comparte ubicación" };
  }

  const { error: insertError } = await svc.from("delivery_locations").insert({
    order_id: input.orderId,
    driver_user_id: user.id,
    lat: input.lat,
    lng: input.lng,
  });
  if (insertError) return { ok: false, error: insertError.message };

  return { ok: true };
}

/**
 * Detiene el compartir y borra las posiciones guardadas del pedido.
 * Se llama al "Dejar de compartir" y al confirmar la entrega (limpia datos
 * sensibles de ubicación una vez cerrado el reparto).
 */
export async function stopSharingLocationAction(input: {
  businessId: string;
  orderId: string;
}): Promise<LocationResult> {
  const { user, member, isAdmin } = await requireBusinessAccess(input.businessId);
  const role = member?.role ?? (isAdmin ? "owner" : "staff");
  if (role !== "driver") {
    return { ok: false, error: "Solo repartidores pueden detener el compartir" };
  }

  const svc = createServiceClient();

  // Solo el repartidor asignado detiene el suyo (evita borrar el de otro driver).
  const { data: order } = await svc
    .from("orders")
    .select("id")
    .eq("id", input.orderId)
    .eq("business_id", input.businessId)
    .eq("delivery_driver_id", user.id)
    .maybeSingle();
  if (!order) {
    return { ok: false, error: "El pedido no está asignado a vos" };
  }

  const { error } = await svc
    .from("delivery_locations")
    .delete()
    .eq("order_id", input.orderId);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
