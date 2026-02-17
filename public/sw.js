const CACHE_VERSION = "v2";
const STATIC_CACHE = `qb-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `qb-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";
const ASSETS = [
  "/",
  "/products",
  "/search",
  OFFLINE_URL,
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) =>
            key === STATIC_CACHE || key === RUNTIME_CACHE
              ? null
              : caches.delete(key),
          ),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const { request } = event;
  const isNavigation = request.mode === "navigate";

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match(OFFLINE_URL);
          return fallback ?? Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => cached);
      return cached ?? fetchPromise;
    }),
  );
});
