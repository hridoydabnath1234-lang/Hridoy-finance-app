const CACHE_NAME = "my-finance-app-v10.1.2";

const FILES_TO_CACHE = [
  "./",
  "./index.html"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  // HTML/page request হলে আগে নতুন version আনার চেষ্টা করবে
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(function (networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(function () {
          return caches.match(event.request)
            .then(function (cachedResponse) {
              return cachedResponse || caches.match("./index.html");
            });
        })
    );

    return;
  }

  // অন্যান্য GET request
  event.respondWith(
    caches.match(event.request)
      .then(function (cachedResponse) {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(function (networkResponse) {
            if (
              networkResponse &&
              networkResponse.status === 200
            ) {
              const responseClone = networkResponse.clone();

              caches.open(CACHE_NAME).then(function (cache) {
                cache.put(event.request, responseClone);
              });
            }

            return networkResponse;
          })
          .catch(function () {
            return caches.match("./index.html");
          });
      })
  );
});