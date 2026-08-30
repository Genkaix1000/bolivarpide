# SDD 01 — Historias de usuario

## Comercio

### HU-C01 — Alerta de pedido nuevo

**Como** operador del local  
**Quiero** escuchar una campanilla y ver un banner en el Topbar cuando entra un pedido pagado  
**Para** no perder pedidos aunque no esté en la pantalla de comandera

**Criterios de aceptación**

- La alerta dispara solo cuando:
  - `status = pending` **y**
  - `payment_status IN ('paid')` **o** `payment_method = 'cash'`
- No alerta por pedidos en `awaiting_payment` (QR abandonado).
- Campanilla via Web Audio API (`orderChime.ts`), reutilizable.
- Banner flotante debajo del Topbar: número de pedido, cliente, total, CTA "Ver comandera".
- Banner persiste hasta que el operador lo descarta o avanza el pedido.
- Si hay múltiples pedidos nuevos, el banner agrupa: "3 pedidos nuevos".
- Funciona en cualquier ruta del panel (`/negocio/[id]/*`), no solo `/pedidos`.

---

### HU-C02 — Comandera con tickets troquelados

**Como** cocina / mostrador  
**Quiero** ver cada pedido como un ticket horizontal tipo comanda real  
**Para** leer rápido ítems, notas y accionar con el talón lateral

**Criterios de aceptación — layout ticket**

Referencia visual: ticket con bordes rayados superior/inferior, perforación entre cuerpo y talón.

| Zona | Contenido |
|------|-----------|
| **Header rayado** | `#orden` · hora · badge estado · tiempo transcurrido |
| **Cuerpo** | Cliente, tipo (delivery/retiro), ítems con cantidad + notas, subtotal/total, método de pago |
| **Perforación** | Notch semicircular CSS entre cuerpo y talón |
| **Talón lateral** | Botón de acción principal según estado (ver HU-C03) |

**Datos obligatorios en el ticket**

```typescript
// KitchenOrderTicket — campos visibles
orderNumber: number        // secuencial por negocio, ej. 1043
customerName: string
fulfillmentType: 'delivery' | 'pickup'
items: OrderItemDetail[]   // name, qty, unitPrice, note?
paymentMethod: 'mercadopago_qr' | 'mercadopago_fast' | 'cash'
paymentStatus: 'paid' | 'unpaid'
totalCents: number
notes?: string             // nota general del pedido
createdAt: ISO8601
elapsedMinutes: number     // desde created_at
status: OrderLifecycleStatus
```

**Comportamiento**

- Scroll horizontal; tickets ordenados por antigüedad (más viejo primero en `pending`).
- Ticket `pending` resaltado (borde animado / pulso suave).
- Ticket `rejected` atenuado con motivo visible.
- Responsive: en mobile el talón pasa abajo (ticket vertical compacto).

---

### HU-C03 — Talón de acción por estado

**Como** operador  
**Quiero** un solo botón claro por ticket según su estado  
**Para** avanzar el pedido sin confusión

| Estado | Label talón | Acción |
|--------|-------------|--------|
| `pending` | **A cocina** | → `preparing` |
| `preparing` | **A reparto** | → `delivering`, genera PIN |
| `delivering` | **Entregado** | Abre input PIN → valida → `delivered` |
| cualquiera* | **Rechazar** | Abre modal motivo → `rejected` + refund |

\* Rechazo permitido desde `pending`, `preparing`, `delivering`. Bloqueado en `delivered`.

**Reversión (secundaria):** menú "⋯" en el ticket con "Volver atrás" si la transición inversa está permitida (ver SDD 02).

---

### HU-C04 — Rechazo con motivo y reembolso

**Como** operador  
**Quiero** rechazar un pedido indicando obligatoriamente el motivo  
**Para** que el cliente sepa qué pasó y reciba devolución si pagó con MP

**Criterios de aceptación**

- Modal con textarea motivo (mín. 10 caracteres).
- Motivos sugeridos: "Sin stock", "Local cerrado", "Zona no cubierta", "Otro".
- Al confirmar:
  - `status → rejected`, `rejection_reason` persistido.
  - Si `payment_status = paid` y método MP → refund automático.
  - Si `cash` → solo rechazo, sin refund.
- Si refund MP falla: pedido queda `rejected` con flag `refund_pending = true` para reintento manual.

---

## Cliente

### HU-U01 — Seguimiento con stepper

**Como** cliente que hizo un pedido  
**Quiero** ver en tiempo real en qué etapa está  
**Para** saber cuándo esperar mi comida

**Criterios de aceptación — UI**

Referencia visual: bottom sheet oscuro sobre fondo del negocio/mapa.

| Elemento | Detalle |
|----------|---------|
| **Header** | Botón volver, logo/nombre del negocio |
| **Fondo** | Banner del negocio o mapa estático (v1: imagen del local) |
| **Bottom sheet** | Esquinas redondeadas, fondo `#1c1917`, padding generoso |
| **Título dinámico** | "Llega aprox. HH:MM" / "Preparando tu pedido" / etc. |
| **Subtítulo** | Mensaje humano según estado |
| **Stepper** | 4 íconos conectados por línea punteada |

**Stepper — pasos**

| Paso | Ícono | Activo cuando |
|------|-------|---------------|
| Pedido confirmado | `receipt_long` | `pending`+ |
| En cocina | `skillet` | `preparing`+ |
| En camino | `moped` | `delivering`+ |
| Entregado | `check_circle` | `delivered` |

- Pasos completados: acento `#9a0002`.
- Paso actual: acento + pulso sutil.
- Pasos futuros: gris `#6b7280`.

**Estados terminales**

- `rejected`: stepper reemplazado por mensaje de error + motivo (sin PIN).
- Sheet no dismissable hasta terminal (`delivered` | `rejected`).

---

### HU-U02 — PIN de entrega

**Como** cliente  
**Quiero** ver mi código PIN cuando el pedido está en camino  
**Para** dictárselo al repartidor y confirmar que recibí el pedido

**Criterios de aceptación**

- PIN de 4 dígitos, generado al pasar a `delivering`.
- Visible solo para el `customer_user_id` del pedido.
- Display grande, monospace, separado: `4 · 8 · 2 · 9`.
- Texto auxiliar: "Decile este código al repartidor para confirmar la entrega."
- El repartidor/operador ingresa el PIN en el talón del ticket (lado comercio).
- 5 intentos fallidos → bloqueo 15 min (rate limit server-side).

---

### HU-U03 — Contacto con el negocio

**Como** cliente en seguimiento  
**Quiero** llamar o escribir al negocio  
**Para** resolver dudas sobre mi pedido

**Criterios de aceptación**

- Fila inferior del sheet: avatar/logo negocio, nombre, rol "Local".
- Botón llamar (`tel:`) si hay teléfono del negocio.
- Botón WhatsApp si el negocio tiene WhatsApp conectado.
- Sin chat in-app en v1.

---

## Resumen de pantallas

| Ruta | Componente principal | Usuario |
|------|---------------------|---------|
| `/negocio/[id]/pedidos` | `ComanderaBoard` | Comercio |
| `/negocio/[id]/*` (global) | Banner en `BusinessTopbar` | Comercio |
| `/pedido/[orderId]` | `OrderTrackingPage` | Cliente |
