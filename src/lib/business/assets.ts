/** URL pública de un asset en `business-assets` o URL absoluta ya guardada. */
export function resolveBusinessAssetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  const clean = path.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/business-assets/${clean}`;
}
