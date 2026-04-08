const CACHE_NAME = 'tracking-v2'; // Cambiado a v2 para forzar actualización
const assets = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// Instalación y almacenamiento en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache Tracking v2 abierta');
      return cache.addAll(assets);
    })
  );
});

// Estrategia: Network First (Intenta red, si falla usa caché)
// Ideal para cuando pasas por zonas de poca cobertura en Cabanas
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Limpieza de cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                  .map(name => caches.delete(name))
      );
    })
  );
});