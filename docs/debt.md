# Deuda Técnica — BolivarPide

> Análisis en profundidad · 2026-09-05 · Fuente de verdad del análisis: `docs/debt.md`
> Proyecto: Next.js 16 + Supabase · 36.087 líneas TS en 297 archivos (`src/`)

Este documento consolida la auditoría de deuda técnica del proyecto. Cada hallazgo
incluye evidencia con `archivo:línea`. Severidades:

- **P0 — Seguridad y dinero**: corregir con máxima prioridad.
- **P1 — Estructura y arquitectura**: deuda estructural que encarece todo cambio futuro.
- **P2 — Tooling, infraestructura y documentación**: higiene y reproducible builds.

---

## P0 — Seguridad y dinero

### 1. Precios controlados por el cliente en checkout (CRÍTICO)

`POST /api/orders/checkout` pasa `body.lines` (nombre, cantidad, `unitPriceCents`,
`productId`, nota) verbatim del cliente hacia `createCheckout`
(`src/app/api/orders/checkout/route.ts:44-54`), que:

- calcula el subtotal usando **los precios que manda el cliente** (`src/lib/mercadopago/checkout.ts:171-175`),
- inserta la orden con esos montos (`checkout.ts:226-246`, `:285-305`, `:411-431`),
- cobra ese total a MercadoPago (`checkout.ts:307-335`, `:433-475`).

No hay verificación de `unitPriceCents` contra `products` en todo este camino. El RPC
`create_order` sí valida precios servidor-side (`supabase/migrations/20260903_security_rls.sql:289-300`),
pero **solo se usa en el flujo WhatsApp**, no en el checkout web.

**Impacto**: un usuario logueado puede comprar cualquier ítem a $0.01.

**Fix**: re-fetch de `products` en el server, exigir `productId`, recalcular precios,
rechazar `unitPriceCents` del cliente; extender la validación RPC al checkout web.

### 2. Doble reembolso en retry (idempotency key fresca)

`src/lib/mercadopago/refund.ts:30` usa `randomUUID()` como idempotency key de MercadoPago
**en cada llamada**. Dos rechazos concurrentes o un retry del mismo flujo = dos refunds
distintos contra un mismo pago. El update DB (`refund.ts:35-42`) tampoco es condicional.

**Fix**: key estable derivada del pedido (p.ej. `refund-{orderId}`) + update condicional
`payment_status = 'refunded'` con predicado.

### 3. Webhook MP re-marca `paid` incondicionalmente

`src/app/api/webhooks/mercadopago/route.ts:52-59` (`markOrderPaid`):

- no tiene predicado sobre el `payment_status` actual,
- no verifica el monto (nunca se fetcha `transaction_amount` de `MpPaymentResponse`).

Un webhook tardío o duplicado re-activa a `paid` un pedido cancelado o ya reembolsado.
La dedupe por `UNIQUE(x_request_id)` (`20260829_mercadopago_payments.sql:107`) cubre solo
duplicados exactos; los reintentos de MP llegan con novo `x_request_id` y re-ejecutan.

**Fix**: update condicional `payment_status IN ('unpaid','awaiting_payment')` + verificación
de monto + dedupe por evento (`data.id`), no por request-id.

### 4. Enumeración cross-tenant de webhooks MP

`src/lib/mercadopago/health.ts:110-118` consulta `mp_webhook_events` **sin filtro de
`business_id`** y devuelve hasta 25 filas de todos los tenants. Expuesto en
`GET /api/payments/mp/diagnostics` (`src/app/api/payments/mp/diagnostics/route.ts:17-23`),
gated solo por `requireBusinessMember` de **cualquier** negocio (`route.ts:11`).

**Impacto**: cualquier miembro de cualquier negocio puede enumerar los eventos de pago
(incluye ids MP, `x_request_id`) de todas las empresas.

### 5. Cupones `max_uses` nunca enforced

