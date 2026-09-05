import { createServiceClient } from "@/lib/supabase/service";
import { BADGE_DEFINITIONS, type BadgeDefinition } from "./definitions";
import { unlockedBadges } from "./engine";
import { loadCustomerStats, loadOwnedBadgeIds } from "./queries";
import { notifyBadgeUnlocked } from "./notify";

/**
 * Convierte el catálogo al shape que persiste la RPC (UserAwardBadge sin metadatos
 * de motor): solo los datos renderizables en la UI.
 */
function toPersistedShape(badge: BadgeDefinition) {
  return {
    id: badge.id,
    title: badge.title,
    description: badge.description,
    icon: badge.icon,
    emoji: badge.emoji,
    rarity: badge.rarity,
    unlockedAt: new Date().toISOString(),
    awardedBy: "BolivarPide",
    isFeatured: false,
  };
}

/**
 * Otorga las insignias vía RPC SECURITY DEFINER (service_role) y devuelve los ids
 * efectivamente nuevos (la RPC descarta las repetidas). Nunca revierte.
 */
export async function grantBadges(userId: string, badges: BadgeDefinition[]): Promise<string[]> {
  if (badges.length === 0) return [];
  const svc = createServiceClient();
  const payload = badges.map((b) => toPersistedShape(b));
  const { data, error } = await svc.rpc("grant_customer_badges", {
    p_user_id: userId,
    p_badges: payload,
  });
  if (error) throw error;
  const result = data as { ok: boolean; added?: string[]; count?: number; error?: string };
  if (!result?.ok) throw new Error(result?.error ?? "No se pudieron otorgar las insignias");
  return result.added ?? [];
}

/**
 * Evalúa el catálogo contra las stats reales del usuario y otorga + notifica las
 * nuevas. Idempotente: si no hay nada nuevo (o la RPC lo descarta) no notifica.
 * Nunca lanza: los callers la disparan como side-effect y no deben romper su flujo.
 */
export async function evaluateBadgesForUser(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const [stats, ownedIds] = await Promise.all([
      loadCustomerStats(userId),
      loadOwnedBadgeIds(userId),
    ]);
    const newBadges = unlockedBadges(BADGE_DEFINITIONS, stats, ownedIds);
    if (newBadges.length === 0) return;

    const addedIds = await grantBadges(userId, newBadges);
    if (addedIds.length === 0) return;

    const addedSet = new Set(addedIds);
    await Promise.all(
      newBadges
        .filter((b) => addedSet.has(b.id))
        .map((b) => notifyBadgeUnlocked({ userId, badge: b })),
    );
  } catch (err) {
    console.error("evaluateBadgesForUser:", err);
  }
}

/** Evalúa las insignias del cliente que dueño un pedido (tras `delivered`). */
export async function evaluateBadgesForOrder(orderId: string): Promise<void> {
  if (!orderId) return;
  const svc = createServiceClient();
  const { data } = await svc
    .from("orders")
    .select("customer_user_id")
    .eq("id", orderId)
    .maybeSingle();
  const userId = (data as { customer_user_id: string | null } | null)?.customer_user_id;
  if (userId) await evaluateBadgesForUser(userId);
}