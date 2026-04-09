const CACHE_NAME = 'tracking-v16';

// Lista de archivos y librerías externas necesarias para que todo funcione offline
const assets = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.tailwindcss.com'
];

// 1. Instalación: Guardamos todo en la caché del iPhone
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache v16 abierta');
      return cache.addAll(assets);
    })
  );
});

// 2. Activación: Borramos cualquier versión antigua (v15, v14, etc.) 
// Esto es lo que "desbloquea" los botones y el mapa cuando subes código nuevo.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
});

// 3. Estrategia de carga: Intentar siempre descargar lo más nuevo de internet,
// pero si falla (túneles, mala cobertura en Abegondo), usar lo que hay en caché.
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});