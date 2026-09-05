/**
 * Jerarquía de estados de un mensaje saliente (puro, sin I/O).
 *
 * Meta no garantiza el orden de entrega de los webhooks de estado: el `read`
 * puede llegar antes que el `delivered` del mismo mensaje. El webhook
 * escribía el estado sin condición, así que un `delivered` tardío hacía
 * retroceder un mensaje ya leído y el doble tilde azul desaparecía.
 */

export type OutboundStatus = "sent" | "delivered" | "read" | "failed" | "rejected";

const RANK: Record<OutboundStatus, number> = {
  sent: 1,
  delivered: 2,
  read: 3,
  // Terminales: un fallo reportado por Meta siempre pisa el progreso previo,
  // porque es la única señal de que el mensaje no llegó.
  failed: 4,
  rejected: 4,
};

export function isOutboundStatus(value: string): value is OutboundStatus {
  return value in RANK;
}

export function statusRank(status: OutboundStatus): number {
  return RANK[status];
}

/**
 * Estados desde los cuales se puede avanzar a `next` sin retroceder.
 * Se usa como filtro del UPDATE (`.in("status", …)`), así la condición se
 * evalúa en la base y dos webhooks concurrentes no se pisan.
 */
export function statusesBelow(next: OutboundStatus): OutboundStatus[] {
  const target = RANK[next];
  return (Object.keys(RANK) as OutboundStatus[]).filter((s) => RANK[s] < target);
}

/** ¿Pasar de `current` a `next` es avanzar? */
export function canAdvanceStatus(current: OutboundStatus, next: OutboundStatus): boolean {
  return RANK[next] > RANK[current];
}
