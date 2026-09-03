/**
 * Run: node --experimental-strip-types src/lib/business/publicStore.check.ts
 * Bug guard: public store must expose resolved asset URLs, never raw storage paths as img src.
 */
import assert from "node:assert/strict";

function resolveBusinessAssetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = "https://example.supabase.co";
  const clean = path.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/business-assets/${clean}`;
}

function toFeaturedChain(b: { slug: string; name: string; logo_path: string | null; banner_path: string | null }) {
  return {
    id: b.slug,
    logoImage: resolveBusinessAssetUrl(b.logo_path),
    bannerImage: resolveBusinessAssetUrl(b.banner_path),
  };
}

const raw = "biz-1/logo-abc.webp";
const chain = toFeaturedChain({
  slug: "don-luis",
  name: "Don Luis",
  logo_path: raw,
  banner_path: "biz-1/banner-xyz.webp",
});

assert.notEqual(chain.logoImage, raw);
assert.match(String(chain.logoImage), /\/storage\/v1\/object\/public\/business-assets\//);
assert.match(String(chain.bannerImage), /banner-xyz\.webp$/);
console.log("publicStore.check.ts: ok");
