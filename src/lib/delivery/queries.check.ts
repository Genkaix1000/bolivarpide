import assert from "node:assert/strict";
import {
  canClaimOrder,
  cleanupAssignmentPatch,
  deliveryOrderTab,
  driverDisplayName,
  driverInitials,
  mapDeliveryOrder,
  mapDispatchOrder,
} from "./queries";
import type { DeliveryOrderRow } from "./types";

function row(overrides: Partial<DeliveryOrderRow> = {}): DeliveryOrderRow {
  return {
    id: "order-1",
    order_number: 1043,
    status: "delivering",
    customer_user_id: "cust-1",
    customer_name: "Valentina Paz",
    customer_phone: null,
    fulfillment_type: "delivery",
    payment_method: "cash",
    payment_status: "paid",
    total_cents: 9800,
    notes: "Sin mayonesa",
    created_at: "2026-09-05T12:00:00.000Z",
    updated_at: "2026-09-05T12:30:00.000Z",
    rejection_reason: null,
    delivery_address: "Oliva 1234",
    delivery_driver_id: "driver-1",
    assigned_at: null,
    order_items: [
      { name: "Milanesa napolitana", quantity: 2, unit_price_cents: 2400 },
    ],
    ...overrides,
  };
}

const PROFILE = {
  user_id: "cust-1",
  first_name: "Valentina",
  last_name: "Paz",
  display_name: null,
  identity_verified: true,
  phone: "2215550132",
  avatar_type: null,
  avatar_value: null,
  avatar_gradient_id: null,
};

// ---------------------------------------------------------------------------
// canClaimOrder
// ---------------------------------------------------------------------------

assert.equal(
  canClaimOrder(row({ status: "delivering", delivery_driver_id: null }), "driver-1"),
  true,
);
assert.equal(
  canClaimOrder(row({ status: "delivering", delivery_driver_id: "other" }), "driver-1"),
  false,
);
assert.equal(
  canClaimOrder(row({ status: "preparing", delivery_driver_id: null }), "driver-1"),
  false,
);

// ---------------------------------------------------------------------------
// mapDeliveryOrder → deliveryOrderTab (bucket de DriverBoard)
// ---------------------------------------------------------------------------

const me = "driver-1";

const enCamino = mapDeliveryOrder(
  row(),
  me,
  PROFILE,
  true,
);
assert.ok(enCamino);
assert.equal(enCamino.customerName, "Valentina Paz");
assert.equal(enCamino.customerVerified, true);
assert.equal(enCamino.customerPhone, "2215550132");
assert.ok(enCamino.whatsappUrl?.startsWith("https://wa.me/542215550132"));
assert.equal(enCamino.itemsSummary, "2× Milanesa napolitana");
assert.equal(enCamino.notes, "Sin mayonesa");
assert.equal(enCamino.totalCents, 9800);
assert.equal(enCamino.assignedToMe, true);
assert.equal(enCamino.canClaim, false);
assert.equal(deliveryOrderTab(enCamino), "enCamino");

const disponibles = mapDeliveryOrder(
  row({ delivery_driver_id: null }),
  me,
  undefined,
  false,
);
assert.ok(disponibles);
assert.equal(disponibles.assignedToMe, false);
assert.equal(disponibles.canClaim, true);
assert.equal(disponibles.whatsappUrl, null, "sin WhatsApp conectado");
assert.equal(deliveryOrderTab(disponibles), "disponibles");

const porSalir = mapDeliveryOrder(
  row({ status: "preparing" }),
  me,
  undefined,
  false,
);
assert.ok(porSalir);
assert.equal(deliveryOrderTab(porSalir), "porSalir");

const historial = mapDeliveryOrder(
  row({ status: "delivered", rejection_reason: null }),
  me,
  undefined,
  false,
);
assert.ok(historial);
assert.equal(deliveryOrderTab(historial), "historial");

