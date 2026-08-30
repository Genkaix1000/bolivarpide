# TDD 01 — Arquitectura y contratos

## Tipos TypeScript

```typescript
// src/lib/orders/lifecycle.ts

export type OrderLifecycleStatus =
  | 'pending'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'rejected';

/** @deprecated — no usar en UI nueva */
export type LegacyOrderStatus = 'accepted' | 'ready' | 'cancelled';

export type OrderItemDetail = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  note?: string;
};

export type KitchenOrderTicket = {
  id: string;
  orderNumber: number;
  status: OrderLifecycleStatus;
  customerName: string;
  fulfillmentType: 'delivery' | 'pickup';
  items: OrderItemDetail[];
  paymentMethod: 'mercadopago_qr' | 'mercadopago_fast' | 'cash';
  paymentStatus: string;
  totalCents: number;
  notes?: string;
  createdAt: string;
  elapsedMinutes: number;
  rejectionReason?: string;
};

export type OrderTrackingView = {
  id: string;
  orderNumber: number;
  status: OrderLifecycleStatus;
  businessName: string;
  businessLogoUrl?: string;
  businessPhone?: string;
  businessWhatsapp?: string;
  estimatedDeliveryAt?: string;  // paid_at + prep_time_minutes
  deliveryPin?: string;            // solo si delivering, solo server→cliente auth
  rejectionReason?: string;
  stepperStep: 0 | 1 | 2 | 3;
  statusMessage: string;
  statusSubtitle: string;
};
```

### Stepper mapping

```typescript
export function stepperStep(status: OrderLifecycleStatus): 0 | 1 | 2 | 3 {
  switch (status) {
    case 'pending':    return 0;
    case 'preparing':  return 1;
    case 'delivering': return 2;
    case 'delivered':  return 3;
    case 'rejected':   return 0; // UI especial, no stepper
  }
}
```

---

## Server Actions

Reemplazan `setOrderStatus` en `src/lib/business/actions.ts`.

```typescript
// src/lib/orders/actions.ts

export async function advanceOrderStatus(input: {
  businessId: string;
  orderId: string;
  targetStatus: OrderLifecycleStatus;
  rejectionReason?: string;
  deliveryPin?: string;
}): Promise<{ ok: true } | { ok: false; error: string }>;

export async function revertOrderStatus(input: {
  businessId: string;
  orderId: string;
}): Promise<{ ok: true; status: OrderLifecycleStatus } | { ok: false; error: string }>;
```

**Validaciones internas:**

1. `requireBusinessAccess(businessId)` + role check
2. Cargar orden actual, verificar transición en `FORWARD` / `BACKWARD`
3. Ejecutar side effects (timestamps, PIN, refund)
4. `revalidatePath` comercio + invalidar cache cliente

---

## Servicios

### `orderChime.ts`

```typescript
// src/lib/orders/orderChime.ts

let ctx: AudioContext | null = null;

export function playOrderChime(): void;
export function unlockOrderChime(): void;  // call on first user gesture (iOS)
```

- Dos tonos ascendentes (880 Hz → 1175 Hz), 150 ms cada uno.
- Gain 0.05, no bloquear si AudioContext unavailable.
- Evolución del `beep()` inline en `OrdersBoard.tsx` — **eliminar duplicado** al migrar.

### `deliveryPin.ts`

```typescript
export function generateDeliveryPin(): string;           // 4 digits
export function hashDeliveryPin(pin: string): Promise<string>;
export function verifyDeliveryPin(pin: string, hash: string): Promise<boolean>;
```

### `refund.ts`

```typescript
// src/lib/mercadopago/refund.ts

export async function refundMercadoPagoOrder(orderId: string): Promise<{
  ok: boolean;
  refundId?: string;
  error?: string;
}>;
```

---

## Componentes UI

### Comercio

| Componente | Path | Responsabilidad |
|------------|------|-----------------|
| `ComanderaBoard` | `src/components/business/ComanderaBoard.tsx` | Scroll horizontal, Realtime, lista tickets |
| `KitchenTicketCard` | `src/components/business/KitchenTicketCard.tsx` | Ticket troquelado + talón |
| `KitchenTicketStub` | `src/components/business/KitchenTicketStub.tsx` | Talón lateral con CTA |
| `RejectOrderModal` | `src/components/business/RejectOrderModal.tsx` | Motivo obligatorio |
| `PinConfirmInput` | `src/components/business/PinConfirmInput.tsx` | 4 dígitos en talón |
| `NewOrderBanner` | `src/components/business/NewOrderBanner.tsx` | Banner Topbar |
| `useOrderAlerts` | `src/hooks/useOrderAlerts.ts` | Realtime + chime + banner state |

