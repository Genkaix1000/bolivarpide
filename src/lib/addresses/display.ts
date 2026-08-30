import type { UserAddress } from "@/lib/addresses/types";

export function formatAddressLabel(addr: Pick<UserAddress, "street" | "streetNumber" | "noNumber">) {
  const street = addr.street.trim();
  if (addr.noNumber || !addr.streetNumber?.trim()) return street;
  return `${street} ${addr.streetNumber.trim()}`;
}

/** Línea completa para guardar en orders.delivery_address */
export function formatFullDeliveryAddress(addr: UserAddress): string {
  const line = formatAddressLabel(addr);
  const city = addr.city.trim();
  let out = city ? `${line}, ${city}` : line;
  const notes = addr.deliveryNotes?.trim();
  if (notes) out += ` · ${notes}`;
  return out;
}
