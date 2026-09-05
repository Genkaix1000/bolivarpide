import { requireBusinessAccess } from "@/lib/business/queries";
import { createServiceClient } from "@/lib/supabase/service";
import {
  elapsedMinutes,
  normalizeLifecycleStatus,
} from "@/lib/orders/lifecycle";
import { formatOrderItemsSummary } from "@/lib/orders/active";
import {
  customerDisplayName,
  customerPhone,
  whatsAppUrl,
} from "@/lib/orders/kitchen";
import type {
  ActiveDriver,
  DeliveryOrderRow,
  DeliveryOrderView,
  DispatchOrderView,
  DispatchQueue,
  DriverBoard,
  DriverTab,
  HirableDriver,
} from "./types";

const ORDER_FIELDS =
  "id, order_number, status, customer_user_id, customer_name, customer_phone, fulfillment_type, payment_method, payment_status, total_cents, notes, created_at, updated_at, rejection_reason, delivery_address, delivery_driver_id, assigned_at, order_items(name, quantity, unit_price_cents, note)";

const HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000;

type CustomerProfile = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  identity_verified: boolean | null;
  phone: string | null;
  avatar_type: string | null;
  avatar_value: string | null;
  avatar_gradient_id: string | null;
};

type BusinessWhatsAppRow = {
  status: string | null;
  is_active: boolean | null;
};

// ---------------------------------------------------------------------------
// Helpers puros (testeables sin cliente)
// ---------------------------------------------------------------------------

/** Un pedido es tomable si esta en camino y no tiene repartidor. */
export function canClaimOrder(row: DeliveryOrderRow, userId: string): boolean {
  return row.status === "delivering" && row.delivery_driver_id === null && userId.length > 0;
}

/** A que tab del DriverBoard pertenece un pedido mapeado. */
export function deliveryOrderTab(view: DeliveryOrderView): DriverTab | null {
  if (view.fulfillmentType !== "delivery") return null;
  if (view.status === "preparing" && view.assignedToMe) return "porSalir";
  if (view.status === "delivering" && view.assignedToMe) return "enCamino";
  if (view.status === "delivering" && view.canClaim) return "disponibles";
  if (
    (view.status === "delivered" || view.status === "rejected") &&
    view.assignedToMe
  ) {
    return "historial";
  }
  return null;
}

export function mapDeliveryOrder(
  row: DeliveryOrderRow,
  userId: string,
  customer: CustomerProfile | undefined,
  whatsappConnected: boolean,
): DeliveryOrderView | null {
  const status = normalizeLifecycleStatus(row.status);
  if (!status) return null;
  if (row.fulfillment_type === "pickup") return null;

  const phone = customerPhone(customer, row.customer_phone);
  const customerName = customerDisplayName(customer, row.customer_name);
  const assignedToMe = row.delivery_driver_id !== null && row.delivery_driver_id === userId;

  return {
    id: row.id,
    orderNumber: row.order_number ?? 0,
    status,
    fulfillmentType: "delivery",
    customerName,
    customerVerified: Boolean(customer?.identity_verified),
    customerPhone: phone,
    whatsappUrl:
      whatsappConnected && phone
        ? whatsAppUrl(
            phone,
            `Hola, te escribo por tu pedido #${row.order_number ?? 0} en BolivarPide.`,
          )
        : null,
    deliveryAddress: row.delivery_address,
    itemsSummary: formatOrderItemsSummary(row.order_items ?? []),
    notes: row.notes,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    totalCents: row.total_cents ?? 0,
    createdAt: row.created_at,
    elapsedMinutes: elapsedMinutes(row.created_at),
    deliveryDriverId: row.delivery_driver_id,
    assignedToMe,
    canClaim: canClaimOrder(row, userId),
    rejectionReason: row.rejection_reason,
  };
}

export function mapDispatchOrder(
  row: DeliveryOrderRow,
  driverNameById: (driverId: string) => string | null,
): DispatchOrderView | null {
  const status = normalizeLifecycleStatus(row.status);
  if (!status || (status !== "preparing" && status !== "delivering")) return null;
  if (row.fulfillment_type === "pickup") return null;

  return {
    id: row.id,
    orderNumber: row.order_number ?? 0,
    status,
    customerName: row.customer_name?.trim() || "Cliente",
    deliveryAddress: row.delivery_address,
    itemsSummary: formatOrderItemsSummary(row.order_items ?? []),
    totalCents: row.total_cents ?? 0,
    elapsedMinutes: elapsedMinutes(row.created_at),
    createdAt: row.created_at,
    driverId: row.delivery_driver_id,
    driverName:
      row.delivery_driver_id ? driverNameById(row.delivery_driver_id) : null,
    assignedAt: row.assigned_at,
  };
}

/** Remove de asignacion al revertir/rechazar/cancelar (usado por actions). */
export function cleanupAssignmentPatch(): {
  delivery_driver_id: null;
  assigned_at: null;
} {
  return { delivery_driver_id: null, assigned_at: null };
}

