const CACHE_NAME = 'cancun-retro-v17-planner-pair';
const ASSETS = [
  './', './index.html', './manifest.json',   './css/base.css', './css/layout.css', './css/components.css', './css/animations.css', './css/responsive.css', './css/progress-redesign.css', './css/plan-enhancements.css', './css/planning-pair.css',
  './js/config.js', './js/storage.js', './js/utils.js', './js/state.js', './js/ui.js', './js/charts.js', './js/effects.js', './js/app.js', './js/app.bundle.js',
  './img/fondo.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (!response || response.status !== 200 || response.type === 'opaque') return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => cached))
  );
});
