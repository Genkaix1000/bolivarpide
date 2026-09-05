# TDD 01 — Arquitectura y contratos

## Dominio de reglas puras — `src/lib/badges/` (sin `"use server"`)

### `src/lib/badges/definitions.ts`

```typescript
export type BadgeMetric =
  | "profile_complete" | "identity_verified" | "addresses_count" | "favorites_count"
  | "orders_delivered" | "spent_total_cents" | "paid_digital_orders" | "best_streak_days";

export interface BadgeDefinition {
  id: string;                 // "perfil-completo"
  title: string;              // "Perfil completo"
  description: string;        // incluye el requisito ("Completá tu perfil con foto y dirección")
  icon: string;               // Material Symbol (verificar en fonts.google.com/icons)
  emoji?: string;             // fallback visual
  rarity: BadgeRarity;        // re-exporta de "@/lib/userProfile"
  metric: BadgeMetric;
  target: number;             // umbral: 1, 5, 100000…
}

export const BADGE_DEFINITIONS: BadgeDefinition[];   // catálogo v1 (12)
```

- Reutiliza `BadgeRarity` y la forma visual de `UserAwardBadge` (`src/lib/userProfile.ts`) para que la UI no cambie de shape.
- `BADGE_DEFINITIONS` es solo datos: agregar una insignia nueva no toca el motor.
- Se elimina `INITIAL_AWARDED_BADGES` (dead code) o se reemplaza su rol por el catálogo.

### `src/lib/badges/engine.ts`

```typescript
export interface CustomerStats {
  profileComplete: boolean;
  identityVerified: boolean;
  addressesCount: number;
  favoritesCount: number;
  ordersDelivered: number;
  spentTotalCents: number;
  paidDigitalOrders: number;
  bestStreakDays: number;
}

export function metricValue(stats: CustomerStats, metric: BadgeMetric): number;
// profile_complete / identity_verified → 0|1; addresses_count → número; etc.

export function isBadgeEarned(def: BadgeDefinition, stats: CustomerStats): boolean;
// metricValue(stats, def.metric) >= def.target

export function computeBestStreak(deliveredDates: string[]): number;
// fechas ISO "YYYY-MM-DD" (DISTINCT); devuelve la racha con más días consecutivos

export function unlockedBadges(
  defs: readonly BadgeDefinition[],
  stats: CustomerStats,
  ownedIds: readonly string[],
): BadgeDefinition[];
// filtro: isBadgeEarned && !ownedIds.includes(id)
```

## Estadísticas — `src/lib/badges/queries.ts` (server-only)

```typescript
import { createServiceClient } from "@/lib/supabase/service";

export async function loadCustomerStats(userId: string): Promise<CustomerStats>;
```

- **Perfil**: `user_profiles` `display_name`, `avatar_type`, `avatar_value`, `primary_address`,
  `identity_verified` → `profileComplete = !!(displayName && avatar.type !== "initials" && primaryAddress)`.
- **Direcciones**: `user_addresses` COUNT(`user_id`).
- **Favoritos**: `product_likes` COUNT(`user_id`).
- **Pedidos** (todos `customer_user_id = userId`, service client):
  - `ordersDelivered` = COUNT `status='delivered'` (o `status='delivered' AND delivered_at IS NOT NULL`).
  - `spentTotalCents` = SUM(`total_cents`) sobre `status='delivered'`.
  - `paidDigitalOrders` = COUNT `status='delivered' AND payment_status='paid' AND payment_method <> 'cash'`.
  - `deliveredDates` = DISTINCT `delivered_at::date` → `computeBestStreak`.

## Otorgamiento y notificación — `src/lib/badges/actions.ts` y `notify.ts`

```typescript
// actions.ts (server-only, sin "use server" — se invoca desde otras server actions)
export async function evaluateBadgesForUser(userId: string): Promise<void>;
export async function evaluateBadgesForOrder(orderId: string): Promise<void>;
// → loadCustomerStats(userId) → unlockedBadges(...)
//   → grantBadges (service client → RPC grant_customer_badges)
//   → por cada badge agregada: notifyBadgeUnlocked

export async function grantBadges(userId: string, badges: BadgeDefinition[]): Promise<string[]>;
// devuelve los ids EFECTIVAMENTE nuevos (para solo notificar los que sí se agregaron)

// notify.ts
export async function notifyBadgeUnlocked(input: {
  userId: string; badge: BadgeDefinition;
}): Promise<void>;
// insertNotification({ userId, category: "badges", priority: 1,
//   title: badge.title, body: badge.description, icon: badge.icon, emoji: badge.emoji,
//   entityType: "badge", entityId: badge.id, dedupeKey: `badge:${userId}:${badge.id}` })
// → reutiliza src/lib/notifications/repository.ts (service client, upsert dedupe)
```

## Hooks (puntos de evaluación)

- **Entrega**: en `advanceOrderStatus` (`src/lib/orders/actions.ts`), dentro de un nuevo `after(async () => {...})`:
  `if (input.targetStatus === "delivered") → import("@/lib/badges/actions").evaluateBadgesForOrder(input.orderId)`
  (mismo patrón que el bloque `stopSharingLocationAction` existente, id extra de catch+log).
