# Hitos — BolivarPide (roadmap operativo)

> Documentación de hitos acordados (2026-09). Cada hito tiene su propio doc con
> objetivo, alcance, decisiones preliminares y tareas. Estado inicial: **propuesto**.

## Índice

| # | Hito | Por qué | Tamaño | Estado |
|---|------|---------|--------|--------|
| [01](./01-conectar-repartidor-operacion.md) | Conectar el repartidor aprobado con la operación | El onboarding (feature 08) no tiene correlato operativo: `delivery_profiles` aprobados no son contratables | S | ⚠️ Código hecho, bloqueado |
| [02](./02-gps-repartidor-tracking.md) | GPS real del repartidor → tracking en vivo del cliente | El mapa del cliente anima un repartidor simulado (`demoRouteProgress`) | L | ⚠️ Código hecho, falta QA |
| [03](./03-ci-y-tests.md) | CI + hygiene de tests | Sin CI ni framework de tests; los 35 `*.check.ts` corren solo local | M | ✅ Hecho |
| [04](./04-metricas-repartidor.md) | Métricas por repartidor en el dashboard | `delivery_driver_id` + timestamps ya existen pero no hay reporte | S | 🔲 Desactivado |

> **Revisión 2026-09-05** (ver [`../estado-beta-publica.md`](../estado-beta-publica.md)):
> tres de los cuatro estados de esta tabla estaban mal.
>
> - **Hito 01** — el código está completo, pero el flujo está muerto aguas arriba: no existe
>   UI en `/admin` para aprobar una postulación de repartidor. `approveDriverProfileAction` y
>   `rejectDriverProfileAction` (`src/lib/delivery/profileActions.ts:226-332`) no tienen ni un
>   importador. Sin esa pantalla, `listActiveDrivers` está siempre vacío y no hay nadie a quien
>   contratar.
> - **Hito 02** — el camino GPS completo funciona (`useDriverLocation` → `delivery_locations` →
>   realtime al cliente). Queda el QA en dos dispositivos y una decisión de producto: hoy, sin
>   GPS fresco, el cliente ve la animación `demoRouteProgress` como fallback por defecto.
> - **Hito 04** — figuraba ✅ Hecho y **no lo está**. El data layer nunca se cableó, y al
>   arreglar los errores de typecheck la prop `driversMetrics` pasó a opcional con default
>   `[]`: la sección compila y renderiza siempre el empty state. La feature está desactivada,
>   no terminada. Ver el detalle en el propio doc del hito.

## Orden sugerido de ejecución

1. ⚠️ **Hito 01** — desbloquear con la UI admin de KYC (8h, la tarea de mayor palanca del proyecto).
2. ✅ **Hito 03** (chaleco anti-regresión antes de más features).
3. 🔲 **Hito 04** — cerrar el data layer que falta (4h).
4. ⚠️ **Hito 02** — QA en dos dispositivos + decidir el fallback del mapa.

## Convenciones

- Cada hito usa el mismo patrón del repo: decisiones con tradeoffs explícitos,
  tareas por fases y checklist que se marca al implementar.
- Cuando un hito entra en implementación, se abre su `docs/features/<N>-...`
  con specs sdd/tdd (como features 07 y 08).