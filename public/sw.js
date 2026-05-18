// Home OS Service Worker
// Implements offline caching with multiple strategies based on request type.

const CACHE_VERSION = "home-os-v1";

const PRECACHE_URLS = [
  "/offline.html",
];

// --- Lifecycle Events ---

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_VERSION)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// --- Fetch Event ---

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Supabase API — network-only
  if (url.hostname.includes("supabase.co")) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation requests — network-first with 3s timeout
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithTimeout(request, 3000));
    return;
  }

  // Static assets (icons, fonts, images) — cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // All other requests — network-first without timeout
  event.respondWith(networkFirst(request));
});

// --- Strategy: Network-first with timeout (for navigation) ---

function networkFirstWithTimeout(request, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;

    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        fallbackForNavigation(request).then(resolve);
      }
    }, timeoutMs);

    fetch(request)
      .then((response) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          // Cache the successful navigation response
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          resolve(response);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          fallbackForNavigation(request).then(resolve);
        }
      });
  });
}

// Fallback chain: cached shell → offline page
function fallbackForNavigation(request) {
  return caches
    .match(request)
    .then((cached) => {
      if (cached) return cached;
      return caches.match("/offline.html");
    })
    .then((response) => response || new Response("Offline", { status: 503 }));
}

// --- Strategy: Cache-first (for static assets) ---

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;

    return fetch(request).then((response) => {
      // Only cache successful responses
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
      }
      return response;
    });
  });
}

// --- Strategy: Network-first without timeout (for other requests) ---

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      // Cache successful responses for offline fallback
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => {
      return caches.match(request).then(
        (cached) => cached || new Response("Network error", { status: 503 })
      );
    });
}

// --- Helpers ---

function isStaticAsset(url) {
  const pathname = url.pathname;

  // Icons directory
  if (pathname.startsWith("/icons/")) return true;

  // Font files
  if (/\.(woff2?|ttf|otf|eot)$/i.test(pathname)) return true;

  // Image files
  if (/\.(png|jpe?g|gif|svg|webp|ico|avif)$/i.test(pathname)) return true;

  return false;
}
