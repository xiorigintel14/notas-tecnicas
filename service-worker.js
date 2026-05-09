const CACHE_NAME = "notas-cache-v5";

// Archivos esenciales
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
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(STATIC_FILES);
      })
  );
});

// ===============================
// ACTIVACIÓN
// ===============================
self.addEventListener("activate", event => {

  console.log("✅ Service Worker activado");

  event.waitUntil(

    caches.keys().then(keys => {

      return Promise.all(

        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log("🗑️ Eliminando cache viejo:", key);
            return caches.delete(key);
          })

      );

    }).then(() => self.clients.claim())

  );
});

// ===============================
// FETCH
// ===============================
self.addEventListener("fetch", event => {

  const req = event.request;

  // ❌ Ignorar métodos distintos a GET
  if (req.method !== "GET") return;

  // ❌ Ignorar Google Sheets
  if (
    req.url.includes("script.google.com") ||
    req.url.includes("googleapis.com")
  ) {
    return;
  }

  // ❌ Ignorar extensiones Chrome
  if (
    req.url.startsWith("chrome-extension://")
  ) {
    return;
  }

  event.respondWith(

    fetch(req)

      .then(networkRes => {

        // Evitar guardar respuestas inválidas
        if (
          !networkRes ||
          networkRes.status !== 200 ||
          networkRes.type !== "basic"
        ) {
          return networkRes;
        }

        const responseClone = networkRes.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(req, responseClone);
          });

        return networkRes;
      })

      .catch(() => {

        return caches.match(req)
          .then(cacheRes => {

            // Si existe en cache
            if (cacheRes) {
              return cacheRes;
            }

            // Fallback offline
            if (req.mode === "navigate") {
              return caches.match("./index.html");
            }

          });

      })

  );

});