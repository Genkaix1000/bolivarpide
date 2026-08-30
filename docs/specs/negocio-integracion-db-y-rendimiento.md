# Spec — Integración de Base de Datos y Optimización de Rendimiento para Negocios

**Fecha:** 2026-08-29  
**Estado:** Propuesta Técnica Aprobada — Pendiente de Ejecución  
**Módulo:** Portal de Negocios (`/negocio/*`), Shell, APIs y Caching  
**Ubicación:** `docs/specs/negocio-integracion-db-y-rendimiento.md`  

---

## 1. Objetivo y Alcance

### 1.1. Objetivo Principal
1. **Conexión Total con Supabase (De-Mocking):** Reemplazar el 100% de los datos mockeados, semillas y constantes en memoria (`MOCK_BUSINESS`, `MOCK_BUSINESS_STATS`, `MOCK_RECENT_ORDERS`, `MOCK_SALES_CHART`, `MOCK_PRODUCTS`, `MOCK_TUTORIAL_TASKS`, `NOTIFICATIONS`, etc.) por lecturas y escrituras reales en la base de datos Supabase.
2. **Optimización Radical de Latencia:** Resolver los cuellos de botella de red detectados en los logs, reduciendo el tiempo de ejecución en servidor (`application-code`) de **~400ms a <100ms** mediante `React.cache()` (request memoization), eliminación de waterfalls y consultas relacionales (`JOIN`).

### 1.2. Alcance Explícito
* **En Scope:**
  * Topbar del negocio (identidad, notificaciones reales, logout).
  * Sidebar del negocio (comisión y plan real).
  * Dashboard de negocio (KPIs calculados, gráfico de facturación por período, pedidos recientes, tour/onboarding reactivo).
  * Panel lateral del comercio (`StoreSidePanel` & `StoreShowcase.tsx`: perfil real, toggle de apertura, carta rápida de stock interactiva).
  * Pantalla de configuración (horarios reales desde `business_hours`, dirección).
  * Vista de cliente (`/c/[slug]` conectada a `businesses` y `products` de Supabase).
  * Capa de queries (`src/lib/business/queries.ts`) optimizada con memoization.
* **Fuera de Scope:**
  * Modificaciones en el motor de pagos Mercado Pago (ya implementado y aislado en `docs/specs/payments-qr-mp.md`).
  * Facturación electrónica automática con AFIP (diferido).

---

## 2. Diagnóstico Técnico de Rendimiento y Análisis de Logs

### 2.1. Análisis de los Tiempos Actuales
A partir de las trazas del servidor:

```text
GET /negocio/.../pedidos 200 in 3.1s (next.js: 2.7s, proxy.ts: 85ms, application-code: 377ms)
GET /negocio/.../carta   200 in 887ms (next.js: 382ms, proxy.ts: 68ms, application-code: 437ms)
GET /negocio/.../pedidos 200 in 498ms (next.js: 42ms,  proxy.ts: 90ms, application-code: 366ms)
GET /negocio/.../pedidos 200 in 467ms (next.js: 9ms,   proxy.ts: 87ms, application-code: 371ms)
GET /negocio/.../pagos   200 in 550ms (next.js: 41ms,  proxy.ts: 74ms, application-code: 435ms)
```

| Capa | Tiempo | Causa Raíz | Mitigación |
| :--- | :--- | :--- | :--- |
| **`next.js`** (Compilación) | `2.7s` (frío) / `9-45ms` (caliente) | Compilación JIT de páginas en entorno `development`. | En `production` (`next build && next start`), este valor es **0 ms** (código precompilado). |
| **`proxy.ts`** (Middleware) | `70–90ms` | Llamada HTTP remota a `supabase.auth.getUser()`. | Latencia física de red ineludible hacia Supabase Auth desde Argentina (~70ms). No debe bloquear ni duplicarse. |
| **`application-code`** (Server Components) | `370–440ms` | **Waterfall de 6 a 8 roundtrips HTTP secuenciales** a Supabase por petición. | `React.cache()` para memoizar `getUser()` y `requireBusinessAccess()` + `JOIN` único en SQL + `Promise.all()`. |

