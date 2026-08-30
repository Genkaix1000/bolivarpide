# TDD 03 — Plan de pruebas

Archivos de check runnable (patrón ponytail, sin framework):

| Archivo | Cubre |
|---------|-------|
| `src/lib/orders/lifecycle.check.ts` | Transiciones, stepper, tiempos |
| `src/lib/orders/deliveryPin.check.ts` | Generación, hash, verify |
| `src/lib/mercadopago/refund.check.ts` | Mock refund por canal |

Ejecutar: `npx tsx src/lib/orders/lifecycle.check.ts`

---

## Matriz — máquina de estados

### Transiciones forward (`advanceOrderStatus`)

| Desde | Hacia | Esperado | Notas |
|-------|-------|----------|-------|
| `pending` | `preparing` | ✓ | set `accepted_at` |
| `pending` | `delivering` | ✗ | skip prohibido |
| `preparing` | `delivering` | ✓ | genera PIN |
| `delivering` | `delivered` | ✓ con PIN | sin PIN → error |
| `delivering` | `delivered` | ✗ PIN wrong | increment `pin_attempts` |
| `delivered` | * | ✗ | terminal |
| `pending` | `rejected` | ✓ + motivo | refund si MP |
| `preparing` | `rejected` | ✓ + motivo | |
| `delivering` | `rejected` | ✓ + motivo | |
| `pending` | `rejected` | ✗ sin motivo | min 10 chars |
| `rejected` | * | ✗ | terminal |

### Transiciones backward (`revertOrderStatus`)

| Desde | Hacia | Esperado |
|-------|-------|----------|
| `preparing` | `pending` | ✓ |
| `delivering` | `preparing` | ✓, PIN conservado |
| `delivering` | `pending` | ✗ | solo un paso |
| `delivered` | * | ✗ |
| `driver` role revert | * | ✗ |

---

## Matriz — alertas comercio

| Condición | Chime | Banner |
|-----------|-------|--------|
| INSERT pending + paid | ✓ | ✓ |
| INSERT pending + awaiting_payment | ✗ | ✗ |
| INSERT pending + cash | ✓ | ✓ |
| UPDATE preparing | ✗ | dismiss banner ese order |
| Usuario sin gesture previo (iOS) | silent | ✓ (banner sí) |

---

## Matriz — refund Mercado Pago (mock)

```typescript
// refund.check.ts — mock mpFetch
```

| Escenario | payment_method | mp_payment_id | Resultado |
|-----------|---------------|---------------|-----------|
| QR pagado | mercadopago_qr | set | refund OK → `refunded` |
| Checkout Pro pagado | mercadopago_fast | set | refund OK |
| Efectivo | cash | null | skip refund |
| MP 404 | mercadopago_qr | bad id | `refund_pending = true` |
| MP timeout | mercadopago_qr | set | retryable error |
| Doble reject | any | set | idempotente, no doble refund |

---

## Matriz — PIN entrega

| Caso | Esperado |
|------|----------|
| generateDeliveryPin() | 4 chars, 1000–9999 |
| hash ≠ plaintext en DB | ✓ |
| verify correcto | true |
| verify incorrecto | false, attempts++ |
| 5 fallos | `pin_locked_until` +15 min |
| delivered | hash nullified |

---

## Matriz — UI componentes (smoke / snapshot manual)

### KitchenTicketCard

| Estado | Render |
|--------|--------|
| pending | Pulso borde, talón "A cocina" |
| preparing | Talón "A reparto" |
| delivering | Talón "Entregado" + PinConfirmInput |
| rejected | Motivo visible, sin talón activo |
| 3+ ítems con notas | Scroll interno cuerpo |

### OrderStepper

| status | Pasos activos (0-index) |
|--------|-------------------------|
| pending | [0] |
| preparing | [0,1] |
| delivering | [0,1,2] |
| delivered | [0,1,2,3] |
| rejected | Mensaje error, stepper hidden |

### OrderTrackingSheet

| status | PIN visible | ETA visible |
|--------|-------------|-------------|
| pending | ✗ | ✓ |
| preparing | ✗ | ✓ |
| delivering | ✓ | ✓ |
| delivered | ✗ | ✗ |
| rejected | ✗ | ✗ |

---

## Matriz — Realtime

| Evento | ComanderaBoard | Topbar | Cliente tracking |
|--------|----------------|--------|------------------|
| status → preparing | re-fetch | — | stepper → 1 |
| status → delivering | re-fetch | — | stepper → 2, fetch PIN |
| status → delivered | remove highlight | — | stepper → 3 |
| status → rejected | grey out | — | error state |

---

## Casos E2E manuales (checklist QA)

### Happy path MP QR

1. Cliente checkout QR → paga → webhook `paid`
2. Comercio: chime + banner
3. Comandera: ticket pending visible
4. "A cocina" → preparing
5. Cliente: stepper en cocina
6. "A reparto" → delivering, cliente ve PIN
7. Operador ingresa PIN → delivered
8. Cliente: stepper completo

### Rechazo con refund

1. Pedido paid en preparing
2. Rechazar → motivo "Sin stock"
3. Verificar `payment_status = refunded` (sandbox MP)
4. Cliente ve motivo en tracking

### Cancel pre-operativo (regresión)

1. Cliente checkout QR, no paga
2. Cancela desde pending payment
3. `status = cancelled`, **no** alerta comercio
4. **No** confundir con `rejected`

---

## Cobertura mínima v1

| Área | Tests auto | QA manual |
|------|------------|-----------|
| Transiciones | ✓ lifecycle.check | ✓ |
| PIN | ✓ deliveryPin.check | ✓ |
| Refund | ✓ refund.check (mock) | ✓ sandbox MP |
| Chime | — | ✓ browser |
| Ticket UI | — | ✓ visual |
| Stepper UI | — | ✓ visual |
