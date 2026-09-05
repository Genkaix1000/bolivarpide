# TDD 03 — Plan de pruebas

Archivos de check runnable (patrón ponytail):

| Archivo | Cubre |
|---------|-------|
| `src/lib/badges/engine.check.ts` | `metricValue`, `isBadgeEarned`, `computeBestStreak`, `unlockedBadges` |

Ejecutar: `pnpm test` (corre todos los `*.check.ts`).

---

## Matriz — `metricValue`

| stats | metric | Esperado |
|-------|--------|----------|
| `{ profileComplete: true }` | `profile_complete` | 1 |
| `{ profileComplete: false }` | `profile_complete` | 0 |
| `{ identityVerified: true }` | `identity_verified` | 1 |
| `{ addressesCount: 3 }` | `addresses_count` | 3 |
| `{ favoritesCount: 0 }` | `favorites_count` | 0 |
| `{ ordersDelivered: 5 }` | `orders_delivered` | 5 |
| `{ spentTotalCents: 250_000 }` | `spent_total_cents` | 250_000 |
| `{ paidDigitalOrders: 1 }` | `paid_digital_orders` | 1 |
| `{ bestStreakDays: 3 }` | `best_streak_days` | 3 |

## Matriz — `isBadgeEarned`

| def (metric/target) | stats | Esperado |
|---------------------|-------|----------|
| `orders_delivered`, 1 | `{ ordersDelivered: 1 }` | ✓ true |
| `orders_delivered`, 5 | `{ ordersDelivered: 4 }` | ✗ false |
| `orders_delivered`, 50 | `{ ordersDelivered: 50 }` | ✓ true (límite) |
| `spent_total_cents`, 100_000 | `{ spentTotalCents: 99_999 }` | ✗ false |
| `spent_total_cents`, 100_000 | `{ spentTotalCents: 100_000 }` | ✓ true (límite) |
| `profile_complete`, 1 | `{ profileComplete: false }` | ✗ false |

## Matriz — `computeBestStreak`

| fechas ('YYYY-MM-DD') | Esperado |
|-----------------------|----------|
| `[]` | 0 |
| `['2026-09-01']` | 1 |
| `['2026-09-01','2026-09-02','2026-09-03']` | 3 |
| `['2026-09-01','2026-09-03']` | 1 (no consecutivas) |
| `['2026-09-01','2026-09-02','2026-09-04','2026-09-05','2026-09-06']` | 3 (racha máxima, no la última) |
| con duplicados `['2026-09-01','2026-09-01']` | 1 (DISTINCT) |
| pedagógica al cruzar mes `['2026-08-30','2026-08-31','2026-09-01']` | 3 (conteo por fecha, no por ordinal) |

## Matriz — `unlockedBadges`

| defs | stats | ownedIds | Esperado |
|------|-------|----------|----------|
| 2 defs, ambos alcanzados | stats completos | `[]` | ambas nuevas |
| 2 defs, 1 alcanzado | stats parcial | `[]` | solo la alcanzada |
| 2 defs, ambos alcanzados | stats completos | `[id1]` | solo la no-owned |
| 0 defs | cualquiera | `[]` | `[]` |
| def no alcanzada | stats vacías | `[]` | `[]` |

---

## Matriz — `loadCustomerStats` (service client)

| Caso | Esperado |
|------|----------|
| Usuario sin pedidos, sin direcciones, sin favoritos | todos 0 / false; `bestStreakDays=0` |
| 3 pedidos `delivered`, total 55_000, 1 digital | `ordersDelivered=3`, `spentTotalCents=55_000`, `paidDigitalOrders=1` |
| 2 pedidos `rejected`/`cancelled` | NO se cuentan en `ordersDelivered` ni `spentTotalCents` |
| 1 pedido `delivered` pero `payment_method='cash'` | `paidDigitalOrders=0` |
| Sin fila en `user_profiles` | `profileComplete=false`, `identityVerified=false` (no tira error) |
| `delivered_at` en días 1,2,3 | `bestStreakDays=3` |

## Matriz — `grant_customer_badges` (RPC service_role)

