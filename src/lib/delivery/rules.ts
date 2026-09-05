/** Reglas puras del dominio de reparto (sin "use server": testeables y
 * reutilizables por actions/UI). */

export type DeliveryRole = "owner" | "staff" | "driver";

/** owner/staff gestionan la cola; el driver solo toma. */
export function isDeliveryManager(role: string | null | undefined): boolean {
  return role === "owner" || role === "staff";
}

/** Sin razón de bloqueo => null; con razón => mensaje para el usuario. */
export function assignmentBlockReason(input: {
  status: string;
  fulfillment_type: string | null;
}): string | null {
  if (input.fulfillment_type === "pickup") {
    return "Un retiro no se asigna a reparto";
  }
  if (input.status !== "preparing" && input.status !== "delivering") {
    return "No se puede asignar en este estado";
  }
  return null;
}