`uses_count` se lee en `src/lib/mercadopago/checkout.ts:108` pero **jamás se incrementa**
(grep: solo la definición en schema y la lectura). Un cupón con `max_uses = 1` corre para
siempre. El chequeo `uses_count >= max_uses` es read-then-use no atómico (TOCTOU).

### 6. Endpoints MP admin sin jerarquía de roles

`src/lib/business/require-member-api.ts:12-24` valida "miembro activo o platform admin"
pero **no distingue owner/staff/driver**. Protege operaciones sensibles:

- `api/payments/mp/disconnect/route.ts:11` — revoca OAuth y borra tokens MP,
- `api/payments/mp/provision/route.ts:17` — crea store + POS en MP,
- `api/payments/mp/reprovision/route.ts:17` — borra y recrea store + POS,
- `api/payments/mp/oauth/url/route.ts:22` — inicia OAuth de pago,
- `api/payments/mp/oauth/config/route.ts:13` — sondea el panel MP con `client_secret`,
- `api/payments/settings/route.ts:14,44` — GET/PATCH settings de pago.

**Impacto**: un `driver` invitado puede desvincular el negocio de MercadoPago. Contrasta con
la cocina, donde `memberRole` sí se enforcea (`src/lib/orders/actions.ts:37,57-59,159`).

**Fix**: agregar discriminación de rol en `require-member-api` para operaciones admin/rango-owner.

### 7. Preferencias de push rotas (columna inexistente)

`supabase/functions/send-push/index.ts:50-54` consulta `user_profiles` con
`.eq("id", payload.user_id)`, pero el PK real de `user_profiles` es `user_id`
(`supabase/migrations/20260828_user_profiles.sql:2`).

**Impacto**: el gate de preferencias nunca matchea → las promos se envían siempre y las
notificaciones de pedido ignoran el "off" del usuario.

### 8. RLS: 13 tablas sin policies dependen de REVOKEs

Las 27 tablas tienen `ENABLE ROW LEVEL SECURITY`, pero 13 no tienen policies
(deny-by-default) y su seguridad depende de `REVOKE ALL FROM anon, authenticated`
acompañantes (p.ej. `leads`, `admin_audit_log`, `whatsapp_sessions`,
`business_order_counters`, `oauth_states`, `mp_*`, `coupons`, `app_settings`,
`meta_oauth_states`). Si un grant por default-privileges o un futuro REVOKE eliminado las
abre, son footguns. No hay script de auditoría de grants (solo `scripts/check-supabase-schema.mjs`).

---

## P0 — Timeouts y estado de pedido

### 9. Timeout de aceptación de 3 minutos NO implementado

`ARQUITECTURA.md:794-798, 521` especifica: si el negocio no responde en 3 min →
auto-cancelación + reembolso automático + push al usuario. **No existe código, cron ni
edge function que lo haga.** Los únicos edge functions son `send-push` y `mp-auth-callback`.
Tampoco existe el cron de "expirar sesiones QR vencidas" que pide
`docs/specs/payments-qr-mp.md:318`.

**Impacto acumulado**: un pedido `pending + awaiting_payment` cuya sesión QR expira a los
15 min (`checkout.ts:11`, `expiration_time: "PT15M"` en `checkout.ts:451`) queda
**huérfano para siempre** en la DB; el cliente solo lo esconde (`pending.ts:57-58`). No hay
job de limpieza.

### 10. Drift del state machine de pedidos

| Capa | Estados |
|---|---|
| TS enum (`src/lib/orders/lifecycle.ts:3-16`) | `pending`, `preparing`, `delivering`, `delivered`, `rejected` |
| DB check (`20260830_order_lifecycle.sql:4-9`) | los 5 + `accepted`, `ready`, `cancelled` |

El puente es `normalizeLifecycleStatus` (`lifecycle.ts:107-114`), pero los valores legacy
**se siguen escribiendo en runtime**:

- `src/lib/orders/pending.ts:115` — cancelación cliente escribe `status: "cancelled"`,
- `src/lib/mercadopago/checkout.ts:472,481` — fallo de creación QR escribe `status: "cancelled"`.

