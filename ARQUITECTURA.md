# BolivarPide — Arquitectura (estado real, 2026-09)

> Este documento describe **lo que existe hoy**, no un diseño aspirado. El
> documento original (con el roadmap y las caras usuario/negocio/delivery) se
> eliminó del repo (vive en el historial de git). La auditoría de deuda técnica vive en
> `docs/debt.md`.

## Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **Estilos:** Tailwind CSS v4 + componentes hand-rolled (sin shadcn instalado)
- **Datos:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Pagos:** MercadoPago QR dinámico (Orders API, `type: qr mode: dynamic`) con
  OAuth por comercio; spec canónica en `docs/specs/payments-qr-mp.md`
- **WhatsApp:** n8n self-hosted (bot de pedidos por keywords) + OAuth Meta con
  tokens en Supabase Vault para el panel
- **PWA:** service worker hand-rolled (`public/sw.js`) + Web Push (edge function)
- **Edge Functions:** `supabase/functions/send-push`, `supabase/functions/mp-auth-callback`

## Estructura

```
src/
├── app/                       # App Router
│   ├── (cara usuario)  / , /c/[slug], /pedido/[orderId], /pago/resultado
│   ├── (negocio)       /negocio/[businessId]/{dashboard,pedidos,carta,whatsapp,configuracion}
│   ├── (admin)         /admin
│   └── api/            # Route handlers (checkout, orders, payments/mp, webhooks, notifications…)
├── components/                # UI por dominio (home, cart, business, orders, address…)
└── lib/                       # Lógica por dominio
    ├── business/   queries, actions, menuQueries, homeData, types, staticContent, require-member-api
    ├── orders/     lifecycle, actions, kitchen, pending, active, acceptanceTimeout, deliveryPin
    ├── mercadopago/ checkout, reconcile, refund, provisioning, repository, health, expire
    ├── whatsapp/   oauth, webhook, templates, chatQueries
    ├── notifications/  emit, repository, display
    ├── supabase/   client, server, service, proxy
    └── auth/       paths, password, guards-entry (middleware en src/proxy.ts)
supabase/
├── migrations/     # SQL versionadas (se aplican con Supabase CLI: supabase db push)
├── functions/      # edge functions (send-push, mp-auth-callback)
n8n/                # workflow de WhatsApp bot + docker-compose
docs/specs/         # specs compartidas (pagos-qr-mp, configuración locales, integración)
```

## Modelo de datos (tablas reales)

- `user_profiles` (+ extensiones de notificaciones) — perfil del usuario
- `user_addresses` — direcciones de entrega
- `businesses`, `business_members` (`owner|staff|driver`), `business_hours`
- `products` (`price_cents`, `available`, `ingredients text[]`, `options jsonb`),
  `menu_categories`, `product_likes`
- `orders`, `order_items`, `business_order_counters`
- `coupons`
- `payment_sessions`, `mp_webhook_events`, `mp_merchant_connections`, `mp_stores`,
  `mp_pos`, `oauth_states`
- `notifications`, `push_subscriptions`
- `whatsapp_messages`, `whatsapp_status_templates`, `business_whatsapp`,
  `whatsapp_sessions`, `meta_oauth_states`
- `promo_banners`, `leads`, `admin_audit_log`, `app_settings`
- `delivery_profiles` (KYC del repartidor), `delivery_locations` (tracking GPS)
- `platform_users` (roles de plataforma `superadmin|soporte`)
- `customer_badges` (insignias de cliente)

Total: 42 migraciones en `supabase/migrations/`.

## Reparto

Vive **dentro** del panel de negocio, en `/negocio/[businessId]/reparto`: no hay app
standalone de repartidor. La misma ruta renderiza `DispatchView` (owner/staff) o
`DriverBoard` (driver) según el rol.

- **Onboarding:** el usuario postula desde su perfil (`DriverApplicationModal`) → fila en
  `delivery_profiles` con estado `pending_review` → un superadmin aprueba → el comercio lo
  contrata (`hireApprovedDriver`) → `business_members` con rol `driver`.
