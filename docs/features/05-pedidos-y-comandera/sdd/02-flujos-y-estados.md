# SDD 02 — Flujos y estados

## Máquina de estados operativos

Estados finales del ciclo de vida **operativo** (post-pago). Separados de `payment_status`.

```
                    ┌─────────────┐
                    │   pending   │  PENDIENTE
                    └──────┬──────┘
                           │ aceptar
                           ▼
                    ┌─────────────┐
              ┌────▶│  preparing  │  EN COCINA
              │     └──────┬──────┘
              │            │ listo para salir
              │            ▼
              │     ┌─────────────┐
              │     │ delivering  │  EN REPARTO  (+ PIN generado)
              │     └──────┬──────┘
              │            │ PIN válido
              │            ▼
              │     ┌─────────────┐
              │     │  delivered  │  ENTREGADO (terminal)
              │     └─────────────┘
              │
              │ rechazar (desde pending | preparing | delivering)
              ▼
       ┌─────────────┐
       │  rejected   │  RECHAZADO (terminal) + motivo + refund?
       └─────────────┘
```

### Mapping desde schema actual

| Nuevo | Valor DB | Notas |
|-------|----------|-------|
| PENDIENTE | `pending` | Solo operativo si pagado/efectivo |
| EN COCINA | `preparing` | Elimina `accepted` y `ready` del flujo UI |
| EN REPARTO | `delivering` | **Nueva** — requiere migración CHECK |
| ENTREGADO | `delivered` | Sin cambio |
| RECHAZADO | `rejected` | **Nueva** — reemplaza `cancelled` operativo |

**Deprecados en UI (mantener en DB por compat):** `accepted`, `ready`, `cancelled`.

- `cancelled` queda para cancelación **pre-operativa** (cliente aborta checkout, ver `cancelPendingCustomerOrder`).
- `rejected` es decisión del **comercio** post-aceptación implícita.

---

## Transiciones permitidas

```typescript
const FORWARD: Record<Status, Status | null> = {
  pending:    'preparing',
  preparing:  'delivering',
  delivering: 'delivered',  // requiere PIN
  delivered:  null,
  rejected:   null,
};

const BACKWARD: Record<Status, Status | null> = {
  pending:    null,
  preparing:  'pending',     // "volvió a cola" — raro pero permitido
  delivering: 'preparing',   // "volvió a cocina"
  delivered:  null,          // irreversible
  rejected:   null,          // irreversible
};
```

### Side effects por transición

| Transición | Side effects |
|------------|--------------|
| → `preparing` | `accepted_at = now()`, detener alerta banner |
| → `delivering` | `dispatched_at = now()`, generar `delivery_pin_hash` |
| → `delivered` | `delivered_at = now()`, validar PIN, invalidar PIN |
| → `rejected` | `rejected_at = now()`, guardar `rejection_reason`, refund MP si aplica |
| ← backward | Limpiar timestamp de la etapa abandonada; **no** regenerar PIN al volver de `delivering` |

---

## Flujo de pago → operativo

```
Cliente checkout
    │
    ├─ MP QR / Checkout Pro ──webhook──▶ payment_status = paid
    ├─ Efectivo ────────────────────────▶ payment_status = paid (al confirmar)
    │
    ▼
status = pending  ──▶  ALERTA comercio (chime + banner)
```

**Regla:** la comandera solo lista pedidos con `payment_status = 'paid'` OR (`payment_method = 'cash'` AND status != cancelled pre-op).

---

## Flujo de rechazo y reembolso

```
Operador → modal motivo → advanceOrderStatus('rejected')
    │
    ├─ payment_method = cash ──▶ solo DB update
    │
    └─ payment_method ∈ MP ──▶ refundMercadoPagoOrder()
              │
              ├─ OK ──▶ payment_status = refunded
              └─ FAIL ──▶ refund_pending = true, log error
```

**Canales MP:**

| Canal | API refund |
|-------|------------|
| `mercadopago_qr` | `POST /v1/payments/{id}/refunds` |
| `mercadopago_fast` (Checkout Pro) | mismo endpoint con `mp_payment_id` |

---

## Flujo PIN entrega vs Retiro en Local

### A. Pedidos con Envío a Domicilio (Delivery)
```
preparing → delivering
    │
    ├─ pin = random 4 digits (1000–9999, no 0000)
    ├─ delivery_pin_hash = bcrypt(pin)
    └─ cliente ve PIN en OrderTrackingSheet

delivering → delivered
    │
    ├─ operador ingresa PIN en talón
    ├─ verifyPin(input, delivery_pin_hash)
    ├─ OK → delivered
    └─ FAIL → increment pin_attempts; block at 5
```

### B. Pedidos con Retiro en Local (Takeaway / Pickup)
```
preparing → delivered (o ready_for_pickup)
    │
    ├─ NO requiere PIN (no existe repartidor)
    ├─ El ticket muestra la insignia destacada: 🏪 RETIRO EN LOCAL
    ├─ El cliente se acerca al mostrador con su nombre / número de pedido
    └─ El comercio presiona el botón directo "Entregar Pedido" ➔ pasa a delivered
```

---

## Cálculo de tiempos de respuesta

Timestamps en `orders`:

| Columna | Seteada en |
|---------|------------|
| `created_at` | insert checkout |
| `paid_at` | webhook MP / confirm cash |
| `accepted_at` | → preparing |
| `dispatched_at` | → delivering |
| `delivered_at` | → delivered |
| `rejected_at` | → rejected |

**Métricas derivadas (dashboard, fase 5):**

| Métrica | Cálculo |
|---------|---------|
| Tiempo a cocina | `accepted_at - paid_at` |
| Tiempo en cocina | `dispatched_at - accepted_at` |
| Tiempo en reparto | `delivered_at - dispatched_at` |
| Tiempo total | `delivered_at - paid_at` |

---

## Realtime — eventos suscritos

| Suscriptor | Tabla | Filtro | Reacción |
|------------|-------|--------|----------|
| `BusinessTopbar` | `orders` | `business_id` | Nuevo `pending` pagado → chime + banner |
| `ComanderaBoard` | `orders` | `business_id` | Refresh tickets |
| `OrderTrackingPage` | `orders` | `id = orderId` | Actualizar stepper |

---

## Permisos por rol

| Acción | owner | staff | driver |
|--------|-------|-------|--------|
| Ver comandera | ✓ | ✓ | ✓ |
| Avanzar estados | ✓ | ✓ | ✓ |
| Rechazar | ✓ | ✓ | ✗ |
| Revertir estado | ✓ | ✓ | ✗ |
| Validar PIN | ✓ | ✓ | ✓ |

Implementar en `requireBusinessAccess` + check de `business_members.role`.