Por eso aparecen string-checks ad-hoc como `order.status === "cancelled"` (`lifecycle.ts:255`).
El tipo sistemáticamente miente sobre los estados persistidos.

### 11. Transiciones sin guardia atómica

`canForward`/`canBackward` (`src/lib/orders/actions.ts:92,173-174`) viven solo en la server
action, con lectura previa de la fila (`actions.ts:39-46`). No hay:

- `SELECT ... FOR UPDATE`,
- conditional-updates (`.eq("status", ...)`),
- triggers ni RPC `SECURITY DEFINER` que validen transiciones,
- y la policy `orders_member_update` (`20260903_security_rls.sql:118-123`) permite a
  cualquier miembro `UPDATE` **cualquier columna** de `orders` incl. `status`.

**Races concretas**:

- **Double-accept** — `actions.ts:140` actualiza solo con `.eq("id", ...)`; dos clicks
  concurrentes pasan el chequeo. Lo mismo en `revertOrderStatus` (`:183`).
- **Cancel vs webhook** — `pending.ts:82-84` (gate) corre contra `markOrderPaid` sin
  predicado (`route.ts:52-59`); un webhook tardío re-flipea a `paid` un cancelado.
- **PIN attempts lost-update** — `actions.ts:117-136` read-modify-write sobre
  `pin_attempts`; dos PINs incorrectos concurrentes pueden subcontar el bloqueo.
- **Checkout double-submit** — `CheckoutSheet.tsx:271` genera `safeRandomUUID()` por
  submit; dos POSTs rápidos dan dos keys → dos órdenes. La UNIQUE de
  `payment_sessions.idempotency_key` solo ayuda si se reusa la misma key, y un retry tras
  cancelación de la sesión choca con violación UNIQUE sin manejo (`checkout.ts:487-503`).

### 12. `refund_pending` es un flag muerto

`src/lib/mercadopago/refund.ts:48` setea `refund_pending = true` ante fallo de refund, pero
**nada lo lee**: no hay retry job, ni reconciliación boot-time / replay (spec pedía replay,
`docs/specs/payments-qr-mp.md:158`).

---

## P1 — Estructura y arquitectura

### 13. `src/app/page.tsx` — 886 líneas, el anti-patrón del proyecto

`src/app/page.tsx` es un componente **cliente** que hace queries Supabase inline
(`page.tsx:97-248`), gestiona su propio caching, carruseles y dos sub-componentes. Mezcla:
render + data-fetching + cache + estado de UI. `export const revalidate/dynamic` ausente en
todas las páginas (no hay ISR). La lógica de home pertenece a RSC + `src/lib`.

### 14. Cache dual desconectado (bug de stale real)

El home usa un cache **cliente** en `localStorage` con TTL 5 min y key v3
(`src/lib/cache/homeCache.ts`, leído en `page.tsx:84-95`, escrito en `:221-227`). Las
mutaciones (p.ej. `publishBusinessAction`) llaman `revalidatePath("/")`
(`src/lib/business/actions.ts:445,615`) que invalida el RSC shell **pero no el cache
localStorage**: un negocio recién publicado queda invisible hasta el TTL.

Además: el efecto de home depende de `[currentTab]` (`page.tsx:252`) → cambiar de tab
re-ejecuta las 4 queries Supabase y reescribe el cache. `clearHomeCache` (`homeCache.ts:70`)
está exportado y jamás se llama.

### 15. 15 componentes >400 líneas (11 >500)

- `ProductSlidePanel.tsx` (864), `Navbar.tsx` (862), `CurvedHomeHeader.tsx` (776),
  `CheckoutSheet.tsx` (706), `ProfileView.tsx` (597), `CartFlow.tsx` (566),
  `DashboardView.tsx` (550), `CartaView.tsx` (549), `SearchAutocompleteOverlay.tsx` (533),
  `AuthSplitLogin.tsx` (512), `BusinessOnboardingWizard.tsx` (493),
  `NotificationPanel.tsx` (476), `StoreShowcase.tsx` (455), `AddressFormModal.tsx` (410).

