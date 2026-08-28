export type UserAddress = {
  id: string;
  street: string;
  streetNumber: string | null;
  noNumber: boolean;
  deliveryNotes: string;
  contactFirstName: string;
  contactLastName: string;
  contactPhone: string;
  city: string;
  province: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
};

export type UserAddressSummary = {
  id: string;
  label: string;
  isDefault: boolean;
};