### Cliente

| Componente | Path | Responsabilidad |
|------------|------|-----------------|
| `OrderTrackingPage` | `src/app/pedido/[orderId]/page.tsx` | Server: auth + data |
| `OrderTrackingClient` | `src/app/pedido/[orderId]/page.client.tsx` | Realtime + layout |
| `OrderTrackingSheet` | `src/components/orders/OrderTrackingSheet.tsx` | Bottom sheet oscuro |
| `OrderStepper` | `src/components/orders/OrderStepper.tsx` | 4 íconos + conectores |
| `DeliveryPinDisplay` | `src/components/orders/DeliveryPinDisplay.tsx` | PIN grande monospace |
| `OrderContactRow` | `src/components/orders/OrderContactRow.tsx` | Llamar / WhatsApp |

---

## KitchenTicketCard — spec CSS

Ticket troquelado horizontal. Referencia: comanda física con rayas y perforación.

```tsx
// Estructura
<article className="kitchen-ticket">
  <div className="ticket-stripes-top" />      {/* repeating-linear-gradient */}
  <header>...</header>
  <div className="ticket-body">...</div>
  <div className="ticket-perforation" />      {/* pseudo notches */}
  <KitchenTicketStub status={...} />
  <div className="ticket-stripes-bottom" />
</article>
```

**Perforación:** `mask-image: radial-gradient(circle at 0 50%, transparent 8px, black 8px)` en el borde del stub, o SVG inline.

**Dimensiones desktop:** cuerpo ~320px ancho, talón ~72px. Altura mínima ~200px.

**Estados visuales:**

| Status | Estilo |
|--------|--------|
| `pending` | Borde `#9a0002` pulsante, fondo `#fffbf7` |
| `preparing` | Borde sólido cherry |
| `delivering` | Badge "En camino" |
| `delivered` | Opacidad 50%, sin talón activo |
| `rejected` | Tachado, motivo en rojo suave |

---

## OrderTrackingSheet — spec CSS

Bottom sheet inspirado en apps de delivery. Adaptado a paleta Bolivar.

```tsx
<div className="relative min-h-dvh bg-neutral-900">
  {/* fondo: banner negocio blur o mapa placeholder */}
  <OrderTrackingSheet>
    <h2>Llega aprox. {eta}</h2>
    <p>{subtitle}</p>
    <OrderStepper step={stepperStep} />
    {status === 'delivering' && <DeliveryPinDisplay pin={pin} />}
    <OrderContactRow business={...} />
  </OrderTrackingSheet>
</div>
```

**Sheet:** `fixed bottom-0 inset-x-0 rounded-t-3xl bg-[#1c1917] p-6 pb-safe`.

**Stepper conector:** `border-dashed border-[#9a0002]/40`, íconos Material Symbols.

---

## API routes (cliente)

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/api/orders/[orderId]/tracking` | Datos seguimiento (auth cliente) |
| POST | `/api/orders/[orderId]/advance` | Alternativa REST a server action |

Preferir Server Actions para comercio; route handler para polling fallback cliente.

---

## Archivos a modificar / deprecar

| Archivo | Acción |
|---------|--------|
| `src/components/business/OrdersBoard.tsx` | Reemplazar por `ComanderaBoard` |
| `src/lib/business/actions.ts` → `setOrderStatus` | Deprecar, delegar a `advanceOrderStatus` |
| `src/components/business/BusinessTopbar.tsx` | Integrar `NewOrderBanner` + `useOrderAlerts` |
| `src/components/business/DashboardView.tsx` | Actualizar `STATUS_CONFIG` con nuevos estados |
| `src/lib/mockData.ts` | Alinear mocks a lifecycle nuevo |

---

## Dependencias

Ninguna nueva. Reutilizar:

- `framer-motion` — animaciones banner/sheet
- `@/components/ui/material-symbol` — íconos stepper
- Supabase Realtime — ya usado en `OrdersBoard`
- Web Crypto / `bcryptjs` — hash PIN (verificar cuál ya está en proyecto)