- **Onboarding** (tras el write del hito, try/catch que no falle la acción):
  - `saveUserProfileAction` (post upsert, solo si `profileComplete` computado nuevo) → `evaluateBadgesForUser(user.id)`.
  - `verifyIdentityAction` (post `identity_verified=true`) → `evaluateBadgesForUser(user.id)`.
  - `saveUserAddressAction` (solo insert, `isFirst`) y `restoreUserAddressAction` → `evaluateBadgesForUser(user.id)`.
  - `toggleProductLike` (solo cuando `user` y resultó `liked=true`) → `evaluateBadgesForUser(user.id)`.

## Cambio de escritura de perfil (anti pisado)

- `src/lib/userProfileDb.ts`:
  - `profileToRow` **deja de incluir** `awarded_badges` (borrar la línea `awarded_badges: profile.awardedBadges`); el tipo de retorno pasa a `Omit<ProfileRow, "user_id" | "awarded_badges">`.
  - `rowToProfile` **conserva** la lectura (`featured_badges` mapeada igual que hoy): el fetch del cliente sigue trayendo las insignias.
- `src/lib/userProfileActions.ts`: el upsert ya no toca la columna (porque sale de `profileToRow`).
- `UserProfileProvider` / `ProfileView` no cambian su lectura: siguen usando `profile.awardedBadges`.

## Notificación y tipos

- `src/lib/notifications/types.ts`: `NotificationCategory` agrega `"badges"`; `NotificationTab` y `CUSTOMER_TABS` agregan la pestaña `{ id: "badges", label: "Logros" }` (en `display.ts`).
- No hace falta tocar `mapRow`/`parsePayload` (los campos del badge van en `title`/`icon`/`emoji`/`entityId`).

## UI — componentes

- `src/components/profile/ProfileView.tsx`:
  - La sección "Insignias" pasa a listar `BADGE_DEFINITIONS` completo: ganada (id ∈ `profile.awardedBadges`) a color; si no, silueta `grayscale opacity-40` con "Aún no desbloqueada".
  - Contador `ganadas / total` en lugar del `<span>{length}</span>` actual.
  - Detecta insignias nuevas: snapshot de ids al montar (ref) vs ids actuales → si hay nuevas, setea `celebrationBadge` y abre el modal.
- `src/components/profile/BadgeUnlockedModal.tsx` (nuevo): variante celebratoria con animación (spring, estilo `BadgeDetailModal`) que muestra el badge desbloqueado y botón "¡Seguí así!".
- `src/components/BadgeDetailModal.tsx`: acepta estado `locked?: boolean`; para bloqueadas muestra "Bloqueada" en lugar de fecha/otorgador ficticios.

## Tabla de archivos

| Archivo | Rol |
|---------|-----|
| `src/lib/badges/definitions.ts` | Catálogo de insignias (datos) + `BadgeMetric`/`BadgeDefinition` |
| `src/lib/badges/engine.ts` | Reglas puras: `metricValue`, `isBadgeEarned`, `computeBestStreak`, `unlockedBadges` |
| `src/lib/badges/engine.check.ts` | Tests ponytail de `engine.ts` |
| `src/lib/badges/queries.ts` | `loadCustomerStats` (service client) |
| `src/lib/badges/actions.ts` | `evaluateBadgesForUser`, `evaluateBadgesForOrder`, `grantBadges` |
| `src/lib/badges/notify.ts` | `notifyBadgeUnlocked` |
| `supabase/migrations/20260909000000_customer_badges.sql` | RPC + revoke de columna + CHECK notifications |
| `src/lib/notifications/types.ts` / `display.ts` | Categoría y tab `badges` |
| `src/lib/userProfileDb.ts` | `profileToRow` sin `awarded_badges`; `rowToProfile` con lectura |
| `src/lib/userProfileActions.ts` | Hooks de evaluación post-save / post-verify |
| `src/lib/addresses/actions.ts` | Hook tras primera dirección |
| `src/lib/likes/actions.ts` | Hook tras primer favorito autenticado |
| `src/lib/orders/actions.ts` | Hook en `after()` al `delivered` |
| `src/components/profile/ProfileView.tsx` | Catálogo completo + contador + disparo del modal |
| `src/components/profile/BadgeUnlockedModal.tsx` | Modal celebratorio |
| `src/components/BadgeDetailModal.tsx` | Soporte estado `locked` |

## Dependencias

Ninguna nueva. Reutiliza:

- `@/lib/supabase/service` → `createServiceClient` (queries y grant)
- `@/lib/notifications/repository` → `insertNotification` (dedupe por `user_id,dedupe_key`)
- `@/lib/userProfile` → `BadgeRarity`, `UserAwardBadge` (shape de la UI)
- `next/server` → `after` (hooks de evaluations post-commit)
- `@/components/FlashToast` y framer-motion (modal celebratorio)