const CACHE_NAME = 'tracking-v10';
const assets = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// Instalación: Guardar archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Activación: Borrar cachés antiguas para que los cambios surtan efecto
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Estrategia: Intentar red, si falla usar caché
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});