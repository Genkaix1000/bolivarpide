# Hito 04 — Métricas por repartidor en el dashboard

## Objetivo

Que el dueño/a del negocio vea en el Dashboard la **operación de reparto** por repartidor:
entregas, tiempos y carga actual — sin abrir la vista de Reparto.

## Problema

Desde la Fase del panel de reparto la DB ya tiene `orders.delivery_driver_id`,
`dispatched_at` y `delivered_at`, y `listDispatchQueue` devuelve el contador "en ruta".
Pero `getBusinessDashboardData` (`src/lib/business/queries.ts`) no agrega nada por
repartidor: la información existe y no se reporta.

## KPIs propuestos (v1)

Por repartidor y período (reusar `DashboardPeriod` de `src/lib/business/dashboard.ts`):

| KPI | Fuente |
|-----|--------|
| **En ruta ahora** | `orders.status='delivering' AND delivery_driver_id = driver` |
| **Entregas** (entregados en el período) | `status='delivered'` (count) |
| **Promedio dispatch → delivered** (min) | `avg(extract(epoch from (delivered_at - dispatched_at)))/60` |
| **Tiempo medio de cocina** del negocio (contexto, ya existe) | `prep_time_minutes` |

Base: repartidores activos (`business_members role='driver' status='active'`).

## Alcance

**In v1**
- Extender `getBusinessDashboardData` con `driversMetrics` (agregación server con service/user client).
- Helpers puros de agregación en `dashboard.ts` (`aggregateDrivers`, `avgMinutes`) + `dashboard.check.ts`.
- Componente `DriverMetricsCard` en `DashboardView.tsx` (tabla compacta: repartidor · en ruta ·
  entregas · promedio min).
- Empty state: "Sin repartidores activos — invitalos desde Equipo".

**Out (v2 posibles)**
- Gráfico de entregas por repartidor en el tiempo.
- Costo/comisión por repartidor (requiere facturación).
- Distribución de carga (alerta si un driver tiene muchos en ruta).

## Decisiones a resolver

| Decisión | Opciones | Recomendación |
|----------|----------|---------------|
| Qué cuenta como "entregado del período" | `delivered_at >= start` vs `created_at >= start` | `delivered_at` (mide cierre de reparto en el período) |
| Cómputo en panel vs SQL agregado | JS client + 2 selects vs SQL `count()/avg()` | SQL agregado con una query por driver (dataset chico) |
| Incluir drivers que no tuvieron entregas | sí (entregas 0) vs solo con actividad | incluir los activos siempre (carga visible) |

## Estado real (revisión 2026-09-05)

> Este hito estaba marcado ✅ Hecho. **No lo está: la feature está desactivada.**
>
> Los helpers puros y la UI existen, pero **el data layer del medio nunca se escribió**.
> `getBusinessDashboardData` (`src/lib/business/queries.ts:261-269`) no devuelve
> `driversMetrics`. Eso produjo dos errores de typecheck que se resolvieron **silenciando el
> síntoma**: se quitó la prop en `dashboard/page.tsx:33` y en `DashboardView.tsx` la prop pasó
> a `driversMetrics?` con default `[]`. Resultado: compila, y la sección "Reparto" del
> dashboard renderiza siempre el empty state.
>
> Falta (≈4h): la query de `orders` filtrando `delivery_driver_id/status/dispatched_at/delivered_at`
> en el período, el merge con `listActiveDrivers` para nombres e iniciales, y volver a pasar la
> prop desde la página. La lógica de agregación ya está probada, así que es cableado, no diseño.

## Tareas

- [x] Helpers puros `aggregateDriverMetrics` / `avgDeliveryMinutes` en `src/lib/business/dashboard.ts`
      + `dashboard.check.ts` (promedios, filtros por driver, ordenamiento).
- [ ] `getBusinessDashboardData`: query adicional de `delivery_driver_id/status/dispatched_at/delivered_at`
      en el período + merge con `listActiveDrivers` (nombres/iniciales) → `driversMetrics`.
- [x] `DashboardView.tsx`: sección "Reparto" (tabla compacta Repartidor · En ruta · Entregados ·
      Prom. min + empty state con CTA a Reparto).
- [ ] Volver a pasar `driversMetrics` desde `dashboard/page.tsx` y sacarle el default `[]`.
- [ ] Verificación: `pnpm test` (42/42) + `tsc --noEmit` + `lint` **sin errores** + CI en verde.

## Referencias

- `src/lib/business/dashboard.ts` → `computeMetrics`, `periodStart`, `DashboardPeriod`
- `src/lib/business/queries.ts` → `getBusinessDashboardData`
- `src/components/business/DashboardView.tsx` · `StatCard.tsx`
- `src/lib/delivery/queries.ts` → `ActiveDriver`