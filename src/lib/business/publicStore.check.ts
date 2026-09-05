import assert from "node:assert/strict";
import { resolveBusinessAssetUrl } from "./assets";

// Footgun documentado: sin NEXT_PUBLIC_SUPABASE_URL el asset vuelve como path
// crudo (no como URL absoluta). En producción el env siempre está set.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(resolveBusinessAssetUrl("biz-1/logo.webp"), "biz-1/logo.webp");

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
const url = resolveBusinessAssetUrl("biz-1/logo.webp");
assert.equal(
  url,
  "https://example.supabase.co/storage/v1/object/public/business-assets/biz-1/logo.webp",
);
assert.equal(resolveBusinessAssetUrl(null), undefined);
assert.equal(
  resolveBusinessAssetUrl("https://cdn.example.com/a.webp"),
  "https://cdn.example.com/a.webp",
);

console.log("publicStore.check.ts: ok");