export function driverDisplayName(
  profile: { first_name: string | null; last_name: string | null; display_name: string | null } | undefined,
  fallback: string | null,
): string {
  const first = profile?.first_name?.trim();
  const last = profile?.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  if (fallback?.trim()) return fallback.trim();
  return "Repartidor";
}

export function driverInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? "RD").toUpperCase();
}

// ---------------------------------------------------------------------------
// Consultas de servidor (authz + service client, mismo patron que kitchen)
// ---------------------------------------------------------------------------

export async function listDriverDeliveries(
  businessId: string,
  userId: string,
): Promise<DriverBoard> {
  await requireBusinessAccess(businessId);
  const svc = createServiceClient();
  const since = new Date(Date.now() - HISTORY_WINDOW_MS).toISOString();

  const [mineRes, availRes, histRes, waRes] = await Promise.all([
    svc
      .from("orders")
      .select(ORDER_FIELDS)
      .eq("business_id", businessId)
      .eq("delivery_driver_id", userId)
      .neq("fulfillment_type", "pickup")
      .in("status", ["preparing", "delivering"])
      .order("created_at", { ascending: false }),
    svc
      .from("orders")
      .select(ORDER_FIELDS)
      .eq("business_id", businessId)
      .is("delivery_driver_id", null)
      .eq("status", "delivering")
      .neq("fulfillment_type", "pickup")
      .order("created_at", { ascending: false }),
    svc
      .from("orders")
      .select(ORDER_FIELDS)
      .eq("business_id", businessId)
      .eq("delivery_driver_id", userId)
      .neq("fulfillment_type", "pickup")
      .in("status", ["delivered", "rejected"])
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(20),
    svc
      .from("business_whatsapp")
      .select("status, is_active")
      .eq("business_id", businessId)
      .maybeSingle(),
  ]);

  const error = mineRes.error ?? availRes.error ?? histRes.error ?? waRes.error;
  if (error) throw error;

  const rows = [
    ...(mineRes.data ?? []),
    ...(availRes.data ?? []),
    ...(histRes.data ?? []),
  ] as unknown as DeliveryOrderRow[];

  const profiles = await fetchProfiles(rows);
  const whatsappConnected =
    (waRes.data as BusinessWhatsAppRow | null)?.status === "connected" &&
    (waRes.data as BusinessWhatsAppRow | null)?.is_active === true;

  const views = rows
    .map((row) =>
      mapDeliveryOrder(
        row,
        userId,
        row.customer_user_id ? profiles.get(row.customer_user_id) : undefined,
        whatsappConnected,
      ),
    )
    .filter((v): v is DeliveryOrderView => v != null);

  const byCreatedAsc = (a: DeliveryOrderView, b: DeliveryOrderView) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  const byCreatedDesc = (a: DeliveryOrderView, b: DeliveryOrderView) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

  const board: DriverBoard = {
    enCamino: [],
    disponibles: [],
    porSalir: [],
    historial: [],
  };
  for (const view of views) {
    switch (deliveryOrderTab(view)) {
      case "enCamino":
        board.enCamino.push(view);
        break;
      case "disponibles":
        board.disponibles.push(view);
        break;
      case "porSalir":
        board.porSalir.push(view);
        break;
      case "historial":
        board.historial.push(view);
        break;
    }
  }
  board.enCamino.sort(byCreatedAsc);
  board.disponibles.sort(byCreatedAsc);
  board.porSalir.sort(byCreatedAsc);
  board.historial.sort(byCreatedDesc);

  return board;
}

