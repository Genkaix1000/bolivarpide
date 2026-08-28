import type { UserAddress } from "@/lib/addresses/types";

export function formatAddressLabel(addr: Pick<UserAddress, "street" | "streetNumber" | "noNumber">) {
  const street = addr.street.trim();
  if (addr.noNumber || !addr.streetNumber?.trim()) return street;
  return `${street} ${addr.streetNumber.trim()}`;
}
