import type { UserAddress, UserAddressSummary } from "@/lib/addresses/types";
import { formatAddressLabel } from "@/lib/addresses/display";

export type AddressRow = {
  id: string;
  user_id: string;
  street: string;
  street_number: string | null;
  no_number: boolean;
  delivery_notes: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  city: string;
  province: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
};

export function rowToAddress(row: AddressRow): UserAddress {
  return {
    id: row.id,
    street: row.street,
    streetNumber: row.street_number,
    noNumber: row.no_number,
    deliveryNotes: row.delivery_notes,
    contactFirstName: row.contact_first_name,
    contactLastName: row.contact_last_name,
    contactPhone: row.contact_phone,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    lat: row.lat,
    lng: row.lng,
    isDefault: row.is_default,
  };
}

export function addressToSummary(addr: UserAddress): UserAddressSummary {
  return {
    id: addr.id,
    label: formatAddressLabel(addr),
    isDefault: addr.isDefault,
  };
}

export function addressToRow(
  userId: string,
  addr: UserAddress,
): Omit<AddressRow, "id"> & { id?: string } {
  return {
    id: addr.id,
    user_id: userId,
    street: addr.street,
    street_number: addr.streetNumber,
    no_number: addr.noNumber,
    delivery_notes: addr.deliveryNotes,
    contact_first_name: addr.contactFirstName,
    contact_last_name: addr.contactLastName,
    contact_phone: addr.contactPhone,
    city: addr.city,
    province: addr.province,
    postal_code: addr.postalCode,
    lat: addr.lat,
    lng: addr.lng,
    is_default: addr.isDefault,
  };
}
