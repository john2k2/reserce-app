// Nombre y versión de la caché
const CACHE_NAME = 'queuemaster-cache-v1';

// Recursos a pre-cachear durante la instalación
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/favicon.svg',
  '/fonts/inter-var.woff2'
];

// Recursos que se cachearán en uso
const RUNTIME_RESOURCES = [
  '/api/',
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.gif',
  '.json',
  '.woff',
  '.woff2'
];

// Instalar el Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Pre-caching recursos importantes');
        return cache.addAll(PRECACHE_RESOURCES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar el Service Worker
self.addEventListener('activate', (event) => {
  // Eliminar caches antiguas
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          console.log('Eliminando caché antigua:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de caché para recursos estáticos: Cache First, luego red
const cacheFirstStrategy = (request) => {
  return caches.match(request)
    .then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request)
        .then((networkResponse) => {
          // Verificar si el recurso debe ser cacheado
          const shouldCache = RUNTIME_RESOURCES.some(resource => 
            request.url.includes(resource) || 
            resource.startsWith('.') && request.url.endsWith(resource)
          );
          
          if (shouldCache && networkResponse.ok) {
            const clonedResponse = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, clonedResponse));
          }
          
          return networkResponse;
        })
        .catch(() => {
          // Si no hay conexión y es una solicitud de imagen, devolver imagen de fallback
          if (request.destination === 'image') {
            return caches.match('/images/fallback.png');
          }
          
          // Para otros recursos, devolver una respuesta de error
          return new Response('Error de conexión', { status: 503 });
        });
    });
};

// Estrategia para la API: Network First con tiempo límite, luego caché
const networkFirstWithTimeout = async (request) => {
  const timeoutDuration = 3000; // 3 segundos
  
  // Intentar recuperar de la red primero, con un tiempo límite
  const networkPromise = fetch(request.clone())
    .then((networkResponse) => {
      // Cachear la respuesta de la API solo si fue exitosa
      if (networkResponse.ok) {
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(request, clonedResponse));
      }
      
      return networkResponse;
    });
  
  // Promesa para el tiempo límite
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Tiempo de espera agotado')), timeoutDuration);
  });
  
  try {
    // Race entre la red y el tiempo límite
    return await Promise.race([networkPromise, timeoutPromise]);
  } catch (error) {
    console.log('Usando caché para la API debido a:', error.message);
    
    // Si la red falla o tarda demasiado, intentar desde caché
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si no hay caché, devolver un error amigable
    return new Response(JSON.stringify({
      error: 'No se pudieron cargar los datos',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Interceptar solicitudes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // No interceptar solicitudes de navegación o Chrome extensions
  if (event.request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/'))
    );
    return;
  }
  
  // Para solicitudes a la API, usar network-first con tiempo límite
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithTimeout(event.request));
    return;
  }
  
  // Para el resto, usar cache-first
  event.respondWith(cacheFirstStrategy(event.request));
});

// Background sync para operaciones que fallan cuando estás offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reservations') {
    event.waitUntil(syncReservations());
  }
});

// Función para sincronizar reservas pendientes
async function syncReservations() {
  try {
    const db = await openDatabase();
    const pendingReservations = await db.getAll('pendingReservations');
    
    for (const reservation of pendingReservations) {
      try {
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reservation)
        });
        
        if (response.ok) {
          await db.delete('pendingReservations', reservation.id);
        }
      } catch (error) {
        console.error('Error syncing reservation:', error);
      }
    }
  } catch (error) {
    console.error('Error accessing IndexedDB:', error);
  }
}

// Función para abrir la base de datos IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('QueueMasterDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('pendingReservations', { keyPath: 'id' });
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
} 