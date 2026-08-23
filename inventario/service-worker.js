const CACHE_NAME =
  "inventario-oricue10-v3";


const STATIC_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];


// ==========================================
// INSTALAR
// ==========================================

self.addEventListener(
  "install",
  function(event) {

    self.skipWaiting();


    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(function(cache) {

          return cache.addAll(
            STATIC_FILES
          );

        })

    );

  }
);


// ==========================================
// ACTIVAR
// ==========================================

self.addEventListener(
  "activate",
  function(event) {

    event.waitUntil(

      caches
        .keys()
        .then(function(keys) {

          return Promise.all(

            keys
              .filter(function(key) {

                return (
                  key.startsWith(
                    "inventario-oricue10-"
                  ) &&
                  key !== CACHE_NAME
                );

              })

              .map(function(key) {

                return caches.delete(
                  key
                );

              })

          );

        })

        .then(function() {

          return self.clients.claim();

        })

    );

  }
);


// ==========================================
// FETCH
// ==========================================

self.addEventListener(
  "fetch",
  function(event) {

    const req =
      event.request;


    if (
      req.method !== "GET"
    ) {

      return;

    }


    // No interceptar Apps Script
    if (
      req.url.includes(
        "script.google.com"
      ) ||
      req.url.includes(
        "googleapis.com"
      )
    ) {

      return;

    }


    event.respondWith(

      fetch(req)

        .then(function(networkRes) {

          if (
            !networkRes ||
            networkRes.status !== 200 ||
            networkRes.type !== "basic"
          ) {

            return networkRes;

          }


          const clone =
            networkRes.clone();


          caches
            .open(CACHE_NAME)
            .then(function(cache) {

              cache.put(
                req,
                clone
              );

            });


          return networkRes;

        })

        .catch(function() {

          return caches
            .match(req)

            .then(function(cacheRes) {

              if (cacheRes) {

                return cacheRes;

              }


              if (
                req.mode ===
                "navigate"
              ) {

                return caches.match(
                  "./index.html"
                );

              }

            });

        })

    );

  }
);