- **Asignación:** cola de despacho (`listDispatchQueue`) + claim race-safe con
  `UPDATE ... WHERE delivery_driver_id IS NULL` (`src/lib/delivery/actions.ts:314-344`).
- **Entrega:** PIN de 4 dígitos generado por el RPC al pasar a `delivering`, validado en el
  mismo RPC con lock de 5 intentos por 15 minutos.
- **GPS:** el driver comparte ubicación (`useDriverLocation`) → `delivery_locations` →
  Realtime al mapa del cliente. Si no hay posición fresca, el mapa cae a `demoRouteProgress`
  (animación simulada) — pendiente de decisión, ver `docs/estado-beta-publica.md`.

## Roles

Dos jerarquías independientes:

- **Por comercio** — `business_members.role`: `owner` | `staff` | `driver`. Se enforcea en las
  server actions de cocina y equipo; **la navegación del panel todavía no filtra por rol**.
- **De plataforma** — `platform_users.role`: `superadmin` | `soporte`. Se resuelve con
  `app_metadata.role` como cache y la tabla como fuente de verdad
  (`src/lib/admin/platform.ts:21-40`). El Modo Escudo (impersonación) usa cookie HMAC con TTL
  de 1 hora y deja rastro en `admin_audit_log`.

RLS activa en todas las tablas; las opacas (pagos, whatsapp, admin) solo
accesibles vía `service_role` / RPC `SECURITY DEFINER`.

## Órdenes

Estados canónicos: `pending → preparing → delivering → delivered`, más
terminales `rejected` (comercio rechaza) y `cancelled` (cliente cancela o QR
falla antes de pagar).

- Las transiciones del panel se aplican por el RPC `transition_order_status`
  (`SECURITY DEFINER`): valida membresía/rol, transición, PIN de entrega y
  timestamps de forma atómica. El UPDATE directo de `orders` está revocado a
  `authenticated`; el resto de los writers usan `service_role`.
- Timeout de aceptación (3 min) y expiración de sesiones QR (15 min): `lazy`,
  al consultar el pedido (`acceptanceTimeout.ts`, `expire.ts`).

## Pagos

Flujo QR: usuario logueado → checkout (precios verificados server-side contra
`products`) → `orders` + `payment_sessions` + order QR en MP (OAuth del
comercio) → webhook (HMAC validado, dedupe por evento) → reconcile → `paid`.
Refunds idempotentes con key estable. El dinero va directo al seller (sin
escrow).

## Auth & seguridad

- Cookies SSR (`@supabase/ssr`) + proxy en `src/proxy.ts` (middleware).
- Cliente público anon key + RLS para datos públicos; `service_role` solo en
  servidor (verificado: no filtra a bundles).
- Endpoints de pagos MP protegidos con rol mínimo `owner` (`require-member-api.ts`).

## Herramientas

- **Migraciones:** Supabase CLI (`supabase db push`), con `supabase/config.toml` en el repo.
  Nunca SQL editor manual.
- **Tests:** `pnpm test` corre los 42 `*.check.ts` (patrón ponytail, sin framework) vía `tsx`.
- **CI:** `.github/workflows/ci.yml` corre test + typecheck + lint en cada push y PR.
- **Verificación local:** `pnpm typecheck` y `pnpm lint`.

## Hitos / Roadmap

- **Estado hacia la beta pública:** [`docs/estado-beta-publica.md`](./docs/estado-beta-publica.md)
  — porcentaje de avance por cara, bloqueantes y backlog priorizado. El número se recalcula con
  `node scripts/beta-score.mjs`.
- **Roadmap operativo:** [`docs/hitos/`](./docs/hitos/README.md).

## Referencias

- Specs de producto: `docs/specs/` · `docs/features/`
- Auditoría y deuda: `docs/debt.md`