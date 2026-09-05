/** Reglas y validaciones puras del onboarding de repartidor (sin server). */

export type DeliveryVehicleType = "bicycle" | "motorcycle" | "car" | "on_foot";

export type DriverApplicationStatus = "pending_review" | "approved" | "rejected";

export type DriverDocKind = "dni_front" | "dni_back" | "license";

export const DELIVERY_VEHICLES: DeliveryVehicleType[] = [
  "bicycle",
  "motorcycle",
  "car",
  "on_foot",
];

/** Prefijos válidos de CUIL/CUIT de persona humana (AFIP). */
const CUIL_PREFIXES = new Set([20, 23, 24, 27]);
const CUIL_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** Valida un CUIL (11 dígitos, módulo 11, prefijo de persona). */
export function cuilValidate(value: string): boolean {
  const digits = (value ?? "").replace(/[^0-9]/g, "");
  if (digits.length !== 11) return false;

  const prefix = Number(digits.slice(0, 2));
  if (!CUIL_PREFIXES.has(prefix)) return false;

  let acc = 0;
  for (let i = 0; i < 10; i++) acc += Number(digits[i]) * CUIL_WEIGHTS[i];

  const rest = acc % 11;
  const verifier =
    rest === 0 ? 0 : rest === 1 ? 9 : 11 - rest;

  return Number(digits[10]) === verifier;
}

/** Qué documentos exige cada vehículo (bici y a pie: solo DNI frente + dorso). */
export function requiredDocsForVehicle(vehicle: DeliveryVehicleType): DriverDocKind[] {
  switch (vehicle) {
    case "motorcycle":
    case "car":
      return ["dni_front", "dni_back", "license"];
    case "bicycle":
    case "on_foot":
      return ["dni_front", "dni_back"];
  }
}

export const VEHICLE_LABELS: Record<DeliveryVehicleType, string> = {
  bicycle: "Bicicleta",
  motorcycle: "Moto",
  car: "Auto",
  on_foot: "A pie",
};

export const VEHICLE_ICONS: Record<DeliveryVehicleType, string> = {
  bicycle: "pedal_bike",
  motorcycle: "two_wheeler",
  car: "directions_car",
  on_foot: "directions_walk",
};

export const DRIVER_AVAILABILITY: { id: string; label: string }[] = [
  { id: "flexible", label: "Horarios flexibles / cuando esté disponible" },
  { id: "noches", label: "Turno noche / cenas (19:30 a 00:00)" },
  { id: "mediodia", label: "Turno mediodía / almuerzos (11:30 a 15:00)" },
  { id: "completo", label: "Turno completo" },
];

/** Formatos de documentos aceptados y límite (mismo contrato que el servidor). */
export const DRIVER_DOC_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
export const DRIVER_DOC_MAX_BYTES = 5 * 1024 * 1024;

export function driverDocInvalidReason(file: { type: string; size: number }): string | null {
  if (!DRIVER_DOC_ALLOWED_TYPES.has(file.type)) {
    return "Formato no soportado: usá JPG, PNG, WebP o PDF.";
  }
  if (file.size > DRIVER_DOC_MAX_BYTES) {
    return "El documento debe pesar menos de 5 MB.";
  }
  return null;
}