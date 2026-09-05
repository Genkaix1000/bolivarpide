# TDD — BolivarPide (Technical Design)

> Diseño técnico Supabase + Next.js. *Cómo* implementamos el [`SDD.md`](./SDD.md).

**Proyecto:** `bolivarPide` · `tqffhcikdjxsbctruhzt` · https://tqffhcikdjxsbctruhzt.supabase.co  
**Stack:** Next.js 16 · React 19 · `@supabase/supabase-js` · (añadir `@supabase/ssr`) · Zod  
**Clientes hoy:** `src/lib/supabase/client.ts`, `server.ts`  
**Migración local:** `supabase/migrations/20260718_create_leads_table.sql`  
**Fecha:** 2026-08-27 · **Estado:** borrador v0.3

---

## 1. Principios

1. **Negocio primero** en schema/APIs; cliente consume `published` después.
2. **Solo OAuth** — deshabilitar email signup en Supabase Auth.
3. **Una identidad** (`auth.users`) para cliente y operador; autorización por tablas + `app_metadata`.
4. **RLS on** en `public`; **nunca** autorizar con `user_metadata`.
5. **Service role** solo server (admin, approve lead, impersonation bootstrap).
6. **Path params para scoping** — `/negocio/[businessId]/*` evita colisiones multi-pestaña y desacopla sesión global de contexto de tienda.
7. **Yagni** — tablas y componentes cuando el flujo los pide.

---

## 2. Entorno

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + SSR con RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (admin / jobs) |

Auth dashboard: habilitar providers sociales; **desactivar** “Email” signups (o dejar email solo como identity vinculada por el IdP, sin password flow propio).

---

## 3. Auth técnica

### 3.1 Providers

| Provider | v1 | Notas |
|----------|----|--------|
| Google | Sí | Primero |
| Apple | Si setup simple | iOS/PWA |
| Facebook | Si setup simple | |
| Instagram | Solo si Auth lo soporta limpio | Si no → out |

Callback OAuth único; el **redirect post-login** depende de origen:

- Login cliente → `/`
- Login negocio → `/negocio` (hub)
- Login admin → `/admin` (falla si no admin)

### 3.2 Sesión

- Preferir **cookies** con `@supabase/ssr` (App Router + middleware).
- PWAs del mismo origen comparten cookie de sesión (deseable para un solo login).
- `localStorage` solo como fallback documentado si un edge de PWA lo exige; no es el source of truth preferido.

Middleware:

- `/negocio/*` (excepto login/registro público/claim): requiere sesión.
- `/admin/*`: requiere sesión + `app_metadata.role === 'admin'`.
- Sin membership en rutas de panel scoped (`/negocio/[businessId]/*`): redirect a hub `/negocio`.

### 3.3 Login UI

Pantallas de acceso contextualizadas (mismos botones OAuth, distinto branding):

- `/login` — cliente  
- `/negocio/login` — negocio  
- `/admin/login` — acceso plataforma (redirige a `/admin` tras validar rol)

### 3.4 Roles

```text
app_metadata.role = 'admin'     -- plataforma (whitelist manual)
business_members.role = owner | staff | driver
business_members.status = invited | active | left | rejected
```

No usar `user_metadata` para roles.

---

## 4. Schema (Fase 0–4)

### 4.1 `leads` (existente y extensiones)

Mantener migración actual. Extender:
- `approved_business_id uuid null references businesses(id)`
- `approved_at timestamptz null`
- `approved_by uuid null references auth.users(id)`
- `claim_token text null unique` (hash/token para onboarding seguro)
- `claim_expires_at timestamptz null`

### 4.2 Core

```text
businesses
  id, slug, name, tagline
  logo_path, banner_path
  is_open boolean default true
  published boolean default false
  plan text default 'free' check (plan in ('free','premium'))
  rating numeric default 0, reviews_count int default 0, prep_time_minutes int default 30
  phone, address, city, province, postal_code
  created_at, updated_at

business_members
  id
  business_id → businesses
  user_id → auth.users
  role: owner | staff | driver
  status: invited | active | left | rejected
  invited_by uuid null
  invited_at, responded_at, created_at
  unique (business_id, user_id)

business_hours
  business_id, weekday, open_time, close_time, closed

products
  id, business_id, name, description, category
  price_cents int, available boolean default true, image_path, sort_order int default 0
  created_at, updated_at

orders / order_items
  (status machine + price_cents)

admin_audit_log
  id, actor_user_id, action, target_type, target_id
  meta jsonb, created_at
  -- actions: approve_lead | reject_lead | set_published | set_plan | impersonate_start | impersonate_end
```

