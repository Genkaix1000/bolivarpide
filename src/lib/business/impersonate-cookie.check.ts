import { createHmac, timingSafeEqual } from "node:crypto";
import assert from "node:assert/strict";

// Mirror of impersonate signing (keep in sync with impersonate.ts)
function sign(secret: string, payload: string) {
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

function verify(secret: string, token: string) {
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [businessId, actorId, expStr] = payload.split(":");
  const exp = Number(expStr);
  if (!businessId || !actorId || exp < Date.now() / 1000) return null;
  return { businessId, actorId, exp };
}

const secret = "test-secret";
const exp = Math.floor(Date.now() / 1000) + 60;
const token = sign(secret, `biz1:actor1:${exp}`);
const ok = verify(secret, token);
assert.equal(ok?.businessId, "biz1");
assert.equal(ok?.actorId, "actor1");
assert.equal(verify(secret, token + "x"), null);
assert.equal(verify("other", token), null);
assert.equal(verify(secret, sign(secret, `biz1:actor1:${Math.floor(Date.now() / 1000) - 10}`)), null);

console.log("impersonate-cookie.check.ts: ok");
