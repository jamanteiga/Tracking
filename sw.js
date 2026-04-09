const CACHE_NAME = 'tracking-v18';

// Lista de recursos críticos para que la App funcione siempre (incluso sin cobertura)
const assets = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.tailwindcss.com'
];

// 1. INSTALACIÓN: Se ejecuta cuando abres la web tras subir cambios
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Instalando nueva caché: ' + CACHE_NAME);
      return cache.addAll(assets);
    })
  );
  // Fuerza a la nueva versión a tomar el control inmediatamente
  self.skipWaiting();
});

// 2. ACTIVACIÓN: Borra las cachés viejas (v17, v16...) para liberar espacio y evitar errores
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  // Permite que la PWA se actualice en todas las pestañas abiertas
  self.clients.claim();
});

// 3. ESTRATEGIA DE CARGA (Network First): 
// Intenta descargar los mapas y el código más reciente de internet.
// Si no hay internet (zona de montaña), usa lo que guardamos en la instalación.
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});