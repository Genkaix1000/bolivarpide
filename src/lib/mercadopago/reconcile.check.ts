import assert from "node:assert/strict";
import { mapMpStatus, orderIdFromExternalRef } from "./reconcile";

assert.equal(mapMpStatus("processed"), "processed");
assert.equal(mapMpStatus("approved"), "processed");
assert.equal(mapMpStatus("expired"), "expired");
assert.equal(mapMpStatus("cancelled"), "canceled");
assert.equal(mapMpStatus("canceled"), "canceled");
assert.equal(mapMpStatus("rejected"), "canceled");
assert.equal(mapMpStatus("failed"), "failed");
assert.equal(mapMpStatus(undefined), "created");
assert.equal(mapMpStatus("weird"), "created");

assert.equal(orderIdFromExternalRef("BP-abc-123"), "abc-123");
assert.equal(orderIdFromExternalRef("BP-2f5b…"), "2f5b…");
assert.equal(orderIdFromExternalRef("FOO-abc"), null);
assert.equal(orderIdFromExternalRef(null), null);
assert.equal(orderIdFromExternalRef(undefined), null);

console.log("reconcile.check.ts OK");