### 2.2. Visualización del Waterfall Actual vs. Optimizado

#### Waterfall Actual (8 llamadas de red en serie $\approx$ 400ms):
```text
Middleware:  [-- getUser() 80ms --]
Layout:                          [-- getUser() 80ms --][-- members 70ms --][-- business 70ms --]
Page:                                                                                           [-- getUser() 80ms --][-- members 70ms --][-- business 70ms --][-- data 70ms --]
Total Application Time: ~440ms
```

#### Flujo Optimizado (2 llamadas en paralelo $\approx$ 80ms):
```text
Middleware:  [-- getUser() 80ms --]
Layout:                          [-- requireBusinessAccess (JOIN memoizado) 80ms --]
Page:                            [-- Cache Hit (0ms) --] | [-- Fetch Data (Paralelo) 80ms --]
Total Application Time: ~80ms
```

---

## 3. Modelo de Datos y Esquema Supabase

### 3.1. Tablas y Relaciones Utilizadas

```
┌────────────────────────────────┐       ┌────────────────────────────────┐
│           businesses           │       │        business_members        │
├────────────────────────────────┤       ├────────────────────────────────┤
│ id (PK, uuid)                  │◄──────┤ business_id (FK, uuid)         │
│ name (text)                    │       │ user_id (FK, uuid)             │
│ slug (text, UNIQUE)            │       │ role (owner | staff | driver)  │
│ tagline (text)                 │       │ status (active | invited)      │
│ logo_path (text)               │       └────────────────────────────────┘
│ banner_path (text)             │
│ is_open (boolean)              │       ┌────────────────────────────────┐
│ published (boolean)            │       │         business_hours         │
│ plan (free | impulso | lider)  │       ├────────────────────────────────┤
│ rating (numeric)               │◄──────┤ business_id (FK, uuid)         │
│ reviews_count (integer)        │       │ weekday (0=Dom .. 6=Sab)       │
│ prep_time_minutes (integer)    │       │ open_time (time)               │
│ address, city, postal_code     │       │ close_time (time)              │
│ mp_ready (boolean)             │       │ closed (boolean)               │
└──────────────┬─────────────────┘       └────────────────────────────────┘
               │
               ├─────────────────────────┐
               ▼                         ▼
┌────────────────────────────────┐ ┌────────────────────────────────┐
│            products            │ │             orders             │
├────────────────────────────────┤ ├────────────────────────────────┤
│ id (PK, uuid)                  │ │ id (PK, uuid)                  │
│ business_id (FK, uuid)         │ │ business_id (FK, uuid)         │
│ name (text)                    │ │ customer_name (text)           │
│ category (text)                │ │ customer_phone (text)          │
│ price_cents (integer)          │ │ status (pending..delivered)    │
│ available (boolean)            │ │ total_cents (integer)          │
│ image_path (text)              │ │ payment_method (text)          │
│ sort_order (integer)           │ │ created_at (timestamp)         │
└────────────────────────────────┘ └──────────────┬─────────────────┘
                                                  │
                                                  ▼
                                   ┌────────────────────────────────┐
                                   │          order_items           │
                                   ├────────────────────────────────┤
                                   │ id (PK, uuid)                  │
                                   │ order_id (FK, uuid)            │
                                   │ product_id (FK, uuid)          │
                                   │ name (text)                    │
                                   │ quantity (integer)             │
                                   │ unit_price_cents (integer)     │
                                   └────────────────────────────────┘
```

---

## 4. Especificación Detallada por Componente

### 4.1. Shell: Topbar (`BusinessTopbar.tsx`) y Sidebar (`BusinessSidebar.tsx`)

