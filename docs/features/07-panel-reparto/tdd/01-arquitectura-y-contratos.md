# TDD 01 — Arquitectura y contratos

## Tipos TypeScript

```typescript
// src/lib/delivery/types.ts

/** Pedido para la consola del repartidor. */
export type DeliveryOrderView = {
  id: string;
  orderNumber: number;
  status: OrderLifecycleStatus;       // preparing | delivering | delivered | rejected
  fulfillmentType: "delivery";
  customerName: string;
  customerVerified: boolean;
  customerPhone: string | null;
  whatsappUrl: string | null;          // null si negocio sin WhatsApp o sin teléfono
  deliveryAddress: string | null;
  itemsSummary: string;                // reusa formatOrderItemsSummary
  notes: string | null;
  paymentMethod: string | null;
  paymentStatus: string;
  totalCents: number;
  createdAt: string;
  elapsedMinutes: number;
  assignedToMe: boolean;               // true si delivery_driver_id === userId
  canClaim: boolean;                   // delivering && delivery_driver_id === null
  rejectionReason?: string | null;
};

/** Fila para la vista de gestión owner/staff. */
export type DispatchOrderView = {
  id: string;
  orderNumber: number;
  status: OrderLifecycleStatus;        // preparing | delivering
  customerName: string;
  deliveryAddress: string | null;
  itemsSummary: string;
  totalCents: number;
  elapsedMinutes: number;
  driverId: string | null;
  driverName: string | null;
  assignedAt: string | null;
};

export type ActiveDriver = {
  userId: string;
  displayName: string;
  initials: string;
  activeDeliveriesCount: number;       // delivering + driver_id = este driver
};

export type DriverBoard = {
  enCamino: DeliveryOrderView[];
  disponibles: DeliveryOrderView[];    // canClaim
  porSalir: DeliveryOrderView[];       // preparing + asignados a mí
  historial: DeliveryOrderView[];      // delivered/rejected asignados a mí (24 h)
};

export type DispatchQueue = {
  enCocina: DispatchOrderView[];
  enReparto: DispatchOrderView[];
  drivers: ActiveDriver[];
};
```

## Server Actions

Nueva: `src/lib/delivery/actions.ts` (todas `"use server"`).

```typescript
export async function assignOrderToDriver(input: {
  businessId: string;
  orderId: string;
  driverId: string;
}): Promise<{ ok: true; driverName: string } | { ok: false; error: string }>;

export async function unassignOrder(input: {
  businessId: string;
  orderId: string;
}): Promise<{ ok: true } | { ok: false; error: string }>;

export async function claimDeliveryOrder(input: {
  businessId: string;
  orderId: string;
}): Promise<{ ok: true } | { ok: false; error: string }>;
```

**Validaciones internas (todas):**

1. `requireBusinessAccess(businessId)` → `member?.role` (admin → "owner").
2. `assignOrderToDriver` / `unassignOrder`: requieren rol `owner | staff`. `claimDeliveryOrder`: requiere rol `driver`.
3. Actualización con **`service` client** (el UPDATE de `orders` está revocado a `authenticated`):
   - assign: `.eq("id", orderId).eq("business_id", businessId)` → set `delivery_driver_id`, `assigned_at`.
   - unassign: `.eq("id", orderId).eq("delivery_driver_id", member.user_id)` → set `delivery_driver_id = null` (o `.eq` explícito al driver actual).
   - claim: `.eq("id", orderId).eq("status", "delivering").eq("delivery_driver_id", null)` → set `delivery_driver_id = userId`, `assigned_at`. **Race-safe.**
4. Limpieza de asignación si el pedido está en estado terminal o revertido: la acción chequea `status` antes de asignar (permitido en `preparing` y `delivering`).
5. Side effects:
   - assign → `insertNotification({ userId: driverId, category: "orders", title: "Nuevo pedido asignado", body: "Pedido #N en reparto", actionUrl: /negocio/${businessId}/reparto, entityType: "order", entityId: orderId, dedupeKey: "delivery-assign-${orderId}" })` (el push lo dispara el trigger).
   - unassign → notificación al driver previo (título "Pedido #N reasignado").
   - claim por terceros no aplica (es self-service).
6. `revalidatePath("/negocio/${businessId}/reparto")`.

**Sin acción nueva de entrega:** la confirmación de `delivered` reusa `advanceOrderStatus` (`src/lib/orders/actions.ts`), que ya admite driver y valida PIN + lock en el RPC.

## Reglas puras (`rules.ts`, sin `"use server"`)

Un archivo `"use server"` en Next solo puede exportar funciones async; los helpers
puros se aíslan en `src/lib/delivery/rules.ts` (testeable sin framework).

```typescript
export function isDeliveryManager(role: string | null | undefined): boolean;
// owner/staff gestionan la cola; driver solo toma.

export function assignmentBlockReason(input: {
  status: string;
  fulfillment_type: string | null;
}): string | null;
// null = asignable; string = motivo para el usuario.
// Bloquea pickup (los retiros pasan por delivering pero NO se asignan a reparto)
// y estados fuera de preparing/delivering.
```

## Consultas

Nueva: `src/lib/delivery/queries.ts` (server, con `requireBusinessAccess` + `service` client, igual que `kitchen.ts`).