| Caso | Esperado |
|------|----------|
| Sin fila de perfil | crea la fila con `['[]']` + `added` = los ids nuevos |
| Badges nuevas | `added` contiene ids NUEVOS, persistidos en `awarded_badges` |
| Badge ya existente | `added = []`, no duplica |
| Mezcla nueva + existente | agrega solo la nueva |
| payload sin `id` | se agrega tal cual (validación del caller) |

## Matriz — evaluador (`evaluateBadgesForOrder` / `evaluateBadgesForUser`)

| Caso | Esperado |
|------|----------|
| Pedido `delivered`, `customer_user_id` presente, cumple 2 badges | otorga 2 + 2 notificaciones con `dedupeKey badge:<uid>:<badgeId>` |
| Pedido sin `customer_user_id` | no evalúa (sin error) |
| Re-evaluación inmediata | `added=[]` → 0 notificaciones nuevas |
| Identidad verificada recién | otorga `identidad-verificada` |
| Primer favorito de guest (sin user) | no otorga (solo autenticados) |
| Falla del evaluador (ej. service key ausente) | no rompe la server action (catch + log) |

## Matriz — permisos y RLS

| Escenario | Esperado |
|-----------|----------|
| Cliente lee su `awarded_badges` | ✓ (RLS own-profile) |
| Cliente lee `awarded_badges` de otro | 0 filas |
| `authenticated` hace `UPDATE (awarded_badges)` | `42501` (columna revocada) |
| `authenticated` ejecuta `grant_customer_badges` | `permission denied` (GRANT solo service_role) |
| `anon` ejecuta `grant_customer_badges` | `permission denied` |
| Cliente inserta notificación `category='badges'` | bloqueado (INSERT revocado) |
| Badge repetida | `added=[]`, sin duplicado |

## Matriz — UI (`ProfileView` + modales)

| Estado del perfil | Render |
|-------------------|--------|
| 0 insignias ganadas | todas en silueta + contador `0 / 12` |
| 3 ganadas | 3 a color + 9 silueta + contador `3 / 12` |
| Click ganada | `BadgeDetailModal` normal |
| Click bloqueada | `BadgeDetailModal` con "Bloqueada" (sin fecha/otorgador) |
| Se desbloquea una (nueva en snapshot) | `BadgeUnlockedModal` con animación, contador sube |

| Caso | Esperado |
|------|----------|
| Cliente vuelve al perfil tras un pedido que desbloqueó 2 badges | modal celebra el badge "principal"; el otro aparece en la grilla a color |
| Snapshot inicial = ids ya existentes | sin falso modal al cargar por primera vez |
| Perfil visto y nuevamente reabierto sin nuevos | sin modal repetido |

## Otros checks — persistencia de perfil (regresión)

| Escenario | Esperado |
|-----------|----------|
| `saveUserProfileAction` cambia nombre/avatar | persiste, `awarded_badges` intacto (no se envía en el row) |
| Upsert tras otorgamiento server | no pisa insignias (columna fuera del row + revoke) |
| `rowToProfile` con badges | mapea correctamente `awarded_badges` a `awardedBadges` |

---

## Casos E2E manuales (checklist QA)

1. **Pedido entregado** → insignias `primer-pedido` + `pago-digital`/`gasto-100k` según corresponda; al volver al perfil aparece el modal y el contador sube.
2. **Fila de perfil inexistente**: usuario sin perfil crea uno tras un delivered (el RPC hace UPSERT).
3. **Anti-pisado**: guardar el perfil (nombre/avatar) justo después del desbloqueo → las insignias siguen en el perfil.
4. **Dedupe**: redeliver / re-evaluación manual → sin segundas notificaciones.
5. **Bloqueadas**: perfil nuevo muestra las 12 en silueta, "0 / 12".
6. **Racha**: 3 días con pedidos entregados → `racha-3d`; un día sin pedido no rompe una racha previa más larga.
7. **Campana**: la notificación aparece bajo "Logros" y es marcable como leída.
8. **Regresión**: `pnpm test`, `tsc --noEmit`, `lint` en verde; perfil/identidad/direcciones/favoritos sin regresiones.