import assert from "node:assert/strict";
import {
  isMpPublicReturnOrigin,
  mpCheckoutBackUrls,
  resolveSiteOrigin,
} from "@/lib/mercadopago/env";

assert.equal(resolveSiteOrigin("https://app.example.com/"), "https://app.example.com");
assert.equal(isMpPublicReturnOrigin("http://localhost:3000"), false);
assert.equal(isMpPublicReturnOrigin("http://192.168.0.5:3000"), false);
assert.equal(isMpPublicReturnOrigin("https://bolivarpide.onrender.com"), true);

const back = mpCheckoutBackUrls("https://bolivarpide.onrender.com", "ord-1");
assert.ok(back);
assert.match(back!.back_urls.success, /orderId=ord-1/);
assert.match(back!.back_urls.success, /status=success/);
assert.equal(mpCheckoutBackUrls("http://localhost:3000", "ord-1"), null);
assert.equal(mpCheckoutBackUrls("http://192.168.1.2:3000", "ord-1"), null);

console.log("env.check ok");
