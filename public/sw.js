// public/sw.js
const CACHE_NAME = "bottype-cache-v2";
const APP_SHELL = ["/", "/index.html", "/favicon.svg", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

// Cambiá esto si servís imágenes desde otro host (tu backend):
const IMG_HOST = self.location.origin; // o p.ej. "https://robot-backend.tu-dominio.com"

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategias:
// - Navegación (SPA): devuelve index.html para rutas internas si offline
// - Estáticos (app shell): cache-first
// - Imágenes (mismo host o IMG_HOST): stale-while-revalidate
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // 1) Navegación SPA
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  const url = new URL(request.url);

  // 2) Estáticos del app shell
  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // 3) Imágenes (cache dinámico con SWR)
  if (request.destination === "image" && (url.origin === IMG_HOST)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 4) Default: intenta red, cae a cache si existe
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((res) => {
      cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}


//Cuando hagas cambios en el SW, subí la versión del CACHE_NAME (e.g. -v3) para que los clientes actualicen.