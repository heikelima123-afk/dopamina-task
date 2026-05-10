const CACHE_NAME = 'dopamina-v1';
const urlsToCache = [
  '/dopamina-task/',
  '/dopamina-task/dopamina-task.html',
  '/dopamina-task/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.log('Cache addAll error:', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        return caches.match(event.request);
      });
    })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    const response = await fetch('/dopamina-task/');
    return response.ok;
  } catch (error) {
    console.log('Sync failed:', error);
  }
}

self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação Dopamina Task',
    icon: '/dopamina-task/icon-192x192.png',
    badge: '/dopamina-task/icon-192x192.png',
    tag: 'dopamina-notification'
  };

  event.waitUntil(
    self.registration.showNotification('Dopamina Task', options)
  );
});
