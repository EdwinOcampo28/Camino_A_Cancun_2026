const CACHE_NAME = "cancun-app-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];


// INSTALL
self.addEventListener("install", event => {

  console.log("✅ Service Worker instalado");

  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );

});


// ACTIVATE
self.addEventListener("activate", event => {

  console.log("🚀 Service Worker activo");

  event.waitUntil(

    caches.keys().then(keys => {

      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );

    })

  );

  return self.clients.claim();

});


// FETCH
self.addEventListener("fetch", event => {

  if(event.request.method !== "GET") return;

  event.respondWith(

    caches.match(event.request).then(cached => {

      const networkFetch = fetch(event.request)
        .then(response => {

          if(!response || response.status !== 200) return response;

          const clone = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone));

          return response;

        })
        .catch(() => cached);

      return cached || networkFetch;

    })

  );

});