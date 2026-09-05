# SDD 01 — Historias de usuario

## Repartidor

### HU-R01 — Consola de mis envíos

**Como** repartidor del negocio
**Quiero** una pantalla solo con mis pedidos en camino
**Para** no tener que cruzar la comandera y saber exactamente qué tengo que entregar

**Criterios de aceptación — listado**

Referencia visual: lista de tarjetas de alta densidad, columna única.

| Zona | Contenido |
|------|-----------|
| **Header** | Nombre negocio, botón volver |
| **Tabs** | `En camino` · `Disponibles` · `Por salir` · `Historial` |
| **Tarjeta En camino** | `#orden` · dirección · ítems (qty + nombre) · cliente (nombre, teléfono, WhatsApp) · método pago · tiempo transcurrido |
| **CTA En camino** | "Entregado" → abre `PinConfirmInput` → `advanceOrderStatus({ deliveryPin })` |

**Alcance de cada tab**

| Tab | Define |
|-----|--------|
| En camino | `status = delivering` **y** `delivery_driver_id = yo` |
| Disponibles | `status = delivering` **y** `delivery_driver_id IS NULL` → CTA "Tomar pedido" |
| Por salir | `status = preparing` **y** `delivery_driver_id = yo` (pre-asignado, se cocina) |
| Historial | Últimas 24 h de `delivered` / `rejected` asignados a mí |

**Filtros invariantes:** `fulfillment_type = 'delivery'` en todas las consultas (pickup no genera reparto).

---

### HU-R02 — Tomar un pedido disponible

**Como** repartidor
**Quiero** tomar un pedido que está en camino sin dueño
**Para** encargarme de la entrega cuando el negocio no lo asignó

**Criterios de aceptación**

- El botón "Tomar pedido" ejecuta un UPDATE condicional:
  - `.eq("id", orderId).eq("status", "delivering").eq("delivery_driver_id", null)`
- Si ya fue tomado por otro repartidor (`delivery_driver_id` seteado), la acción falla sin pisar al dueño → se refresca la lista.
- Al tomar, el pedido pasa a "En camino" y deja de aparecer en "Disponibles".
- El pedido así tomado se marca con `assigned_at = now()`.
- No se notifica al tomador por sí mismo.

---

### HU-R03 — Confirmar entrega con PIN

**Como** repartidor
**Quiero** confirmar la entrega ingresando el PIN que me dicta el cliente
**Para** cerrar el pedido de forma verificada

**Criterios de aceptación**

- Reusa `advanceOrderStatus({ targetStatus: "delivered", deliveryPin })` — el RPC ya valida rol, PIN y lock (5 intentos → 15 min).
- `PinConfirmInput` es un overlay de 4 dígitos con copy: *"Pedile el PIN de 4 dígitos al cliente."*
- El driver **no** puede rechazar ni revertir un pedido (bloqueado a nivel server y RPC).
- Entrega exitosa → `delivered` + notificación al cliente (ya existe: `emitCustomerStatusNotification`).

---

### HU-R04 — Contacto con el cliente

**Como** repartidor
**Quiero** llamar o escribir al cliente desde la tarjeta
**Para** coordinar la entrega sin perder tiempo

**Criterios de aceptación**

- Botón `tel:` si hay teléfono (perfil del cliente o `customer_phone` de la orden).
- Botón WhatsApp si el negocio tiene WhatsApp conectado (mismo helper `whatsAppUrl` de `kitchen.ts`).
- Botón "Abrir ruta en Google Maps" con deep link `https://www.google.com/maps/dir/?api=1&destination=<dirección>`. Sin resolver coordenadas en v1.

---

## Comercio (owner / staff)

### HU-C01 — Asignar repartidor al despachar

**Como** dueño/a o personal del local
**Quiero** elegir (opcionalmente) qué repartidor lleva cada pedido cuando lo despacho
**Para** saber quién está haciendo cada entrega y avisarle

**Criterios de aceptación**

- En la comandera, el desacople `preparing → delivering` no cambia: el pin de reparto se sigue generando en el RPC.
- Si hay drivers activos, la vista de Reparto ofrece asignar a cada pedido `preparing` o `delivering`.
- La asignación **nunca es obligatoria**: sin drivers o sin elección, el pedido despacha sin dueño (`delivery_driver_id = null`).
- Asignar/reasignar/quitar son acciones de owner/staff; el driver no puede asignar a otros.
- Al asignar: `delivery_driver_id` + `assigned_at = now()` + **Web Push al repartidor** (insert `notifications` con su `user_id` → trigger + edge `send-push`).
- Solo se listan drivers activos del negocio (`business_members role='driver' status='active'`).

---

### HU-C02 — Vista de gestión de reparto

**Como** dueño/a o personal
**Quiero** una vista resumida de la operación de reparto
**Para** ver quién está en ruta y con qué carga

**Criterios de aceptación — layout**

| Sección | Contenido |
|---------|-----------|
| **En cocina** | Pedidos `preparing` (con/sin asignación previa) + control "Asignar repartidor" |
| **En reparto** | Pedidos `delivering` con su repartidor actual, estado, tiempo transcurrido + "Reasignar" / "Quitar" |
| **Repartidores** | Lista de drivers activos con contador de pedidos en ruta |

- Actualización por Realtime (channel `reparto-${businessId}`) + polling de respaldo.
- Acciones con `useTransition` y feedback de error inline (mismo patrón de `KitchenTicketCard`).

---

### HU-C03 — Quitar / reasignar una entrega

**Como** dueño/a o personal
**Quiero** desasignar un pedido que quedó sin repartidor disponible
**Para** que vuelva a "Disponibles" o se lo asigne a otro

**Criterios de aceptación**

- "Quitar" → `delivery_driver_id = null` (el pedido vuelve a aparecer como Disponible para los drivers).
- Se notifica al repartidor previo que el pedido ya no es suyo (opcional, título claro).
- Solo owner/staff pueden hacerlo.

---

## Resumen de pantallas

| Ruta | Componente principal | Usuario |
|------|---------------------|---------|
| `/negocio/[id]/reparto` | `DispatchView` (owner/staff) o `DriverBoard` (driver) según rol | Ambos |
| `/negocio/[id]/reparto` (driver) | `DriverBoard` + `DeliveryOrderCard` | Repartidor |
| Sidebar global | Item "Reparto" filtrado por rol | Ambos |