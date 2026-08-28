export const MAX_USER_ADDRESSES = 3;

export const BOLIVAR_DEFAULTS = {
  city: "San Carlos de Bolívar",
  province: "Buenos Aires",
  postalCode: "6550",
} as const;

/** Centro aproximado de San Carlos de Bolívar, BA */
export const BOLIVAR_CENTER = { lat: -36.2307, lng: -61.1189 };

/** Radio máximo en km para aceptar coordenadas */
export const BOLIVAR_RADIUS_KM = 15;
