// Run: npx tsx src/lib/whatsapp/status.check.ts
import assert from "node:assert/strict";
import {
  canAdvanceStatus,
  isOutboundStatus,
  statusRank,
  statusesBelow,
} from "@/lib/whatsapp/status";

// Orden esperado del ciclo de vida.
assert.ok(statusRank("sent") < statusRank("delivered"));
assert.ok(statusRank("delivered") < statusRank("read"));
assert.ok(statusRank("read") < statusRank("failed"));

// Avanzar sí, retroceder no. La regresión concreta: Meta manda el `read`
// antes que el `delivered` y el mensaje leído volvía a un solo tilde.
assert.equal(canAdvanceStatus("sent", "delivered"), true);
assert.equal(canAdvanceStatus("sent", "read"), true);
assert.equal(canAdvanceStatus("delivered", "read"), true);
assert.equal(canAdvanceStatus("read", "delivered"), false);
assert.equal(canAdvanceStatus("delivered", "sent"), false);
assert.equal(canAdvanceStatus("read", "sent"), false);

// Un estado no avanza sobre sí mismo (webhooks duplicados de Meta).
assert.equal(canAdvanceStatus("sent", "sent"), false);
assert.equal(canAdvanceStatus("read", "read"), false);

// Un fallo reportado por Meta pisa cualquier progreso previo.
assert.equal(canAdvanceStatus("sent", "failed"), true);
assert.equal(canAdvanceStatus("read", "failed"), true);
assert.equal(canAdvanceStatus("failed", "read"), false);

// statusesBelow alimenta el filtro del UPDATE.
assert.deepEqual(statusesBelow("delivered").sort(), ["sent"]);
assert.deepEqual(statusesBelow("read").sort(), ["delivered", "sent"]);
assert.deepEqual(statusesBelow("failed").sort(), ["delivered", "read", "sent"]);
assert.deepEqual(statusesBelow("sent"), []);

// Guard de entrada: el status del webhook viene sin validar.
assert.equal(isOutboundStatus("read"), true);
assert.equal(isOutboundStatus("received"), false);
assert.equal(isOutboundStatus("cualquiera"), false);
assert.equal(isOutboundStatus(""), false);

console.log("whatsapp status checks OK");