export async function listDispatchQueue(
  businessId: string,
): Promise<DispatchQueue> {
  await requireBusinessAccess(businessId);
  const svc = createServiceClient();

  const [enCocinaRes, enRepartoRes, driversRes] = await Promise.all([
    svc
      .from("orders")
      .select(ORDER_FIELDS)
      .eq("business_id", businessId)
      .neq("fulfillment_type", "pickup")
      .eq("status", "preparing")
      .order("created_at", { ascending: true }),
    svc
      .from("orders")
      .select(ORDER_FIELDS)
      .eq("business_id", businessId)
      .neq("fulfillment_type", "pickup")
      .eq("status", "delivering")
      .order("created_at", { ascending: true }),
    svc
      .from("business_members")
      .select("user_id")
      .eq("business_id", businessId)
      .eq("role", "driver")
      .eq("status", "active"),
  ]);

  const error = enCocinaRes.error ?? enRepartoRes.error ?? driversRes.error;
  if (error) throw error;

  const enCocinaRows = enCocinaRes.data as unknown as DeliveryOrderRow[];
  const enRepartoRows = enRepartoRes.data as unknown as DeliveryOrderRow[];
  const activeDriverIds = (driversRes.data ?? [])
    .map((m) => (m as { user_id: string }).user_id)
    .filter(Boolean);

  // Resolver nombres de drivers: activos + los referenciados por pedidos en
  // cola (cubrir reasignación de un driver que dejó de estar activo).
  const referencedIds = [
    ...new Set(
      [...enCocinaRows, ...enRepartoRows]
        .map((r) => r.delivery_driver_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const allDriverIds = [...new Set([...activeDriverIds, ...referencedIds])];

  const nameById = await fetchDriverNames(allDriverIds, svc);

  const { data: deliveringRows } = await svc
    .from("orders")
    .select("delivery_driver_id")
    .eq("business_id", businessId)
    .eq("status", "delivering");
  const counts = new Map<string, number>();
  for (const row of deliveringRows ?? []) {
    const id = (row as { delivery_driver_id: string | null }).delivery_driver_id;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const drivers: ActiveDriver[] = activeDriverIds.map((id) => {
    const display = nameById.get(id) ?? "Repartidor";
    return {
      userId: id,
      displayName: display,
      initials: driverInitials(display),
      activeDeliveriesCount: counts.get(id) ?? 0,
    };
  });

  const byCreatedAsc = (a: DispatchOrderView, b: DispatchOrderView) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

  const enCocina = enCocinaRows
    .map((row) => mapDispatchOrder(row, (id) => nameById.get(id) ?? null))
    .filter((v): v is DispatchOrderView => v != null)
    .sort(byCreatedAsc);

  const enReparto = enRepartoRows
    .map((row) => mapDispatchOrder(row, (id) => nameById.get(id) ?? null))
    .filter((v): v is DispatchOrderView => v != null)
    .sort(byCreatedAsc);

  return { enCocina, enReparto, drivers };
}

/** Enruta todos los drivers activos de un negocio (reuso desde la UI). */
export async function listActiveDrivers(businessId: string): Promise<ActiveDriver[]> {
  const queue = await listDispatchQueue(businessId);
  return queue.drivers;
}

/** Repartidores aprobados por la plataforma que NO son miembros del negocio
 * (candidatos a contratar). Excluye cualquier fila previa en business_members. */
export async function listHirableDrivers(businessId: string): Promise<HirableDriver[]> {
  await requireBusinessAccess(businessId);
  const svc = createServiceClient();

  const { data: profiles } = await svc
    .from("delivery_profiles")
    .select("user_id, vehicle_type")
    .eq("status", "approved");
  if (!profiles?.length) return [];

  const candidateIds = (profiles as { user_id: string; vehicle_type: string }[]).map(
    (p) => p.user_id,
  );

  const { data: members } = await svc
    .from("business_members")
    .select("user_id")
    .eq("business_id", businessId)
    .in("user_id", candidateIds);
  const memberIds = new Set((members ?? []).map((m) => (m as { user_id: string }).user_id));

  const candidates = (profiles as { user_id: string; vehicle_type: string }[]).filter(
    (p) => !memberIds.has(p.user_id),
  );
  if (candidates.length === 0) return [];

  const { VEHICLE_LABELS } = await import("@/lib/delivery/profile");
  const { data: users } = await svc
    .from("user_profiles")
    .select("user_id, first_name, last_name, display_name")
    .in("user_id", candidates.map((c) => c.user_id));
  const nameById = new Map(
    ((users ?? []) as Array<{
      user_id: string;
      first_name: string | null;
      last_name: string | null;
      display_name: string | null;
    }>).map((u) => [u.user_id, driverDisplayName(u, null)]),
  );

  return candidates.map((c) => {
    const display = nameById.get(c.user_id) ?? "Repartidor";
    return {
      userId: c.user_id,
      displayName: display,
      initials: driverInitials(display),
      vehicleLabel:
        VEHICLE_LABELS[c.vehicle_type as keyof typeof VEHICLE_LABELS] ?? c.vehicle_type,
    };
  });
}

// ---------------------------------------------------------------------------
// Internos
// ---------------------------------------------------------------------------

async function fetchProfiles(rows: DeliveryOrderRow[]): Promise<Map<string, CustomerProfile>> {
  const svc = createServiceClient();
  const userIds = [
    ...new Set(rows.map((r) => r.customer_user_id).filter((id): id is string => Boolean(id))),
  ];
  const profiles = new Map<string, CustomerProfile>();
  if (userIds.length === 0) return profiles;

  const { data } = await svc
    .from("user_profiles")
    .select(
      "user_id, first_name, last_name, display_name, identity_verified, phone, avatar_type, avatar_value, avatar_gradient_id",
    )
    .in("user_id", userIds);
  for (const p of data ?? []) profiles.set((p as CustomerProfile).user_id, p as CustomerProfile);
  return profiles;
}

async function fetchDriverNames(
  userIds: string[],
  svc: ReturnType<typeof createServiceClient>,
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (userIds.length === 0) return names;

  const { data } = await svc
    .from("user_profiles")
    .select("user_id, first_name, last_name, display_name")
    .in("user_id", userIds);
  for (const row of data ?? []) {
    const u = row as {
      user_id: string;
      first_name: string | null;
      last_name: string | null;
      display_name: string | null;
    };
    names.set(u.user_id, driverDisplayName(u, null));
  }
  return names;
}