```typescript
export async function listDriverDeliveries(
  businessId: string,
  userId: string,
): Promise<DriverBoard>;

export async function listDispatchQueue(
  businessId: string,
): Promise<DispatchQueue>;
```

- `DriverBoard` se compone de 4 subconsultas sobre `orders` (business_id fijo, `fulfillment_type = 'delivery'`):
  - En camino: `status='delivering' AND delivery_driver_id=me`
  - Disponibles: `status='delivering' AND delivery_driver_id IS NULL`
  - Por salir: `status='preparing' AND delivery_driver_id=me`
  - Historial: `delivery_driver_id=me AND status IN ('delivered','rejected')` + `gte(updated_at, ahora - 24 h)`, limit 20
- Enriquecimiento: perfiles del cliente (nombre, teléfono, avatar) + `business_whatsapp` para el link, igual que `kitchen.ts`.
- Drivers activos: `business_members` `role='driver' status='active'` + `user_profiles.display_name`; `activeDeliveriesCount` por conteo paralelo.
- Helpers puros exportados para testear sin cliente: `mapDeliveryOrder(row, userId)`, `mapDispatchOrder(row)`, `canClaimOrder(row, userId)`, `cleanupAssignmentOnRevert(...)`.

## Components UI

| Componente | Path | Responsabilidad |
|------------|------|-----------------|
| `DispatchView` | `src/components/delivery/DispatchView.tsx` | Cola preparing/delivering + asignar + repartidores |
| `DriverBoard` | `src/components/delivery/DriverBoard.tsx` | Tabs (En camino/Disponibles/Por salir/Historial) + Realtime + polling |
| `DeliveryOrderCard` | `src/components/delivery/DeliveryOrderCard.tsx` | Tarjeta de envío: dirección, contacto, ítems, CTA |
| `AssignDriverSelect` | `src/components/delivery/AssignDriverSelect.tsx` | Dropdown de drivers activos (en DispatchView) |
| `PinConfirmInput` (reuso) | `src/components/business/PinConfirmInput.tsx` | PIN de entrega (sin cambios) |
| `advanceOrderStatus` (reuso) | `src/lib/orders/actions.ts` | Confirmar entregado (sin cambios) |

### Patrón de la tarjeta (`DeliveryOrderCard`)

```tsx
<article>
  <header>#1043 · ⏱ 6 min · badge estado</header>
  <address>Oliva 1234, San Carlos de Bolívar</address>
  <ul>2× Milanesa napolitana · 1× Coca 1.5L (+sin hielo)</ul>
  <footer>
    <a tel:> 📞 </a><a wa.me> 💬 </a><a google maps> 🗺 Ruta </a>
    {canClaim ? <button onClaim>Tomar pedido</button> : <button onConfirm>Entregado</button>}
  </footer>
  {confirming && <PinConfirmInput onConfirm={(pin) => advanceOrderStatus({...})} />}
</article>
```

### DriverBoard — Realtime y refresco

El mismo calco de `ComanderaBoard`:

- `refresh()` → `fetch("/api/orders/delivery?businessId=...", { cache: "no-store" })`.
- Supabase channel `reparto-${businessId}` → `postgres_changes` en `orders` (`business_id=eq.${id}`, event `*`) → `refresh()`.
- Polling 8 s + refetch on focus como safety net.
- Limpieza de channel/interval/listener en `useEffect` cleanup.

## API routes nuevas

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/api/orders/delivery?businessId=` | Board driver (auth + `listDriverDeliveries`) |
| GET | `/api/orders/dispatch?businessId=` | Cola owner/staff (auth + `listDispatchQueue`) |

Preferir server actions para mutar; routes solo para refresco de lectura (patrón `/api/orders/kitchen`).

## Archivos a modificar / crear

| Archivo | Acción |
|---------|--------|
| `src/lib/delivery/{types,rules,queries,actions,display}.ts` | **Nuevos** |
| `src/lib/delivery/{queries,rules}.check.ts` | **Nuevos** |
| `src/components/delivery/{DispatchView,DriverBoard,DeliveryOrderCard,AssignDriverSelect}.tsx` | **Nuevos** |
| `src/app/negocio/[businessId]/reparto/page.tsx` | **Nuevo** (switch por rol) |
| `src/app/api/orders/{delivery,dispatch}/route.ts` | **Nuevos** |
| `src/lib/business/queries.ts` | Agregar `role` a `BusinessShellData` en `getBusinessShellData` |
| `src/components/business/BusinessLayout.tsx` | Pasar `role` al sidebar |
| `src/components/business/BusinessSidebar.tsx` | Item "Reparto" + filtrado por rol (driver ve solo Reparto/Mis locales/Ir al inicio) |
| `src/hooks/useOrderAlerts.ts` | Sin cambios (opcional: badge de reparto) |

## Dependencias

Ninguna nueva. Reutilizar:

- `@/lib/orders/actions` — `advanceOrderStatus`
- `@/lib/orders/kitchen` — helpers `customerDisplayName` / `customerPhone` / `whatsAppUrl`
- `@/lib/notifications/repository` — `insertNotification`
- `@/lib/supabase/service` — `createServiceClient` (asignación)
- `@/lib/business/queries` — `requireBusinessAccess`
- Material Symbols + framer-motion como el resto del panel