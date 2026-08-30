import { formatFullDeliveryAddress } from "@/lib/addresses/display";
import { rowToAddress, type AddressRow } from "@/lib/addresses/db";
import { BOLIVAR_CENTER } from "@/lib/addresses/constants";
import type { LatLng } from "@/lib/addresses/mapProjection";
import { resolveMpStoreLocation } from "@/lib/mercadopago/storeLocation";
import { createServiceClient } from "@/lib/supabase/service";
import type { OrderLifecycleStatus } from "@/lib/orders/lifecycle";

export type OrderTrackingMapData = {
  showMap: boolean;
  fulfillmentType: "delivery" | "pickup";
  business: LatLng & { label: string };
  destination: (LatLng & { label: string }) | null;
};

async function businessCoords(
  businessId: string,
  address: string | null,
): Promise<LatLng> {
  const svc = createServiceClient();
  const { data: store } = await svc
    .from("mp_stores")
    .select("location")
    .eq("business_id", businessId)
    .maybeSingle();

  const loc = store?.location as { latitude?: number; longitude?: number } | null;
  if (typeof loc?.latitude === "number" && typeof loc?.longitude === "number") {
    return { lat: loc.latitude, lng: loc.longitude };
  }

  const resolved = await resolveMpStoreLocation({ address });
  return { lat: resolved.latitude, lng: resolved.longitude };
}

function pickDestinationCoords(
  rows: AddressRow[],
  deliveryAddress: string | null,
): LatLng | null {
  const addrs = rows.map(rowToAddress);
  if (deliveryAddress?.trim()) {
    const normalized = deliveryAddress.trim();
    const match = addrs.find((a) => formatFullDeliveryAddress(a) === normalized);
    if (match?.lat != null && match.lng != null) return { lat: match.lat, lng: match.lng };
  }
  const withCoords = addrs.find((a) => a.lat != null && a.lng != null);
  if (withCoords?.lat != null && withCoords.lng != null) {
    return { lat: withCoords.lat, lng: withCoords.lng };
  }
  return null;
}

export async function resolveOrderTrackingMap(input: {
  businessId: string;
  businessName: string;
  businessAddress: string | null;
  fulfillmentType: string | null;
  deliveryAddress: string | null;
  customerUserId: string;
  status: OrderLifecycleStatus;
}): Promise<OrderTrackingMapData | null> {
  if (input.status === "rejected") return null;

  const fulfillmentType = input.fulfillmentType === "pickup" ? "pickup" : "delivery";
  const business = await businessCoords(input.businessId, input.businessAddress);

  if (fulfillmentType === "pickup") {
    return {
      showMap: true,
      fulfillmentType,
      business: { ...business, label: input.businessName },
      destination: null,
    };
  }

  const svc = createServiceClient();
  const { data: rows } = await svc
    .from("user_addresses")
    .select("*")
    .eq("user_id", input.customerUserId);

  const destCoords =
    pickDestinationCoords((rows ?? []) as AddressRow[], input.deliveryAddress) ?? BOLIVAR_CENTER;

  return {
    showMap: true,
    fulfillmentType,
    business: { ...business, label: input.businessName },
    destination: {
      ...destCoords,
      label: input.deliveryAddress?.trim() || "Tu dirección",
    },
  };
}
