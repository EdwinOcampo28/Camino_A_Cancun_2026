const CACHE_NAME = "cancun-app-v1";

const ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.json"
];

self.addEventListener("install", event => {

  console.log("✅ Service Worker instalado");

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS);
      })
  );

});

self.addEventListener("activate", event => {

  console.log("🚀 Service Worker activo");

  event.waitUntil(
    caches.keys().then(keys => {

      return Promise.all(
        keys.map(key => {
          if(key !== CACHE_NAME){
            return caches.delete(key);
          }
        })
      );

    })
  );

});

self.addEventListener("fetch", event => {

  event.respondWith(

    caches.match(event.request)
      .then(response => {

        if(response){
          return response;
        }

        return fetch(event.request);

      })

  );

});