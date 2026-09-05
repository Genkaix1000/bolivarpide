# 07 — Panel de Reparto (Deliverys)

> Ciclo operativo del repartidor: asignación en el despacho → consola de envíos → toma de pedidos libres → confirmación por PIN.

## Resumen de la fase

El rol `driver` ya existe en `business_members` (owner|staff|driver), es invitable desde Equipo y el RPC `transition_order_status` ya lo distingue, pero **no hay ninguna superficie donde el repartidor opere**. Esta fase crea el panel desde cero, integrado al panel de negocio.

| Cara | Qué cambia |
|------|------------|
| **Comercio (owner/staff)** | Vista de gestión de reparto: cola de envíos, asignar/reasignar/quitar repartidor al despachar, estado de cada repartidor |
| **Repartidor** | Consola con "Mis envíos", "Disponibles" (para tomar), "Por salir" y "Historial"; confirma entrega con PIN |
| **Backend** | Asignación opcional `orders.delivery_driver_id`, push al repartidor asignado, claim race-safe |
| **Datos** | Migración de 2 columnas + índice. Sin tocar la máquina de estados ni el RPC |

### Estado actual vs objetivo

| Hoy | Objetivo |
|-----|----------|
| El rol `driver` solo está en DB y en el listado de Equipo | Consola de reparto real para el repartidor |
| Un `delivering` no tiene dueño: "cualquier miembro" aparece como repartidor | `delivery_driver_id` opcional + toma de pedidos libres |
| Sidebar igual para todos los roles | Sidebar filtrada: el driver ve solo Reparto (sin Configuración) |
| Nadie se entera de que hay un pedido por entregar salvo mirando el panel | Web Push al repartidor al asignarle un pedido |
| El operador confirma el PIN "a nombre de" quién lleva el pedido | El repartidor real lo confirma desde su consola |

## Referencias visuales

### Repartidor — Consola de envíos

```
┌─────────────────────────────────────────────────────────────┐
│ ← Volver · Bolivar Burger · #1043                      ⏱ 6 min │
├─────────────────────────────────────────────────────────────┤
│  [En camino (2)]   [Disponibles (1)]   [Historial]          │
├─────────────────────────────────────────────────────────────┤
│  #1043 · Oliva 1234, San Carlos de Bolívar                  │
│  2× Milanesa napolitana · 1× Coca 1.5L  (sin hielo)         │
│  Valentina Paz · 📞 11 5555 0132 · 💬 WhatsApp               │
│  💵 Efectivo · Total $9.800                                  │
│  [🗺 Abrir ruta]                        [Entregado → PIN]    │
├─────────────────────────────────────────────────────────────┤
│  #1048 · Av. Mitre 986  (sin dueño)                         │
│  Elisa Gómez · 💬 WhatsApp   [🛵 Tomar pedido]               │
└─────────────────────────────────────────────────────────────┘
```

**Layout:** una lista columna única, alta densidad, pensada para celu en mano. Cada tarjeta = datos del envío + accionable claro (PIN para los propios, "Tomar pedido" para los libres).

### Comercio — Gestión de reparto (owner/staff)

```
┌─────────────────────────────────────────────────────────────┐
│  Reparto · Bolivar Burger                                    │
├─────────────────────────────────────────────────────────────┤
│  En cocina (2)                                               │
│  #1042  [Asignar repartidor ▾]  (pre-asignación opcional)    │
│  #1043  [Asignar repartidor ▾]                               │
│                                                              │
│  En reparto (3)                                              │
│  #1044 · 🛵 Joaquín      [Reasignar ▾]  [Quitar]             │
│  #1045 · sin asignar     [Asignar ▾]                         │
│                                                              │
│  Repartidores (2 activos)                                    │
│  🛵 Joaquín — 1 en ruta · 🛵 Lucía — 2 en ruta               │
└─────────────────────────────────────────────────────────────┘
```

## Arquitectura general

```
Comandera (preparing)
    │  "A reparto" + elegir repartidor (opcional)
    ▼
orders.status = delivering        ──realtime──▶  DispatchView (owner/staff)
orders.delivery_driver_id = ?                     │
    │                                              ▼
    ▼                                    DriverBoard (repartidor)
assignOrderToDriver (owner/staff)        En camino + Disponibles + Por salir
claimDeliveryOrder (driver, race-safe)   │
    │                                      ▼
    └────────── advanceOrderStatus({PIN}) ◀── PinConfirmInput
                                              │
                                              ▼
                                    delivered (RPC transition_order_status)
```

La **asignación es ortogonal al estado**: se lee/escribe por server action con `service_role` (el UPDATE directo de `orders` está revocado a `authenticated`), mientras que las transiciones de estado siguen pasando por `transition_order_status` (SECURITY DEFINER).

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [sdd/01-historias-de-usuario.md](./sdd/01-historias-de-usuario.md) | HU repartidor + comercio + criterios de aceptación UI |
| [sdd/02-flujos-y-estados.md](./sdd/02-flujos-y-estados.md) | Estados de asignación, claim, matriz de permisos por rol |
| [tdd/01-arquitectura-y-contratos.md](./tdd/01-arquitectura-y-contratos.md) | Tipos TS, server actions, consultas, componentes |
| [tdd/02-base-de-datos-y-realtime.md](./tdd/02-base-de-datos-y-realtime.md) | Migración SQL, índices, Realtime, RLS |
| [tdd/03-plan-de-pruebas.md](./tdd/03-plan-de-pruebas.md) | Matriz unitaria + casos E2E |

## Checklist de implementación

### Fase 1 — Fundación
- [x] Migración SQL (2 columnas + índice) aplicada con `supabase db push`
- [x] `src/lib/delivery/types.ts`
- [x] `src/lib/delivery/queries.ts` + helpers puros
- [x] `delivery.check.ts` (patrón ponytail)

### Fase 2 — Acciones y notificaciones
- [x] `src/lib/delivery/actions.ts` (`assignOrderToDriver`, `unassignOrder`, `claimDeliveryOrder`)
- [x] Push al repartidor asignado (insert `notifications` con `user_id`)

### Fase 3 — Gestión (owner/staff)
- [x] `DispatchView.tsx` (cola + asignar)
- [x] Ruta `/negocio/[businessId]/reparto/page.tsx` (switch por rol)
- [x] Sidebar role-gated (item Reparto; driver ve solo lo suyo) + `role` en `BusinessShellData`

### Fase 4 — Consola del repartidor
- [x] `DriverBoard.tsx` (tabs + Realtime + polling)
- [x] `DeliveryOrderCard.tsx` (dirección, teléfono/WhatsApp, ítems, PIN, Google Maps)
- [x] Confirmación entregada con `advanceOrderStatus` + `PinConfirmInput`

### Fase 5 — Verificación
- [ ] `pnpm test` + `pnpm exec tsc --noEmit` + `pnpm lint`
- [ ] QA manual E2E (invitar driver → despachar → tomar → PIN → delivered)

## Fuera de alcance (v1)

- GPS real del repartidor (hoy el tracking del cliente simula la posición)
- Mapa embebido en la consola (v1: deep link a Google Maps)
- Agente libre multi-negocio (legacy `business_delivery_agents`, no aplica)
- Cobro de efectivo en mano (el cash ya se marca `paid` al pasar a `preparing`)
- Métricas de repartidor (entregas, tiempos, rating)