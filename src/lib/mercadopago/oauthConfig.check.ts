import assert from "node:assert/strict";
import { getMpOAuthConfigStatus, MP_BOLIVARPIDE_APP_ID } from "@/lib/mercadopago/oauthConfig";

const status = getMpOAuthConfigStatus();
assert.equal(typeof status.appId, "string");
assert.equal(status.expectedAppId, MP_BOLIVARPIDE_APP_ID);
assert.ok(Array.isArray(status.issues));
console.log("oauthConfig.check ok", {
  configured: status.configured,
  appIdMatches: status.appIdMatchesBolivarpide,
  issues: status.issues.length,
});
