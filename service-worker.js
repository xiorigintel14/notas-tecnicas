const CACHE_NAME = "notas-cache-v6";

const STATIC_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// ===============================
// INSTALACIÓN
// ===============================
self.addEventListener("install", event => {
  console.log("✅ Service Worker instalado");

  self.skipWaiting();

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
  );
});

// ===============================
// ACTIVACIÓN
// ===============================
self.addEventListener("activate", event => {
  console.log("✅ Service Worker activado");

  event.waitUntil(
    caches
      .keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log("🗑️ Eliminando caché anterior:", key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ===============================
// SOLICITUDES
// ===============================
self.addEventListener("fetch", event => {
  const request = event.request;

  // Solo procesar solicitudes GET
  if (request.method !== "GET") {
    return;
  }

  // No interceptar servicios externos
  if (
    request.url.includes("script.google.com") ||
    request.url.includes("googleapis.com") ||
    request.url.startsWith("chrome-extension://")
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Actualizar la caché en segundo plano
      const networkResponse = fetch(request)
        .then(response => {
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(() => null);

      // Mostrar inmediatamente lo almacenado
      if (cachedResponse) {
        event.waitUntil(networkResponse);
        return cachedResponse;
      }

      // Si no existe en caché, intentar Internet
      return networkResponse.then(response => {
        if (response) {
          return response;
        }

        // Respaldo para navegación sin conexión
        if (request.mode === "navigate") {
          return caches.match("./index.html");
        }

        return new Response("Sin conexión", {
          status: 503,
          statusText: "Offline"
        });
      });
    })
  );
});
