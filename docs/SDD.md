# SDD — BolivarPide (Software / System Design)

> Documento de diseño de sistema. Define *qué* construimos, para *quién*, y en *qué orden*.
> Complemento técnico: [`TDD.md`](./TDD.md).

**Proyecto Supabase:** `bolivarPide` (`tqffhcikdjxsbctruhzt`, `sa-east-1`)  
**App:** Next.js (App Router) · **3 PWAs** (cliente `/` · negocio `/negocio` · admin `/admin`)  
**Fecha:** 2026-08-27 · **Estado:** borrador v0.3

---

## 1. Decisión de enfoque

**Empezamos por el negocio (local), no por el marketplace completo.**

Razones:

1. El panel ya modela el dominio: carta, pedidos, abierto/cerrado, equipo, config.
2. Sin `business` + `products` + `orders` no hay feed real en home.
3. Alta comercial actual: lead → admin aprueba → membership (**nada automático**).
4. Auth es **una sola identidad OAuth** para cliente y operador de local.

**Orden de expansión modular (ver especificaciones en `docs/features/`):**

```
Fase 0  Infra + OAuth + sesión + guards         → docs/features/00-auth-e-identidad/
Fase 1  Hub de membresías + perfil local + carta  → docs/features/01-negocio-y-membresias/
Fase 2  Catálogo & Carta Digital                → docs/features/02-catalogo-y-carta/
Fase 3  Equipo / invitaciones staff + bajas     → docs/features/03-equipo-e-invitaciones/
Fase 4  Admin /admin (leads, PWA Admin, claim)  → docs/features/04-leads-admin-y-onboarding/
Fase 5  Pedidos (comandera) + alertas realtime  → docs/features/05-pedidos-y-comandera/
Fase 6  Home cliente lee DB (published)         → docs/features/06-marketplace-cliente/
Fase 7+ Carrito / checkout / pagos (después)
```