#### Topbar
* **Identidad de Usuario:**
  * Leer `user` desde `requireUser()` (memoizado).
  * Obtener `display_name` y `avatar_gradient_id` desde `user_profiles`.
  * Nombre visible: `display_name || user.email.split('@')[0]`.
  * Iniciales: Primeras letras de `display_name` (o 2 primeros caracteres del email en mayúsculas).
  * Plan mostrado en dropdown: `businesses.plan` capitalizado (`"Plan Inicial"`, `"Plan Impulso"`, `"Plan Líder"`).
* **Notificaciones:**
  * Consultar pedidos `pending` de los últimos 60 minutos: `SELECT id, customer_name, total_cents, created_at FROM orders WHERE business_id = :id AND status = 'pending' ORDER BY created_at DESC LIMIT 3`.
  * Notificaciones de stock: `SELECT name FROM products WHERE business_id = :id AND available = false LIMIT 2`.
  * Badge numérico: Total de pedidos pendientes sin aceptar hoy.
* **Cierre de sesión:** Conectar botón "Desconectar" con Server Action `signOut()`.

#### Sidebar
* **Tarjeta inferior de Plan:**
  * Reflejar dinámicamente el plan actual del local (`businesses.plan`).
  * Comisión: Plan `free` $\rightarrow$ `7%`, `impulso` $\rightarrow$ `3,5%`, `lider` $\rightarrow$ `0%`.

---

### 4.2. Dashboard Principal (`src/app/negocio/[businessId]/dashboard/page.tsx`)

#### A. Métricas de KPI (`StatCard`)
Implementar función optimizada `getBusinessMetrics(businessId, period)`:
* **Ingresos (`revenue`):**
  * `period = "today"`: `SUM(total_cents)` de `orders` donde `created_at >= CURRENT_DATE` y `status = 'delivered'`.
  * `period = "week"`: `SUM(total_cents)` de los últimos 7 días con `status = 'delivered'`.
  * `period = "month"`: `SUM(total_cents)` del mes calendario actual con `status = 'delivered'`.
* **Pedidos Completados (`orders`):**
  * `COUNT(*)` de órdenes entregadas en el intervalo seleccionado.
* **Ticket Promedio (`avgTicket`):**
  * $\frac{\text{Ingresos Totales}}{\text{Pedidos Entregados}}$ (retorna `$0` si no hay órdenes).
* **Sparklines:** Generar array de 7 puntos con la evolución diaria/horaria real para renderizar la curva en el `StatCard`.

#### B. Gráfico de Ventas (`SalesAreaChart`)
Implementar `getBusinessSalesChart(businessId, period)`:
* `today`: Agrupado por intervalos de 2 horas (`9h`, `11h`, `13h`, `15h`, `17h`, `19h`, `21h`, `23h`).
* `week`: Agrupado por día de la semana (`Lun`, `Mar`, `Mié`, `Jue`, `Vie`, `Sáb`, `Dom`).
* `month`: Agrupado por semana (`Sem 1`, `Sem 2`, `Sem 3`, `Sem 4`).
* Curvas:
  * `Delivery`: Órdenes con `delivery_address IS NOT NULL`.
  * `Take away`: Órdenes para retirar en local / mostrador.
* Retorna labels y valores reales (rellenando con `$0` en los intervalos sin ventas para evitar saltos en el SVG).

#### C. Tabla de Pedidos Recientes
* Query:
  ```ts
  const recentOrders = await supabase
    .from("orders")
    .select("id, customer_name, total_cents, status, created_at, order_items(name, quantity)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(5);
  ```
* Enlace corregido: `<Link href={`/negocio/${businessId}/pedidos`}>`.

#### D. Checklist de Onboarding y Tour
* Reemplazar `MOCK_TUTORIAL_TASKS` por cálculo derivado del estado en base de datos:
  1. `profile`: `Boolean(business.logo_path && business.banner_path)`
  2. `menu`: `productsCount >= 5`
  3. `qr`: `productsCount >= 1`
  4. `promos`: `Boolean(hasActivePromos)` (o false hasta módulo de cupones)
  5. `logistics`: `driversCount >= 1` (miembros con rol `driver`)
