# SDD 02 — Flujos y estados

## Flujo feliz — desbloqueo por pedido entregado

```
1. Cliente pide; el comercio/negocio avanza el pedido hasta `delivered`
   (RPC transition_order_status, PIN validado)
2. advanceOrderStatus → after() → evaluateBadgesForOrder(orderId)
   -> evaluador llama loadCustomerStats(customer_user_id) y computa métricas
3. unlockedBadges(stats, ownedIds) devuelve [badge1, ...]  (solo nuevas)
4. grantBadges(userId, nuevas) → RPC grant_customer_badges (SECURITY DEFINER)
   - merge idempotente por id sobre awarded_badges jsonb
   - devuelve las efímeras agregadas
5. Por cada badge agregada → notifyBadgeUnlocked → insertNotification
   category='badges', dedupeKey='badge:<userId>:<badgeId>'  (upsert ignore-duplicates)
6. Cliente abre Mi perfil → fetch perfil (awarded_badges actualizado)
   → snapshot diff vs previo → BadgeUnlockedModal + siluetas actualizadas
7. Campana: la notificación 'badges' aparece bajo el tab "Logros"
```

## Flujo feliz — desbloqueo por onboarding

```
saveUserProfileAction / verifyIdentityAction / saveUserAddressAction / toggleProductLike
        │  (post-write del hito alcanzado)
        ▼
evaluateBadgesForUser(userId)   ← mismo motor §1, pasos 2-7
```

## Idempotencia (núcleo del diseño)

| Operación | Mecanismo | Efecto repetido |
|-----------|-----------|-----------------|
| Otorgar insignia en `awarded_badges` | RPC merge por `id` dentro del array | Sin duplicados: el `id` ya existe → se saltea |
| Notificación de desbloqueo | `insertNotification` upsert con `onConflict(user_id, dedupe_key)` + `ignoreDuplicates` | Se ignora el duplicado |
| **Escritura del cliente sobre el perfil** | Se quita `awarded_badges` del row + `REVOKE UPDATE (awarded_badges)` | El upsert full-row del cliente ya no puede pisar insignias |

- La evaluación se puede correr N veces sobre el mismo usuario: nunca revierte, nunca duplica.

## Concurrencia

- El RPC hace `SELECT ... FOR UPDATE` sobre la fila de `user_profiles` antes de mergear:
  dos evaluaciones simultáneas del mismo usuario no se pisan (serializa el append).
- El evaluador corre con `service_role`; las acciones de onboarding corren con el user client
  pero delegan el otorgamiento a la RPC (que usa permisos de owner para el UPDATE).
- `profileToRow` deja de serializar `awarded_badges`: el ciclo de vida del dato pasa a ser
  **server-only** (lectura por RLS al dueño, escritura solo vía RPC/service).

## Matriz de métricas → insignias (v1)

| Métrica (`BadgeMetric`) | Fuente (service client) | Insignias |
|-------------------------|-------------------------|-----------|
| `profile_complete` (0/1) | `user_profiles`: display_name + avatar + primary_address set | `perfil-completo` |
| `identity_verified` (0/1) | `user_profiles.identity_verified` | `identidad-verificada` |
| `addresses_count` | `user_addresses` COUNT(user_id) | `primera-direccion` (>=1) |
| `favorites_count` | `product_likes` COUNT(user_id) | `primer-favorito` (>=1) |
| `orders_delivered` | `orders` COUNT `status='delivered'` | `primer-pedido`(1), `cinco-pedidos`(5), `diez-pedidos`(10), `cincuenta-pedidos`(50) |
| `spent_total_cents` | `orders` SUM(total_cents) `status='delivered'` | `gasto-100k`(100000), `gasto-500k`(500000) |
| `paid_digital_orders` | `orders` COUNT `payment_status='paid' AND payment_method <> 'cash'` | `pago-digital` (>=1) |
| `best_streak_days` | `orders` fechas DISTINCT `delivered_at` → `computeBestStreak` | `racha-3d` (>=3) |

## Matriz de permisos

| Acción | Cliente (dueño del perfil) | Service (server action/RPC) |
|--------|:--------------------------:|:----------------------------:|
| Leer `user_profiles.awarded_badges` | ✓ (RLS own-profile) | ✓ |
| Escribir `awarded_badges` | ✗ (columna revocada) | ✓ (solo vía RPC `grant_customer_badges`) |
| Insertar notificación `badges` | ✗ (INSERT revocado a authenticated) | ✓ (service client) |
| Ejecutar `grant_customer_badges` | ✗ (GRANT solo service_role) | ✓ |

## Casos borde

| Caso | Comportamiento esperado |
|------|-------------------------|
| Usuario sin fila en `user_profiles` aún | El RPC hace UPSERT de la fila con los badges antes de mergear |
| Dos pedidos entregados en el mismo instante (evaluador concurrente) | `FOR UPDATE` serializa; no se pierden insignias |
| El cliente guarda el perfil con un snapshot viejo | No pisa insignias: la columna no está en el write y no tiene UPDATE grant |
| Pedido entregado pero sin `customer_user_id` (guest/QR fallback) | Se ignora (no se evalúa): solo logueados acumulan logros |
| Badge ya ganada y se repite la evaluación | `added = []` → no se notifica |
| Racha: entregas en días no consecutivos | `computeBestStreak` devuelve la racha máxima, no la última |
| Desbloqueo por onboarding y por pedido a la vez | Un solo `evaluateBadgesForUser` agrega ambas → dos notificaciones (una por badge) |
| `gasto-500k` sin pasar por `gasto-100k` | Imposible: umbrales acumulativos; ambas se otorgan en la misma corrida si el total ya superó ambos |