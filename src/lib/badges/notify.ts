import { insertNotification } from "@/lib/notifications/repository";
import type { BadgeDefinition } from "./definitions";

export async function notifyBadgeUnlocked(input: {
  userId: string;
  badge: BadgeDefinition;
}): Promise<void> {
  await insertNotification({
    userId: input.userId,
    category: "badges",
    priority: 1,
    title: `¡Insignia desbloqueada: ${input.badge.title}!`,
    body: input.badge.description,
    emoji: input.badge.emoji ?? null,
    icon: input.badge.icon,
    entityType: "badge",
    entityId: input.badge.id,
    dedupeKey: `badge:${input.userId}:${input.badge.id}`,
  });
}