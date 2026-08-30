# 05 — Pedidos y Comandera

> Ciclo operativo completo: alerta en cocina → ticket troquelado → reparto → confirmación por PIN → seguimiento cliente.

## Resumen de la fase

Reemplazar el tablero plano actual (`OrdersBoard` + botones libres de estado) por un **sistema operativo de pedidos** con:

| Cara | Qué cambia |
|------|------------|
| **Comercio** | Comandera con tickets tipo comanda real + campanilla en Topbar |
| **Cliente** | Pantalla de seguimiento con stepper (inspiración delivery apps) |
| **Backend** | Máquina de estados estricta, métricas de tiempo, rechazo con refund MP |
| **Datos** | Migración de estados, PIN, motivo de rechazo, timestamps por etapa |

### Estado actual vs objetivo

| Hoy | Objetivo |
|-----|----------|
| `setOrderStatus` permite saltar a cualquier estado | Transiciones validadas + reversión controlada |
| Lista plana con botones `accepted/preparing/ready/...` | Tickets horizontales troquelados con talón de acción |
| Beep inline solo en `/pedidos` | Campanilla global en `BusinessTopbar` + comandera |
| Sin vista de seguimiento post-checkout | `/pedido/[orderId]` con stepper en bottom sheet |
| `cancelled` genérico | `rejected` con motivo obligatorio + refund automático MP |
| `delivering` solo en mocks UI | Estado real en DB + PIN de entrega |

## Referencias visuales

### Comandera — Ticket troquelado (comercio)

Inspiración: ticket físico con bordes rayados, perforación lateral y código prominente.

```
┌─ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ─┐
│  #1043 · 18:52                          ⏱ 4 min   │
│  Valentina Paz · Delivery                           │
├─ ◠ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ◡ ─┤
│  2× Milanesa napolitana          $4.800             │
│  1× Coca 1.5L                    $1.200             │
│     ↳ sin hielo                                     │
│  ─────────────────────────────────                  │
│  Total $9.800 · Mercado Pago ✓                      │
└─ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ─┘
                                              ┌──────┐
                                              │ 🍳   │  ← talón de acción
                                              │Cocina│     (CTA según estado)
                                              └──────┘
```

**Layout:** scroll horizontal de tickets. Cada ticket = cuerpo (datos) + talón lateral (acción principal). Perforación visual con `mask`/`clip-path` en el borde entre cuerpo y talón.

### Cliente — Seguimiento (bottom sheet)

Inspiración: mapa de fondo + tarjeta inferior oscura con stepper de íconos.

```
┌─────────────────────────────────────┐
│  ←  [mapa / header del negocio]     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  Llega aprox. 19:15                 │
│  Tu pedido ya está en camino        │
│                                     │
│  🧾 ─── 🍳 ─── 🚴 ─── ✓            │
│  Pedido  Cocina  Camino  Entregado  │
│                                     │
│  PIN de entrega: 4 8 2 9            │  ← visible solo en `delivering`
│                                     │
│  [Negocio]  Bolivar Burger          │
│  📞 Llamar   💬 WhatsApp            │
└─────────────────────────────────────┘
```

**Paleta cliente:** fondo oscuro (`#121212` / `#1c1917`), acento marca `#9a0002` (cherry) para pasos activos — no copiar el verde lima de la referencia.

## Arquitectura general

```
Checkout (existente)
    │
    ▼ payment_status = paid │ cash confirmado
orders.status = pending  ──realtime──▶  BusinessTopbar (banner + chime)
    │                                        │
    │                                        ▼
    │                                  Comandera (tickets)
    │                                        │
    ├──────── advanceOrderStatus ────────────┤
    │                                        │
    ▼                                        ▼
Cliente /pedido/[id]  ◀──realtime──  Server Actions + refund MP
```

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [sdd/01-historias-de-usuario.md](./sdd/01-historias-de-usuario.md) | HU comercio + cliente + criterios de aceptación UI |
| [sdd/02-flujos-y-estados.md](./sdd/02-flujos-y-estados.md) | Máquina de estados, reversión, tiempos |
| [tdd/01-arquitectura-y-contratos.md](./tdd/01-arquitectura-y-contratos.md) | Tipos TS, server actions, `orderChime.ts`, componentes |
| [tdd/02-base-de-datos-y-realtime.md](./tdd/02-base-de-datos-y-realtime.md) | Migración SQL, Realtime, RLS |
| [tdd/03-plan-de-pruebas.md](./tdd/03-plan-de-pruebas.md) | Matriz unitaria |

## Checklist de implementación

### Fase 1 — Fundación
- [x] Migración SQL (estados, columnas, Realtime)
- [x] Tipos `KitchenOrderTicket`, `OrderLifecycleStatus`
- [x] `advanceOrderStatus` con máquina de estados
- [x] Tests de transiciones

### Fase 2 — Comercio
- [x] `orderChime.ts` + hook `useOrderAlerts`
- [x] Banner flotante en `BusinessTopbar`
- [x] `KitchenTicketCard` (ticket troquelado)
- [x] `ComanderaBoard` (scroll horizontal, reemplaza `OrdersBoard`)
- [x] Modal rechazo con motivo obligatorio

### Fase 3 — Cliente
- [x] Ruta `/pedido/[orderId]`
- [x] `OrderTrackingSheet` (bottom sheet + stepper)
- [x] PIN visible en etapa `delivering`
- [x] Realtime suscripción cliente

### Fase 4 — Pagos
- [x] `refundMercadoPagoOrder` al rechazar pedido pagado
- [x] Idempotencia + fallback si MP falla
- [x] Tests con mocks MP

### Fase 5 — Métricas
- [ ] Timestamps por transición en dashboard
- [ ] Contadores de tiempo de respuesta

## Fuera de alcance (v1)

- Mapa con GPS en vivo del repartidor (solo header estático o placeholder)
- Push notifications nativas (Web Push en fase posterior)
- Impresión térmica de comandas