* Enlaces del modal `TourModal` corregidos con `${businessId}`:
  * `/negocio/${businessId}/configuracion`
  * `/negocio/${businessId}/carta`
  * `/negocio/${businessId}/equipo`

---

### 4.3. Panel Lateral del Negocio (`StoreSidePanel` & `StoreShowcase.tsx`)

#### Perfil del Comercio
* **Datos mapeados:** `businesses.name`, `tagline`, `logo_path` (Storage), `banner_path` (Storage), `rating`, `reviews_count`, `prep_time_minutes`, `address`.
* **Seguidores:** Conteo dinámico de favoritos (o `0` inicial).
* **Productos:** Conteo total real desde `products`.

#### Acciones Operativas
* **Toggle de Apertura / Cierre:**
  * Server Action `toggleBusinessOpen({ businessId, isOpen })` $\rightarrow$ `UPDATE businesses SET is_open = :isOpen WHERE id = :businessId`.
  * `revalidatePath('/negocio/${businessId}/dashboard')`.
* **Carta Rápida (Stock Rápido):**
  * Mostrar los primeros 6 productos del negocio.
  * Botón de pausa/activación: Server Action `toggleProductAvailability({ productId, businessId })` $\rightarrow$ `UPDATE products SET available = NOT available WHERE id = :productId`.
  * `revalidatePath` instantáneo para feedback visual en tiempo real.

---

### 4.4. Pantalla de Configuración (`src/app/negocio/[businessId]/configuracion/page.tsx`)

#### Horarios de Atención
* Consultar tabla `business_hours` (`business_id = businessId`):
  * Formatear los días operativos (ej. "Lunes a Sábado — 11:30 a 23:30 hs").
  * Badge inteligente: Calcular si el local está abierto comparando la hora actual en zona horaria de Bolívar (`America/Argentina/Buenos_Aires`) con `open_time` y `close_time` del día actual.

#### Dirección y Zona de Cobertura
* Mostrar `businesses.address`, `businesses.city` y radio de entrega.

---

### 4.5. Vista Pública del Local (`src/app/c/[slug]/page.tsx`)

* Reemplazar arrays en memoria `FEATURED_CHAINS` y `TRENDING_ITEMS`:
  * Consulta a `businesses` por `slug` (`published = true`).
  * Consulta a `products` por `business_id` (`available = true`).
* Enlace de retorno dinámico: Volver a `/negocio/${business.id}/dashboard` si `searchParams.from === "negocio"`.

---

## 5. Contratos de Funciones y Queries Optimizadas

### 5.1. `src/lib/business/queries.ts`

```ts
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Memoized user retriever (0ms on repeated calls within request)
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/negocio/login");
  return { supabase, user };
});

// Single-query JOIN for business access verification
export const requireBusinessAccess = cache(async (businessId: string) => {
  const { supabase, user } = await requireUser();
  const isAdmin = user.app_metadata?.role === "admin";

  const { data: membership, error } = await supabase
    .from("business_members")
    .select("id, role, status, businesses(*)")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership && !isAdmin) redirect("/negocio");

  let business = membership?.businesses;
  if (!business && isAdmin) {
    const { data: biz } = await supabase.from("businesses").select("*").eq("id", businessId).single();
    business = biz;
  }
  if (!business) redirect("/negocio");

  return { supabase, user, member: membership, business, isAdmin };
});

// Parallel metrics fetcher for dashboard
export async function getBusinessDashboardData(businessId: string, period: "today" | "week" | "month") {
  const { supabase } = await requireBusinessAccess(businessId);

  const [metricsRes, chartRes, recentOrdersRes, productsCountRes] = await Promise.all([
    getBusinessMetrics(businessId, period),
    getBusinessSalesChart(businessId, period),
    supabase.from("orders").select("id, customer_name, total_cents, status, created_at, order_items(name, quantity)").eq("business_id", businessId).order("created_at", { ascending: false }).limit(5),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", businessId),
  ]);

  return {
    metrics: metricsRes,
    chart: chartRes,
    recentOrders: recentOrdersRes.data ?? [],
    productsCount: productsCountRes.count ?? 0,
  };
}
```

