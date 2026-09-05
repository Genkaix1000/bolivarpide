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

## Tareas

- [ ] Helpers puros `aggregateDrivers` / `avgMinutes` en `src/lib/business/dashboard.ts` + `dashboard.check.ts`.
- [ ] `getBusinessDashboardData`: query de entregas por `delivery_driver_id` en el período.
- [ ] `DashboardView.tsx`: `DriverMetricsCard` (tabla + empty state).
- [ ] Verificación: `pnpm test` + `tsc --noEmit` + `lint` + QA visual.

## Referencias

- `src/lib/business/dashboard.ts` → `computeMetrics`, `periodStart`, `DashboardPeriod`
- `src/lib/business/queries.ts` → `getBusinessDashboardData`
- `src/components/business/DashboardView.tsx` · `StatCard.tsx`
- `src/lib/delivery/queries.ts` → `ActiveDriver`