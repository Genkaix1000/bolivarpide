import assert from "node:assert/strict";
import { assignmentBlockReason, isDeliveryManager } from "./rules";

// -- Permisos de gestión
assert.equal(isDeliveryManager("owner"), true);
assert.equal(isDeliveryManager("staff"), true);
assert.equal(isDeliveryManager("driver"), false);
assert.equal(isDeliveryManager(null), false);
assert.equal(isDeliveryManager(undefined), false);
assert.equal(isDeliveryManager("admin"), false, "el role real es owner para admins (se resuelve antes)");

// -- Bloqueos de asignación
assert.equal(
  assignmentBlockReason({ status: "delivering", fulfillment_type: "delivery" }),
  null,
);
assert.equal(
  assignmentBlockReason({ status: "preparing", fulfillment_type: "delivery" }),
  null,
);
assert.equal(
  assignmentBlockReason({ status: "preparing", fulfillment_type: "pickup" }),
  "Un retiro no se asigna a reparto",
  "pickup nunca se asigna aunque esté en preparing/delivering",
);
assert.equal(
  assignmentBlockReason({ status: "pending", fulfillment_type: "delivery" }),
  "No se puede asignar en este estado",
);
assert.equal(
  assignmentBlockReason({ status: "delivered", fulfillment_type: "delivery" }),
  "No se puede asignar en este estado",
);
assert.equal(
  assignmentBlockReason({ status: "rejected", fulfillment_type: "delivery" }),
  "No se puede asignar en este estado",
);

console.log("delivery/rules.check.ts OK");