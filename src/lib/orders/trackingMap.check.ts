import assert from "node:assert/strict";

function demoRouteProgress(status: string, startedAtMs: number, nowMs: number) {
  if (status !== "delivering") return 0;
  const elapsed = Math.max(0, nowMs - startedAtMs);
  return Math.min(0.94, elapsed / 180_000);
}

assert.equal(demoRouteProgress("preparing", 0, 1000), 0);
assert.ok(demoRouteProgress("delivering", 0, 90_000) > 0.4);

console.log("trackingMap.check.ts OK");
