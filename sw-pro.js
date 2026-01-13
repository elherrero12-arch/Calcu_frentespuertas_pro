// Service Worker para Calculadora Chapas PRO
const CACHE_NAME = 'calcchapas-pro-v2.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// INSTALAR
self.addEventListener('install', event => {
  console.log('🛠️ Service Worker PRO instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Todos los recursos cacheados');
        return self.skipWaiting();
      })
  );
});

// ACTIVAR
self.addEventListener('activate', event => {
  console.log('⚡ Service Worker PRO activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Eliminando cache viejo: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker listo para controlar clientes');
      return self.clients.claim();
    })
  );
});

// FETCH - Estrategia Cache First, luego Network
self.addEventListener('fetch', event => {
  // Ignorar solicitudes que no son GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar solicitudes de Chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en cache, devolverlo
        if (response) {
          console.log(`📦 Cache hit: ${event.request.url}`);
          return response;
        }
        
        // Si no está en cache, buscar en red
        console.log(`🌐 Fetching from network: ${event.request.url}`);
        return fetch(event.request)
          .then(response => {
            // Verificar respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar respuesta para cache y uso
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log(`💾 Guardado en cache: ${event.request.url}`);
              });
            
            return response;
          })
          .catch(error => {
            console.log('❌ Error de red:', error);
            // Podrías devolver una página offline aquí
            return new Response('Modo offline - La app seguirá funcionando', {
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// MENSAJES (para actualizaciones)
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});