/* BolivarPide · Service Worker
 * Un único SW con scope "/" controla las 3 superficies (cliente /, negocio /negocio, admin /admin).
 * Estrategias:
 *   - Navegación            → network-first, cachea el shell de la superficie (offline básico).
 *   - _next/static + íconos → cache-first con revalidación en background (assets hasheados).
 *   - /api, Supabase, 3rd   → network-only (nunca se cachea).
 * Bump de VERSION para invalidar caches viejos al publicar. */
const VERSION = "1.0.0";
const SHELL_CACHE = `bp-shell-${VERSION}`;
const ASSET_CACHE = `bp-assets-${VERSION}`;

const PRECACHE = [
  "/manifest.json",
  "/manifest-negocio.webmanifest",
  "/manifest-admin.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-192x192.png",
  "/icons/icon-maskable-512x512.png",
  "/icons/apple-touch-icon-180x180.png",
];

const ASSET_PREFIX = "/_next/static/";
const ICON_PREFIX = "/icons/";
const MANIFEST_PATHS = new Set([
  "/manifest.json",
  "/manifest-negocio.webmanifest",
  "/manifest-admin.webmanifest",
]);
const ALLOWED_CACHES = new Set([SHELL_CACHE, ASSET_CACHE]);
const MAX_ASSET_CACHE = 200;

function surfaceBase(pathname) {
  if (pathname.startsWith("/admin")) return "/admin";
  if (pathname.startsWith("/negocio")) return "/negocio";
  return "/";
}

async function putBounded(cache, request, response, max) {
  await cache.put(request, response);
  const keys = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  }
}

async function assetStrategy(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    fetch(request)
      .then((res) => {
        if (res.ok) putBounded(cache, request, res.clone(), MAX_ASSET_CACHE);
      })
      .catch(() => {});
    return cached;
  }
  const res = await fetch(request);
  if (res.ok) putBounded(cache, request, res.clone(), MAX_ASSET_CACHE);
  return res;
}

async function navigateStrategy(request) {
  const cache = await caches.open(SHELL_CACHE);
  const key = new URL(surfaceBase(new URL(request.url).pathname), self.location.origin);
  try {
    const res = await fetch(request);
    if (res.ok && !new URL(request.url).search) {
      cache.put(key, res.clone());
    }
    return res;
  } catch {
    const cached = await cache.match(key);
    if (cached) return cached;
    return new Response(
      "<!doctype html><html lang='es'><meta name='viewport' content='width=device-width,initial-scale=1'><body style='font-family:system-ui;display:grid;place-items:center;height:100dvh;margin:0;background:#faf6f1;color:#1a1210'><div style='text-align:center'><h1 style='font-size:1.4rem;margin:0 0 .5rem'>Sin conexión</h1><p style='margin:0;color:#666'>Volvé a intentar cuando tengas internet.</p></div></body></html>",
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(ASSET_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !ALLOWED_CACHES.has(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/image")) return;

  if (request.mode === "navigate") {
    event.respondWith(navigateStrategy(request));
    return;
  }

  if (
    url.pathname.startsWith(ASSET_PREFIX) ||
    url.pathname.startsWith(ICON_PREFIX) ||
    MANIFEST_PATHS.has(url.pathname)
  ) {
    event.respondWith(assetStrategy(request));
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(data.title || "BolivarPide", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const base = new URL(target, self.location.origin).pathname;
      for (const client of windows) {
        if (new URL(client.url).pathname === base) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(base);
    })()
  );
});