const rechazadoMio = mapDeliveryOrder(
  row({ status: "rejected", rejection_reason: "Zona no cubierta" }),
  me,
  undefined,
  false,
);
assert.ok(rechazadoMio);
assert.equal(rechazadoMio.rejectionReason, "Zona no cubierta");
assert.equal(deliveryOrderTab(rechazadoMio), "historial");

// Pedido en camino asignado a OTRO driver → no aparece en el board del mío.
const deOtro = mapDeliveryOrder(
  row({ delivery_driver_id: "driver-9" }),
  me,
  undefined,
  false,
);
assert.ok(deOtro);
assert.equal(deliveryOrderTab(deOtro), null);

// Entregado asignado a otro → tampoco.
const entregadoDeOtro = mapDeliveryOrder(
  row({ status: "delivered", delivery_driver_id: "driver-9" }),
  me,
  undefined,
  false,
);
assert.ok(entregadoDeOtro);
assert.equal(deliveryOrderTab(entregadoDeOtro), null);

// Pickup nunca entra a reparto.
const pickup = mapDeliveryOrder(
  row({ fulfillment_type: "pickup", delivery_driver_id: null }),
  me,
  undefined,
  false,
);
assert.equal(pickup, null);

// Estado inválido → null.
assert.equal(
  mapDeliveryOrder(row({ status: "made_up" }), me, undefined, false),
  null,
);

// El teléfono del pedido se usa si el perfil no tiene.
const sinPerfil = mapDeliveryOrder(
  row({ customer_phone: "2215009999" }),
  me,
  undefined,
  true,
);
assert.ok(sinPerfil);
assert.equal(sinPerfil.customerPhone, "2215009999");

// ---------------------------------------------------------------------------
// mapDispatchOrder (vista owner/staff)
// ---------------------------------------------------------------------------

const dispatchPreparing = mapDispatchOrder(
  row({ status: "preparing", delivery_driver_id: "driver-1" }),
  (id) => (id === "driver-1" ? "Joaquín" : null),
);
assert.ok(dispatchPreparing);
assert.equal(dispatchPreparing.status, "preparing");
assert.equal(dispatchPreparing.driverId, "driver-1");
assert.equal(dispatchPreparing.driverName, "Joaquín");
assert.equal(dispatchPreparing.customerName, "Valentina Paz");

// Sin repartidor → driverName null.
const sinDriver = mapDispatchOrder(
  row({ status: "preparing", delivery_driver_id: null }),
  () => null,
);
assert.ok(sinDriver);
assert.equal(sinDriver.driverName, null);

// Pickup no entra a la cola de reparto.
assert.equal(
  mapDispatchOrder(row({ status: "preparing", fulfillment_type: "pickup" }), () => null),
  null,
);

// Estados fuera de preparing/delivering → null.
assert.equal(
  mapDispatchOrder(row({ status: "delivered" }), () => null),
  null,
);
assert.equal(
  mapDispatchOrder(row({ status: "pending" }), () => null),
  null,
);

// ---------------------------------------------------------------------------
// cleanupAssignmentPatch
// ---------------------------------------------------------------------------

assert.deepEqual(cleanupAssignmentPatch(), {
  delivery_driver_id: null,
  assigned_at: null,
});

// ---------------------------------------------------------------------------
// driverDisplayName / driverInitials
// ---------------------------------------------------------------------------

assert.equal(driverDisplayName(undefined, null), "Repartidor");
assert.equal(driverDisplayName(undefined, "Joaquín"), "Joaquín");
assert.equal(
  driverDisplayName(
    { first_name: "Joaquín", last_name: "Perez", display_name: null },
    null,
  ),
  "Joaquín Perez",
);
assert.equal(
  driverDisplayName(
    { first_name: null, last_name: null, display_name: "Joa" },
    null,
  ),
  "Joa",
);

assert.equal(driverInitials("Joaquín Perez"), "JP");
assert.equal(driverInitials("Joaquín"), "JO");
assert.equal(driverInitials(""), "RD");

console.log("delivery/queries.check.ts OK");