### 4.3 Storage

| Bucket | Uso |
|--------|-----|
| `business-assets` | logo, banner |
| `product-images` | fotos de productos |

Path: `{business_id}/...` · write solo members `active`.

### 4.4 RLS (idea)

- `is_business_member(bid)` → `status = 'active'`.
- `is_platform_admin()` → `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`.
- Products públicos: `select` si `businesses.published`.
- Members: owner/staff gestionan invites; invitee puede `update` su fila `invited → active|rejected`.
- Admin policies: select amplio + mutaciones vía **Server Actions con service role** o policies admin explícitas (preferir actions + audit).

---

## 5. Flujos técnicos

### 5.1 Approve lead & Onboarding

Server Action (service role):

1. Validar caller admin (`is_platform_admin()`).
2. Insert `businesses` (+ `business_hours` por defecto).
3. Resolver `user_id`:
   - **Caso A (Match directo):** Si existe `auth.users` con el email del lead, crear `business_members (owner, active)` de inmediato.
   - **Caso B (Onboarding Claim Token):** Si no existe usuario aún o usa otro proveedor OAuth, generar `claim_token` seguro en `leads`.
4. El admin o sistema entrega link: `/negocio/onboarding?claim=[token]`.
5. Al loguearse con cualquier OAuth via ese link, se ejecuta la acción `claim_business_ownership` que vincula `auth.uid()` con `business_members (owner, active)` y quema el token.
6. Actualizar `leads.status = approved` y registrar en `admin_audit_log`.

### 5.2 Hub & Scoping `/negocio`

- Hub (`/negocio`): Query de `business_members` de `auth.uid()` (`active` o `invited`).
- Panel Scoped: Rutas bajo `/negocio/[businessId]/...` (ej. `/negocio/[businessId]/dashboard`, `/negocio/[businessId]/carta`, `/negocio/[businessId]/pedidos`).
- Layout valida pertenencia `auth.uid() ↔ [businessId]` o rol admin en modo impersonación.

### 5.3 Impersonación admin

1. Admin en `/admin` → clic en botón “ojo” sobre un comercio.
2. Redirección directa a `/negocio/[businessId]/dashboard?impersonate=true`.
3. Server Action / Cookie de sesión de impersonación temporal (`impersonate_business_id`, TTL 1h) + registro `impersonate_start` en `admin_audit_log`.
4. Banner global persistente: *"Viendo como dueño de [Nombre Local] — [Salir de impersonación]"*.
5. Salir: limpia contexto y redirige a `/admin` (+ registro `impersonate_end`).

### 5.4 CTA sidebar cliente

Server/client lee memberships activas:

- Si hay ≥1 → “Ir a mi negocio” → `/negocio` (o deep link al último `businessId`).
- Si 0 → “Abrir mi negocio” → `/negocio/registro`.

---

## 6. Tres PWAs (Cliente, Negocio, Admin)

Configuración multi-PWA en el mismo dominio utilizando manifests dedicados y scopes aislados:

| Superficie | `start_url` | `scope` | Manifest | Icono / Theme |
|------------|-------------|---------|----------|---------------|
| **Cliente** | `/` | `/` | `/manifest.webmanifest` | Marca principal (`#9a0002`) |
| **Negocio** | `/negocio` | `/negocio` | `/manifest-negocio.webmanifest` | Tema operativo / local |
| **Admin** | `/admin` | `/admin` | `/manifest-admin.webmanifest` | Tema control / plataforma |

Next.js implementa esto mediante `Route Handlers` (`app/manifest-negocio.webmanifest/route.ts`, `app/manifest-admin.webmanifest/route.ts`) o links dinámicos en el `<head>` de cada layout respectivo.

---

## 7. Admin UI (`/admin`) — Contrato y PWA

### Listados y KPIs
- Leads por status (con botón de aprobar + generar claim link)
- Comercios (nombre, plan, published, is_open, created_at) + botón de impersonar
- KPIs: `commerces_total`, `commerces_published`, `leads_pending`, `orders_today`, GMV