### 16. `mockData.ts` sobrevive a su propia spec

`src/lib/mockData.ts` (366 líneas) es importado por **15 archivos** (`page.tsx`,
`StoreHubView.tsx`, `StoreShowcase.tsx`, `CartFlow.tsx`, `SearchAutocompleteOverlay.tsx`,
`CurvedHomeHeader.tsx`, `homeCache.ts`, etc.), cuando la spec exige
`docs/specs/negocio-integracion-db-y-rendimiento.md:349` — "**Cero Mocks**: No debe quedar
ninguna referencia activa a `MOCK_BUSINESS` / `MOCK_BUSINESS_STATS` / `MOCK_RECENT_ORDERS` /
`MOCK_PRODUCTS`". El core que pedía la spec sí está implementado
(`src/lib/business/queries.ts`), solo falló la purga.

### 17. Código muerto verificado

- `src/components/business/settings/SettingsLayout.tsx` (191 líneas, tabs vía `?tab=`):
  **cero importadores**. Sus hijos `TabGeneral`, `TabOperacion`, `TabPagos`, `TabCanales`
  son twins muertos de los forms live (`GeneralSettingsForm`, `OperacionSettingsForm`,
  `PagosSection`, `WhatsAppConnectionCard`). Solo `TabEquipo` es usado (por ambos mundos).
