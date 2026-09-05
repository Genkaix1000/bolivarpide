# Hitos — BolivarPide (roadmap operativo)

> Documentación de hitos acordados (2026-09). Cada hito tiene su propio doc con
> objetivo, alcance, decisiones preliminares y tareas. Estado inicial: **propuesto**.

## Índice

| # | Hito | Por qué | Tamaño | Estado |
|---|------|---------|--------|--------|
| [01](./01-conectar-repartidor-operacion.md) | Conectar el repartidor aprobado con la operación | El onboarding (feature 08) no tiene correlato operativo: `delivery_profiles` aprobados no son contratables | S | Propuesto |
| [02](./02-gps-repartidor-tracking.md) | GPS real del repartidor → tracking en vivo del cliente | El mapa del cliente anima un repartidor simulado (`demoRouteProgress`) | L | Propuesto |
| [03](./03-ci-y-tests.md) | CI + hygiene de tests | Sin CI ni framework de tests; los 35 `*.check.ts` corren solo local | M | Propuesto |
| [04](./04-metricas-repartidor.md) | Métricas por repartidor en el dashboard | `delivery_driver_id` + timestamps ya existen pero no hay reporte | S | Propuesto |

## Orden sugerido de ejecución

1. **Hito 01** (valor inmediato, reutiliza lo recién hecho).
2. **Hito 03** en paralelo (chaleco anti-regresión antes de más features).
3. **Hito 04** (chico, data que ya está en la DB).
4. **Hito 02** como proyecto grande próximo (mayor inversión, define la experiencia).

## Convenciones

- Cada hito usa el mismo patrón del repo: decisiones con tradeoffs explícitos,
  tareas por fases y checklist que se marca al implementar.
- Cuando un hito entra en implementación, se abre su `docs/features/<N>-...`
  con specs sdd/tdd (como features 07 y 08).