### PWA Admin
- Diseñado mobile-first (cards táctiles) y desktop (tablas completas).
- Notificaciones/Badges de nuevos leads pendientes.

### Mutaciones
`set_published`, `set_plan`, `approve_lead`, `reject_lead`, `claim_business_ownership`, `start_impersonation`.

---

## 8. Capas Next.js

```
Browser     → @supabase/ssr browser client → RLS
Middleware  → refresh session + route guards (admin / negocio)
Server      → SSR client as user
Admin ops   → Server Actions + service role + audit_log
```

**Realtime & Notificaciones:**
- Comandera (`/negocio/[businessId]/pedidos`): Suscripción a tabla `orders` filtrada por `business_id` + alerta sonora con Web Audio API.
- Admin (`/admin`): Suscripción a nuevos `leads` pendientes.

---

## 9. Plan de implementación modular (TDD Specs)

Las especificaciones técnicas y planes de test detallados por módulo se encuentran en [docs/features/](./features/):

- 🔐 **Fase 0 — [00-auth-e-identidad/tdd/](./features/00-auth-e-identidad/tdd/)**: Cookies `@supabase/ssr`, middleware guards, PKCE OAuth y session parsing tests.
- 🏪 **Fase 1 — [01-negocio-y-membresias/tdd/](./features/01-negocio-y-membresias/tdd/)**: Schema `businesses` y `business_members`, RLS policies, helpers `is_business_owner`.
- 🍕 **Fase 2 — [02-catalogo-y-carta/tdd/](./features/02-catalogo-y-carta/tdd/)**: Schema `products`, bucket de imágenes (`business-assets`), conversiones de centavos y tests de catálogo.
- 👥 **Fase 3 — [03-equipo-e-invitaciones/tdd/](./features/03-equipo-e-invitaciones/tdd/)**: Ciclo de vida de invitaciones, roles y permisos de staff.
- 🛡️ **Fase 4 — [04-leads-admin-y-onboarding/tdd/](./features/04-leads-admin-y-onboarding/tdd/)**: Schema `leads`, `admin_audit_log`, generación/canje de claim tokens e impersonación.
- 🔔 **Fase 5 — [05-pedidos-y-comandera/tdd/](./features/05-pedidos-y-comandera/tdd/)**: Schema `orders`, Supabase Realtime y máquina de estados.
- 🛍️ **Fase 6 — [06-marketplace-cliente/tdd/](./features/06-marketplace-cliente/tdd/)**: Cache en Next.js, helpers de cálculo de horarios y feed público.

---

## 10. Seguridad checklist

- [ ] Email/password signup off en Supabase Auth
- [ ] RLS activo en todas las tablas de `public`
- [ ] Roles estrictamente en `app_metadata` y `business_members`
- [ ] Service role nunca expuesto al browser
- [ ] Impersonación: admin-only + audit log + banner + TTL
- [ ] Claim tokens: de un solo uso, firmados y con expiración
- [ ] Scopes PWA aislados para evitar cache overlap

---

## 11. Decisiones cerradas / abiertas

| Tema | Decisión |
|------|----------|
| Auth | **Solo OAuth** (Google + otros fáciles) |
| Cuenta única | Cliente + negocio misma identity |
| Alta comercio | Lead → admin aprueba (manual) |
| Vínculo Lead ↔ Owner | **Match directo** si email existe; **Magic Claim Link** con token si difiere |
| Scoping Negocio | **Path params** (`/negocio/[businessId]/*`) |
| PWAs | **3 PWAs** (`/`, `/negocio`, `/admin`) con manifests y scopes dedicados |
| Admin | Superficie `/admin` con PWA instalable |
| Impersonar | Sí, con ojo + audit + banner visible |
| Money | `price_cents` int |
| Sesión | Cookies SSR preferidas (`@supabase/ssr`) |

| Tema | Abierto |
|------|---------|
| Definición exacta “comercio activo” en KPI | `published = true` vs con actividad/pedidos en últimos 30 días |

---

## 12. Primer entregable

Con DB `ACTIVE_HEALTHY`:

1. OAuth Google + cookies SSR + guards de ruta.  
2. Migración core `businesses` + `business_members` + campos claim en `leads`.  
3. Hub `/negocio` y layout base `/negocio/[businessId]/dashboard`.  
4. Stub `/admin` protegido con guard de rol admin.  

Luego carta, comandera con Realtime y onboarding completo de leads.

