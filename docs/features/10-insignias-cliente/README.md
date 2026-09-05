# 10 — Insignias de cliente (gamificación)

> Desbloqueo real de insignias por hitos (onboarding + pedidos), estilo PedidosYa/Rappi.

## Resumen

Reemplaza el estado **cosmético** actual (unos badges seed fijos guardados como JSONB que
todas las cuentas "tienen" por defecto, sin lógica de desbloqueo) por un **motor de logros**:
el backend calcula métricas reales por usuario (pedidos entregados, gasto acumulado, racha,
dirección, favorito, identidad…) y otorga insignias de forma server-side, idempotente, con
notificación in-app + modal celebratorio y exhibición en el perfil (ganadas y bloqueadas).

| Cara | Qué cambia |
|------|------------|
| **Cliente** | El perfil muestra todas las insignias del catálogo: las ganadas a color y las bloqueadas en silueta; al desbloquear una se dispara notificación in-app y un modal celebratorio |
| **Backend** | Motor `src/lib/badges/` (reglas puras + evaluador), RPC `SECURITY DEFINER` `grant_customer_badges` (escritura idempotente y server-only de `awarded_badges`), hooks en entregas y onboarding, notificación categoría `badges` |
| **Seguridad** | El cliente deja de poder escribir `awarded_badges` (se revoca UPDATE de la columna): el único escritor es la RPC `grant_customer_badges` |

## Estado actual que se reemplaza

- `user_profiles.awarded_badges` es `jsonb NOT NULL DEFAULT '[]'` (migración `20260828120000_user_profiles.sql`).
- Tipos `UserAwardBadge` / `BadgeRarity` ya existen en `src/lib/userProfile.ts:9-21`.
- `INITIAL_AWARDED_BADGES` (`userProfile.ts:109-165`) es **dead code** (definido, no usado).
- `ProfileView.tsx:623-662` exhibe `profile.awardedBadges`; `BadgeDetailModal.tsx` muestra el detalle.
- El cliente persiste el perfil con un **upsert full-row** (`saveUserProfileAction` → `profileToRow`,
  debounce 350 ms en `UserProfileProvider.tsx:207-219`): hoy esos badges "vuelan" en el row,
  lo que pisaría cualquier otorgamiento server-side concurrente.

## Decisiones de producto (cerradas con el dueño)

1. **Persistencia**: JSONB existente + **escritura server-only vía RPC** `grant_customer_badges`
   (SECURITY DEFINER). El cliente **solo lee** — se quita `awarded_badges` del row de escritura
   y se revoca el UPDATE de la columna a `authenticated`.
2. **UI**: mostrar también las insignias **bloqueadas** (silueta gris "aún no desbloqueada") para
   dar sensación de progreso.
3. **UX de desbloqueo**: notificación in-app (categoría nueva `badges`) + **modal celebratorio**
   en el perfil cuando aparece una insignia nueva.
4. **Motor**: reglas puras y testeables (`*.check.ts`, patrón ponytail), catálogo de insignias
   como **datos** (extensible sin tocar lógica).
5. **Evaluación idempotente**: solo suma insignias nuevas; repetir no duplica ni revierte.

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [README.md](./README.md) | Resumen, decisiones de producto y checklist |
| [sdd/01-historias-de-usuario.md](./sdd/01-historias-de-usuario.md) | HU cliente con criterios de aceptación |
| [sdd/02-flujos-y-estados.md](./sdd/02-flujos-y-estados.md) | Flujos de otorgamiento, idempotencia, permisos, concurrencia |
| [tdd/01-arquitectura-y-contratos.md](./tdd/01-arquitectura-y-contratos.md) | Reglas puras, evaluador, RPC, componentes, archivos |
| [tdd/02-base-de-datos-y-realtime.md](./tdd/02-base-de-datos-y-realtime.md) | Migración, RPC, revoke de columna, CHECK de notificaciones |
| [tdd/03-plan-de-pruebas.md](./tdd/03-plan-de-pruebas.md) | Matrices de reglas, evaluador, RPC/RLS, UI + QA |

## Checklist de implementación

### Fase 1 — Dominio y reglas puras
- [ ] `src/lib/badges/definitions.ts`: tipos (`BadgeMetric`, `BadgeDefinition`) + catálogo `BADGE_DEFINITIONS`
- [ ] `src/lib/badges/engine.ts`: `metricValue`, `isBadgeEarned`, `computeBestStreak`, `unlockedBadges`
- [ ] `engine.check.ts` (patrón ponytail) — `pnpm test` en verde

### Fase 2 — Persistencia server-only
- [x] Migraciones aplicadas a la DB real (ver `tdd/02`): RPC `grant_customer_badges`, revoke de tabla + grants por columna sobre `user_profiles`, CHECK `notifications` con `badges`, + reparación heredada de tablas faltantes (`notifications`, `promo_banners`, `push_subscriptions`, `app_settings`)
- [x] Sacar `awarded_badges` de `profileToRow` (write del cliente) y de `saveUserProfileAction`; conservarlo en `rowToProfile` (read)
- [x] Verificado en DB real: `has_column_privilege` para `awarded_badges` = `false` (authenticated), RPC otorga + dedupe idempotente, índice presente

### Fase 3 — Evaluador y hooks
- [ ] `src/lib/badges/queries.ts`: `loadCustomerStats(userId)` con service client (pedidos, gasto, racha, perfil, direcciones, favoritos)
- [ ] `src/lib/badges/notify.ts`: `notifyBadgeUnlocked` (insertNotification, category `badges`, dedupeKey `badge:<uid>:<badgeId>`)
- [x] `src/lib/badges/actions.ts`: `grantBadges` (service client → RPC) + `evaluateBadgesForUser` (+ `evaluateBadgesForOrder`)
- [x] Hook en `advanceOrderStatus` (`after()`, `targetStatus === "delivered"` → `evaluateBadgesForOrder`)
- [x] Hooks de onboarding: `saveUserProfileAction` (perfil completo), `verifyIdentityAction` (identidad), `saveUserAddressAction`/`restoreUserAddressAction` (primera dirección), `toggleProductLike` (primer favorito)

### Fase 4 — UI
- [x] `ProfileView`: renderizar catálogo completo (ganadas a color + bloqueadas en silueta)
- [x] `BadgeUnlockedModal.tsx`: modal celebratorio al detectar una insignia nueva en el perfil
- [x] Notificación categoría `badges` visible en campana (tab "Logros")

### Fase 5 — Verificación
- [x] `pnpm test` (42/42) + `tsc --noEmit` + `pnpm lint` sin errores en archivos del feature
- [x] Migración aplicada en remoto y verificada (RPC otorga + dedupe, revoke efectivo, tablas recreadas)
- [ ] QA manual E2E: pedido entregado → insignia + notificación + modal

## Fuera de alcance (v2)

- Exhibición pública de insignias en el menú QR / storefront del negocio.
- Leaderboard social entre usuarios.
- Recompensas monetarias / descuentos por nivel.
- XP y niveles numéricos por cliente (solo insignias por hitos en v1).
- Notificación realtime del modal "justo al desbloquear" fuera del perfil (hoy se dispara al
  volver al perfil con una insignia nueva; la campana notifica siempre).