- `clearHomeCache` sin llamadores (ver #14).
- Alias `/negocio/[businessId]/equipo/page.tsx` es una redirección que solo sobrevive por el
  tour de onboarding (`DashboardView.tsx:93`) y un `revalidatePath` (`actions.ts:266`).
  `pagos/page.tsx` sí debe conservarse (reenvía `searchParams`, usado por OAuth MP).
- `tsconfig.tsbuildinfo` y `.next/` correctamente en `.gitignore`; el historial git es
  liviano (~3.3 MiB, 473 objetos).

### 18. Servicio de pagos viviendo en el route handler

`src/app/api/webhooks/mercadopago/route.ts` (~200 líneas) contiene todo el dominio de pagos
inline: `mapMpStatus` (`:21-29`), `orderIdFromExternalRef` (`:31-34`),
`markOrderPaid` (`:36-63`), `reconcileOrder` (`:65-97`), `reconcilePayment` (`:99-162`).
Es el anti-patrón de capas: el resto de rutas son wrappers finos hacia `src/lib`.
Además en `reconcilePayment` (`:113-123`) hay una heurística peligrosa: si no se resuelve el
`user_id`, agarra la última sesión `created` de **cualquier negocio** para tomar prestado su
token → mala atribución cross-business; si esa búsqueda falla, un pago válido se descarta en
silencio y la orden queda `awaiting_payment` para siempre.

Otro leak de capas: `getPaymentStatus` (`checkout.ts:523-541`) devuelve filas crudas de DB al
consumidor API; `pedido/[orderId]/page.tsx:18-19` y `api/orders/[orderId]/tracking/route.ts:16-17`
duplican el mismo query en dos boundaries sin serializer compartido.

### 19. `"use client"` sobre-utilizado

97 de 132 archivos tsx (73%) llevan `"use client"`. Apoyados sin necesidad (puramente
presentacionales): `src/components/ui/material-symbol.tsx` (unitario más costoso: lo importan
componentes server, forzando boundary cliente), `menu/ProductImagePlaceholder.tsx`,
`search/HighlightText.tsx`, `store/StoreRatingBadge.tsx`. Los 21 page-files de `src/app` restantes
son server components — la estructura App Router es en general correcta.

### 20. `fetch('/api/...')` inline en 21 componentes sin capa cliente

`PagosSection.tsx:49-174`, `CheckoutSheet.tsx:159-329`, `CartProvider.tsx:180,191,275`,
`ComanderaBoard.tsx:43`, `MpHealthPanel.tsx:75`, `MpPaymentsNotice.tsx:21`,
`MpDevToolsPanel.tsx:65-66`, `WhatsAppChatView.tsx:40`, `LinkOrderModal.tsx:32`, etc. —
`fetch` crudo + string-building `encodeURIComponent` repetido, sin cliente API compartido.

### 21. Estilos duplicados y mezcla

- Color de marca `#9a0002` hardcodeado en **60 archivos**.
- Card-shell `bg-white dark:bg-[#1c1917] border border-black/[0.04] ...` copy-paste en
  `DashboardView.tsx:97-98`, `StatCard.tsx:73,91`, `StoreShowcase`, etc.
- 19 archivos con `style={{...}}` inline junto a Tailwind.
- `components.json` (shadcn) es configuración muerta: `src/components/ui` tiene solo 3
  componentes hand-rolled, sin radix-ui ni class-variance-authority en deps.

### 22. Lista de 13 tablas RLS sin policies

`mp_*` (6), `oauth_states`, `leads`, `admin_audit_log`, `whatsapp_sessions`,
`business_order_counters`, `coupons`, `app_settings`, `meta_oauth_states` — todas
deny-by-default. Ver #8 para el riesgo.

---

## P1 — La "suite de tests" que no corre

### 23. Estado de `*.check.ts` (30 archivos, 1.003 líneas)

Patrón ponytail documentado en `docs/features/05-pedidos-y-comandera/tdd/03-plan-de-pruebas.md`
("Archivos de check runnable, sin framework"). Están excluidos de tsc
(`tsconfig.json:33` `"exclude": ["**/*.check.ts"]`), son linted por eslint (no ignorados),
y **no tienen script `test` ni CI**. `tsx` no está en devDependencies.

- **21 import-based** (testean el módulo vivo — patrón legítimo y barato de mantener).
- **9 copy-based**: duplican la lógica de producción inline y ya DRIFTEARON de ella:
  - `home.check.ts` — `toFeaturedChain` inline es el shape viejo; producción usa
    `resolveBusinessAssetUrl`, añadió `bannerBg/logoImage/deliveryFee/minOrder/...`
    (`src/lib/business/home.ts`). Check verde testando código que ya no existe.
  - `publicStore.check.ts` — su "bug guard" hardcodea `https://example.supabase.co` y siempre
    devuelve URL absoluta; producción (`src/lib/business/assets.ts`) usa el env var y devuelve
    el raw path si falta — justo el bug que el guard dice prevenir.
  - `routeGeometry.check.ts` — su `pointOnPolyline` inline pierde los edge-cases de
    producción (`points.length === 0`, retorno single-element, `total <= 0`).
  - `password.check.ts` — copia de `PASSWORD_RULES` sin el campo `short`.
  - `planLimits.check.ts` — afirma `FREE_PLAN_MAX_PRODUCTS === 25` contra **su propia copia**;
    si producción sube el límite, el check sigue verde.
  - `addresses.check.ts` — hardcodea `BOLIVAR_CENTER`/`haversineKm`/`isWithinBolivar` en vez
    de importar `addresses/constants.ts` / `bolivar.ts`.
  - `trackingMap.check.ts` — testea `demoRouteProgress`, cuya casa hoy es `routeGeometry.ts`.
  - `guards.check.ts` — referencia un `guards.ts` que **no existe**; el código real está en
    `auth/paths.ts`. Archivo huérfano por nombre.
- **20 de 30 no son ejecutables con el comando documentado**: `node --experimental-strip-types`
  fracasa con imports sin extensión o alias `@/`; cuatros archivos (`errors`, `dashboard`,
  `categories`, `addresses`) imprimen una cabecera `Run: node ...` que provablemente falla.
  Sin `tsx` instalado, el "suite" no corre.

**Duplicaciones lógicas derivadas**: `haversineKm` ×4 (`mapProjection.ts`, `bolivar.ts`,
`routeGeometry.check.ts`, `addresses.check.ts`), `toFeaturedChain` ×3, `resolveBusinessAssetUrl`
×2+hardcoded, `PASSWORD_RULES` ×2.

### 24. Cero tests automatizados, y las docs dicen lo contrario

- No hay `vitest/jest/playwright`, ni `*.test.*` / `*.spec.*`, ni script `test`.
- Las TDD docs importan vitest (`docs/features/00..06/tdd/03-plan-de-pruebas.md:11` etc.) y
  `docs/features/05-pedidos-y-comandera/README.md:110` marca `[x] Tests de transiciones` y
  `:128` `[x] Tests con mocks MP` **como hechos**. Falso.
- El commit `30099e9` ("refactor(ponytail): auditoria y poda ... archivos check ...") solo
  borró 4 archivos de chat; la poda de check quedó a medias.

**Recomendación**: blessear el patrón import-based (convertir los 9 copy-based a import-based
y borrar las copias), agregar script `test` + `tsx` como devDependency + CI. No perseguir
1.003 líneas de scaffolding con un framework pesado.

---

## P2 — Tooling, infraestructura y documentación

### 25. Cero CI/CD

`ARQUITECTURA.md:1413-1444` documenta un pipeline GitHub Actions (tsc --noEmit, lint, vitest,
deploy Vercel, `supabase db push`). **No existe**: ni `.github/workflows`, ni `vercel.json`.

### 26. Migraciones aplicadas haphazard

- **No hay `supabase/config.toml`**: la CLI de Supabase nunca se inicializó; no hay historia
  de migraciones en la DB viva.
- `supabase/migrations/20260827_core_business_schema.sql:2` — *"Applied remotely as
  core_business_schema_v2"* (se pegó en el SQL Editor con otro nombre).
- `supabase/migrations/20260903_security_rls.sql:2` — *"Applied via SQL editor"*.
- Dos scripts psql contra el **pooler de producción**
  (`postgresql://postgres.<ref>@aws-0-us-east-1.pooler.supabase.com:6543/postgres` usando
  `SUPABASE_DB_PASSWORD`): `scripts/apply-menu-migration.mjs:39-46` y
  `scripts/apply-whatsapp-messages.mjs:39-46`. No están en `package.json` scripts; leen
  `.env.local` que no existe en el repo (solo `env`).
- `README.md:12` bendice "CLI o dashboard" como intercambiables.
- **`create_order` definido 2 veces con la misma firma** (diamond): `20260829_business_whatsapp.sql:76`
  (sin validación de precio) y `20260903_security_rls.sql:241` (con validación). El resultado
  en DB depende de si la segunda migración se aplicó. Aplicar todo el directorio desde cero
  puede romper.

**Riesgo**: la DB viva puede divergir del directorio de migraciones sin forma de detectarlo.

### 27. `.env.example` no trackeado

`.gitignore:36` (`env*`) traga también `.env.example` → no está en git. Un nuevo dev no puede
bootstrapear keys. Fix: agregar `!.env.example`. Además hay drift entre un `.env` local y el
ejemplo: `DB_PASSWORD`, `MP_APP_ID`, `MP_CLIENT_SECRET`, `MP_REDIRECT_URI`, `MP_OAUTH_USE_PKCE`,
`MP_TOKEN_SECRET`, `MP_WEBHOOK_SECRET` en `.env` y ausentes del ejemplo; `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
al revés.

### 28. n8n: sistema semi-shadow

Positivo: versionado en repo (`n8n/docker-compose.yml`, `n8n/whatsapp-bot.workflow.json`,
`n8n/README.md`; `n8n/.env` untracked).
Negativo:

- ausente del README raíz y de ARQUITECTURA (solo `n8n/README.md` y `docs/whatsapp-chat.md`);
- sin automatización de deploy: `docker compose up` manual + tunnel `cloudflared` con URL
  random `trycloudflare` que aparece como allowed-dev-origin (`next.config.ts:12`);
- **dos sistemas de credenciales paralelos para WhatsApp**: credencial n8n del token piloto vs
  OAuth self-service por negocio con tokens en Supabase Vault (`20260905_whatsapp_oauth.sql`).
  La vía n8n es la vieja; la OAuth es la evolución — conviene decidir cuál es la canónica.
- ARQUITECTURA describe "WhatsApp Bot con IA (GPT-4o)" (`:134,599-604`) — no existe; n8n hace
  parsing por keywords, "Sin LLM en el MVP" (`n8n/README.md:40`).

### 29. ARQUITECTURA.md es una cápsula del tiempo

Discrepancias doc vs código (doc claim → realidad):

| Claim del doc | Realidad |
|---|---|
| Escrow via MercadoPago Marketplace (`:24,132,786-788,819`) | Sin escrow; dinero directo al seller con token propio del negocio; **el propio doc se contradice** en `:1304,1318` ("sin escrow") |
| pg_cron + Background Workers (`:125,342,1454-1468`) | 0 matches de `cron` en `supabase/` |
| `avg_prep_time_mins` recalculado por cron (`:421-425,1268-1285`) | Sin columna ni función |
| `min_price` por cron (`:431-433,1286-1296`) | Sin columna; `products` usa `price_cents int` + `available boolean` |
| Timeout 3 min auto-cancel + refund (`:794-798`) | No implementado (ver #9) |
| Estado global Zustand (`:117`), React Hook Form (`:118`), Google Maps API (`:120,137`), next-pwa (`:121`) | Nada de eso está instalado; state = React Context; PWA hand-rolled (`public/sw.js`); tracking = mapas estáticos |
| `subcategory` en businesses (`:949`), tabla `product_categories` legacy (`:1027-1036`) | No existen; la real es `menu_categories`. El doc lo admite en `:1011` pero deja el bloque contradictorio |
| Tablas `profiles`, `reviews`, `order_tracking`, `delivery_profiles`, `business_delivery_agents`, `payment_transactions`, `order_status_log`, `v_businesses_feed` (`:889-1241`) | Ninguna existe en migraciones. Las reales: `user_profiles`, `businesses`, `business_members`, `business_hours`, `products`, `orders`, `order_items`, `admin_audit_log`, `leads`, `menu_categories`, `coupons`, `notifications`, `mp_*`, `whatsapp_*` |
| Enum `orders.status` `pending_acceptance/.../refunded` (`:1104-1131`) | Real: `('pending','preparing','delivering','delivered','rejected','accepted','ready','cancelled')` (`20260830_order_lifecycle.sql:6-9`) |
| Cara 3 Delivery / repartidores (`:695-770`) | No existe app de delivery ni driver assignment |

Además: `docs/README.md:12` y todos los feature READMEs linkean paths absolutos
`file:///home/cipher/Projects/delivery/...` (rotos en cualquier otra máquina);
`docs/features/rangos-y-logros/` es explícitamente "por implementar"; `SDD.md:33` pone
checkout/pagos en Fase 7+ cuando ya están shippeados; `TDD.md` vs `SDD.md` se contradicen
sobre email signup (deshabilitado vs habilitado) y el código shippea email/password + reset
completo.

### 30. Dependencias y higiene

- `package.json:2` — nombre `"temp-next-app"` (scaffold nunca renombrado).
- `web-push` + `@types/web-push` en **devDependencies** pero: el runtime real es el edge
  function Deno que importa `npm:web-push@3.6.7` directo (`supabase/functions/send-push/index.ts:2`);
  el único uso local es `scripts/generate-vapid-keys.mjs`; `@types/web-push` no lo referencia
  ningún TS. Sobran en la raíz.
- `sharp` en devDeps es correcto (solo un script de iconos).
- `react-hot-toast` no está (bien): se usa un `FlashToast` local.
- Duplicación de URLs/base de MP: `https://api.mercadopago.com` hardcodeada en
  `provisioning.ts:34` y `oauthConfig.ts:89,113` en vez de `MP_API` (`mp-fetch.ts:1`).
- Secretos/constantes hardcodeados: `MP_BOLIVARPIDE_APP_ID` (`oauthConfig.ts:4`);
  `MP_TOKEN_SECRET` cae a `AUTH_SECRET` (`env.ts:57`); router público
  `https://router.project-osrm.org` con nota "ponytail" (`routeGeometry.ts:70-72`);
  tiles OSM sin key (`mapProjection.ts:106-108`); geocoding Nominatim con UA hardcodeado
  (`storeLocation.ts:40-62`); `allowedDevOrigins` con rangos LAN + trycloudflare
  (`next.config.ts:10-19`); `54` como prefijo WhatsApp (`kitchen.ts:67-72`).

### 31. Errores silenciados / fire-and-forget

- `void emit...` sin `.catch`: `actions.ts:83,86,144,147`, `pending.ts:124`, `checkout.ts:249`,
  `webhooks/mercadopago/route.ts:62` (unhandled rejection atomic a la respuesta).
- Errores DB tragados como errores de dominio: `applyCoupon` ignora el error
  (`checkout.ts:96-104`) → cualquier fallo de DB sale como "Cupón inválido o expirado";
  `pending.ts:51-57` (select de sesión ignora error → null silencioso); `kitchen.ts:103-108`;
  `trackingMap.ts:77-80`.
- Comparaciones de secretos no constant-time: `webhooks/whatsapp/route.ts:41` (`!==`),
  `webhooks/meta/route.ts:22` (`===`).

---

## Mapa de prioridades de remediación

**Fase 1 — Apagar los incendios (P0)**
1. Verificación de precio server-side en el checkout web (validación equivalente a `create_order`).
2. `markOrderPaid` transaccional: predicado + monto + idempotencia por evento.
3. Refund idempotente (key estable + update condicional).
4. Cron de expiración de sesiones QR + timeout de aceptación (pg_cron es la vía natural).
5. Cerrar leak cross-tenant (`diagnostics`/`health`), roles en `require-member-api`, fix de `send-push`.

**Fase 2 — Estado máquina y capas**
6. Unificar el enum de estados (decidir DB vs TS como fuente de verdad; migrar legacy).
7. Mover el dominio de pagos fuera del route handler a `src/lib/mercadopago/`.
8. Un solo sistema de cache para home (RSC + `revalidatePath`, o invalidación del localStorage cache).

**Fase 3 — Higiene (bajo riesgo, paralelizable)**
9. Borrar `mockData.ts`, `SettingsLayout.tsx` + twins, `clearHomeCache`; apuntar el tour a
   `/configuracion/equipo`; limpiar alias `/equipo`.
10. Convertir los 9 `.check.ts` copy-based a import-based (o reemplazarlos por vitest real);
    script `test` + `tsx` devDep + CI.
11. Regenerar ARQUITECTURA.md contra `docs/specs/payments-qr-mp.md`; trackear `.env.example`;
    inicializar Supabase CLI y reconciliar el historial de migraciones; renombrar el package.

---

## Files clave referenciados

- `src/app/api/orders/checkout/route.ts` · `src/lib/mercadopago/checkout.ts` — precio cliente (P0 #1)
- `src/app/api/webhooks/mercadopago/route.ts` — mark-paid incondicional + dominio en route (P0 #3, P1 #18)
- `src/lib/mercadopago/refund.ts` — idempotency de refund (P0 #2)
- `src/lib/business/require-member-api.ts` — roles de MP admin (P0 #6)
- `src/lib/orders/lifecycle.ts` · `actions.ts` · `pending.ts` — state machine y races (P0 #10-11)
- `src/app/page.tsx` · `src/lib/cache/homeCache.ts` · `src/lib/business/actions.ts` — home + cache dual (P1 #13-14)
- `src/lib/mockData.ts` — mocks vivos (P1 #16)
- `src/components/business/settings/SettingsLayout.tsx` — UI settings muerta (P1 #17)
- `src/lib/*.check.ts` (30) — suite de tests no ejecutable (P1 #23-24)
- `supabase/migrations/*` — RLS, estado DB y migraciones manuales (P2 #26)
- `ARQUITECTURA.md` · `docs/specs/payments-qr-mp.md` · `docs/features/*` — deuda documental (P2 #29)