> 📌 **Specs detalladas:** Cada fase cuenta con su propio par de documentos `SDD.md` (requisitos, historias Gherkin) y `TDD.md` (esquemas Zod, RLS, contratos y tests unitarios/integración) dentro de [docs/features/](file:///home/cipher/Projects/delivery/docs/features/).

---

## 2. Visión

BolivarPide conecta **locales** de San Carlos de Bolívar con **clientes**.

| Superficie | URL | PWA | Quién |
|------------|-----|-----|--------|
| Cliente | `/` | PWA cliente (`/`) | Descubre, pide (luego) |
| Negocio | `/negocio/*` | PWA negocio (`/negocio`) | Opera local(es), comandera, carta |
| Admin | `/admin/*` | PWA admin (`/admin`) | Plataforma: habilitar, métricas, impersonar |

Una persona = **un** `auth.users` vía OAuth. Según contexto cambia la UI (ej. sidebar cliente: “Ir a mi negocio” si es `owner`/`staff`, vs “Afiliar / abrir mi negocio” si no).

---

## 3. Auth (producto)

### Reglas cerradas

- **Auth:** OAuth (Google) **y** email/password (habilitado mientras no haya DNS/callback estable para OAuth). Misma cuenta sirve para pedir y operar un local.
- Sesión persistente (cookies preferidas vía `@supabase/ssr`; localStorage solo si hace falta en PWA — ver TDD).
- Entrar a `/negocio/*` **sin** sesión → redirect a **login negocio** (misma familia OAuth, copy/layout distinto al login cliente; UI después).
- Entrar a `/negocio/*` **con** sesión pero **sin** `business_members` activos → hub vacío / CTA lead o invitaciones pendientes (no dashboard de un local inventado).

### Providers

Prioridad: los que Supabase Active Social configure con menos fricción (**Google** primero; **Apple** / **Facebook** si el setup es simple). Instagram solo si hay path claro en Auth; si no, queda fuera.

---

## 4. Actores

| Actor | Cómo se reconoce | Superficie |
|-------|------------------|------------|
| Cliente | OAuth, sin membership (o con membership pero en PWA cliente) | `/` |
| Dueño / staff / driver | OAuth + fila(s) en `business_members` | `/negocio` hub + `/negocio/[businessId]/*` |
| Lead | Formulario registro (puede estar logueado o no) | `/negocio/registro` → `leads` |
| Admin plataforma | `app_metadata.role = admin` (whitelist) | `/admin` |
| Impersonación | Admin “ojo” → sesión/contexto como dueño de ese local | `/negocio/[businessId]/*` bajo flag admin |

---

## 5. Flujos críticos

### 5.1 Login unificado, tres puertas

```
[PWA Cliente]  →  Login cliente (OAuth)  →  /
[PWA Negocio]  →  Login negocio (OAuth)  →  /negocio (hub)
[PWA Admin]    →  Login admin (OAuth)    →  /admin (falla si app_metadata.role != admin)
```

Mismo IdP; distinto redirect y copy.

### 5.2 Hub de membresías (`/negocio`)

Tras login negocio, el usuario ve un **dashboard de afiliaciones**:

- Locales donde es **owner**
- Locales donde es **staff** / **driver**
- **Invitaciones pendientes** (confirmar / rechazar para unirse al staff)
- Acción **Salir** (sign out)
- Entrar a un local → `/negocio/[businessId]/dashboard` (**scoped por path param**, evitando colisiones entre pestañas o múltiples locales)

Un usuario puede ser dueño de uno y staff de otro (multi-membership desde v1 del hub).

### 5.3 Alta de comercio (sin automatismo)

1. Lead completa `/negocio/registro` → `leads.status = pending`.
2. Admin en `/admin`: **aprueba lead**.
3. Se crea `businesses` y se vincula `business_members(owner)`:
   - **Vínculo directo:** Si el email del lead coincide con un `auth.users` existente.
   - **Claim Link / Onboarding Token:** Si el comerciante usa otro correo OAuth o aún no se logueó, se genera un enlace de reclamo único de un solo uso para asociar el local a su primer login OAuth.
4. Admin puede luego: **`published`**, **desbloquear plan** (Free → Premium), y **impersonar** (ojo → panel como dueño).

Nada de auto-crear business al primer login OAuth sin lead aprobado.

### 5.4 Sidebar en home cliente

| Condición | CTA |
|-----------|-----|
| Tiene membership `owner` o staff activo | “Ir a mi negocio” → PWA/ruta negocio (hub o local activo) |
| No tiene membership | “Abrir / afiliar mi negocio” → registro lead o info |

### 5.5 Guard negocio

Sin sesión → login negocio.  
Con sesión, sin members ni invites → hub con vacío + camino a lead.  
Con members → elegir local en `/negocio` o deep-link a `/negocio/[businessId]/dashboard`.

---

## 6. Admin (`/admin`)

Superficie **separada**, diseño propio y soporte **PWA** (instalable).

### Capacidades PWA Admin (Fase 4)

- **Instalable en móvil / desktop:** Acceso directo e independiente con su propio manifest (`manifest-admin.webmanifest`) y `scope: '/admin'`.
- **Alertas operativas:** Monitoreo rápido de nuevos leads pendientes y estado de la plataforma.
- **UI Responsiva:** Layout adaptado a mobile (cards de acción rápida) y desktop (tablas y métricas completas).

### Acciones v1

- Aprobar / rechazar **leads** (con generación de claim token si aplica)
- Listar comercios: setear **`published`**
- **Desbloquear planes** (Free / Premium — modelo simple)
- **Impersonar**: listado de comercios + control “ojo” abre `/negocio/[businessId]` **como si fuera el dueño** (auditoría obligatoria)

### KPIs mínimos v1

- Comercios **totales**
- Comercios **activos** (definición: `published` y/o con actividad reciente — fijar al implementar)
- Comercios **pendientes** (leads `pending` + businesses no publicados)
- **Pedidos** (hoy / semana / mes)
- GMV / ticket promedio / cancelaciones — candidatas a sumar en debate

---

## 7. Capacidades por fase (resumen)

| Fase | Entrega |
|------|---------|
| **0** | Supabase healthy, OAuth, sesión cookie, guards `/negocio` y `/admin` |
| **1** | Hub membresías + `businesses` + carta CRUD (scoped por path) |
| **2** | Pedidos + stats panel local + alertas realtime/sonido |
| **3** | Invitaciones staff, aceptar/rechazar, salir del equipo |
| **4** | `/admin` leads, published, planes, KPIs, impersonar + **PWA Admin** |
| **5** | Home lee locales `published` |
| **6+** | Carrito, pago, tracking cliente |

---

## 8. Dominio (vista)

```
auth.users (solo OAuth)
├── profiles? (display name, avatar — opcional)
├── business_members (user ↔ business + role + status)
│     status: active | invited | left
├── businesses (plan, published, is_open, …)
│     ├── products, business_hours, orders, order_items
│     └── …
├── leads (con onboarding_token / claim_expires_at)
└── admin_audit_log (impersonate, approve_lead, publish, plan_change)
```

---

## 9. Fuera de alcance (ahora)

- Registro email/password o “cuenta solo plataforma”
- Auto-aprobación de comercios sin validación de admin
- Checkout / Mercado Pago (fase posterior)
- App nativa de tiendas iOS/Android (PWAs sí)
- Instagram Auth si no hay integración simple en Supabase

---

## 10. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Impersonación abusiva | Solo `role=admin`; audit log; TTL corto; banner visible en panel |
| Lead email ≠ OAuth email | Link de onboarding con Claim Token seguro de un solo uso |
| 3 PWAs / misma origin | Manifests con scopes aislados (`/`, `/negocio`, `/admin`); sesión compartida por cookies de dominio |
| Proyecto `COMING_UP` | Activar a `ACTIVE_HEALTHY` antes de migrar |

---

## 11. Criterios de avance

**Listo para operar un local real (sin marketplace completo):**

- [ ] OAuth + sesión estable  
- [ ] Hub membresías + al menos 1 local owner (`/negocio/[businessId]`)  
- [ ] Carta CRUD  
- [ ] Pedidos E2E (aunque sea seed) + Realtime  
- [ ] Admin puede aprobar lead + published + ojo impersonar  
- [ ] PWA Admin instalable y funcional en mobile/desktop  

**Listo para home con datos reales:**

- [ ] ≥1 business `published`  
- [ ] Feed cliente lee Supabase  
  