### 5.2. `src/lib/business/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessAccess } from "@/lib/business/queries";

export async function toggleBusinessOpen(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const isOpen = formData.get("isOpen") === "true";
  const { supabase } = await requireBusinessAccess(businessId);

  await supabase.from("businesses").update({ is_open: isOpen }).eq("id", businessId);
  revalidatePath(`/negocio/${businessId}/dashboard`);
  revalidatePath(`/c`);
}

export async function toggleProductAvailability(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  const productId = String(formData.get("productId") || "");
  const { supabase } = await requireBusinessAccess(businessId);

  const { data: product } = await supabase.from("products").select("available").eq("id", productId).single();
  if (product) {
    await supabase.from("products").update({ available: !product.available }).eq("id", productId);
  }
  revalidatePath(`/negocio/${businessId}/dashboard`);
  revalidatePath(`/negocio/${businessId}/carta`);
}
```

---

## 6. Plan de Implementación por Fases

| Fase | Tareas Principales | Archivos Involucrados |
| :--- | :--- | :--- |
| **Fase 1: Capa de Acceso & Caching** | • Implementar `React.cache()` en `requireUser` y `requireBusinessAccess`.<br>• Unificar consulta en JOIN relacional único.<br>• Benchmark de latencia inicial. | `src/lib/business/queries.ts` |
| **Fase 2: Topbar, Sidebar & Shell** | • Conectar `user_profiles` y `businesses.plan`.<br>• Conectar notificaciones reales y Server Action de logout. | `src/components/business/BusinessTopbar.tsx`<br>`src/components/business/BusinessSidebar.tsx` |
| **Fase 3: Dashboard KPIs & Gráficos** | • Implementar consultas agregadas sobre `orders` para hoy/semana/mes.<br>• Implementar `SalesAreaChart` real.<br>• Conectar pedidos recientes y checklist reactivo. | `src/lib/business/queries.ts`<br>`src/app/negocio/[businessId]/dashboard/page.tsx` |
| **Fase 4: Panel Lateral & Acciones** | • Mapear `StoreSidePanel` a datos reales.<br>• Conectar Server Actions de apertura (`is_open`) y stock rápido (`available`).<br>• Corregir enlaces de navegación. | `src/components/StoreShowcase.tsx`<br>`src/lib/business/actions.ts` |
| **Fase 5: Configuración & Hub Público** | • Conectar horarios desde `business_hours`.<br>• Conectar `/c/[slug]` a `businesses` y `products` de Supabase. | `src/app/negocio/[businessId]/configuracion/page.tsx`<br>`src/app/c/[slug]/page.tsx` |
| **Fase 6: Verificación & Limpieza** | • Verificar tiempos de respuesta (`application-code < 100ms`).<br>• Pruebas unitarias y de integración.<br>• Deprecar mocks obsoletos de `mockData.ts`. | Todo el módulo |

---

## 7. Criterios de Aceptación y Pruebas

1. **Rendimiento:** El tiempo de servidor `application-code` en solicitudes subsiguientes de `/negocio/[id]/dashboard`, `/carta` y `/pedidos` debe ser **inferior a 100 ms**.
2. **Cero Mocks:** No debe quedar ninguna referencia activa a `MOCK_BUSINESS`, `MOCK_BUSINESS_STATS`, `MOCK_RECENT_ORDERS` o `MOCK_PRODUCTS` en el módulo de negocio.
3. **Persistencia:** Al alternar el switch de Abierto/Cerrado o pausar un producto en la carta rápida, el cambio debe persistir en Supabase y reflejarse inmediatamente al recargar la página.
4. **Navegación Intacta:** Ningún enlace del tour, panel lateral o pedidos debe arrojar error 404 ni omitir el `businessId`.
