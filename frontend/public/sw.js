const CACHE_NAME = 'popcorn-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.png'
];

// Install Event - Caching the app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first fallback to cache
self.addEventListener('fetch', (e) => {
  // Only handle GET requests, skip external APIs, hot reloads, and third party resources
  if (
    e.request.method !== 'GET' || 
    e.request.url.includes('/api/') ||
    e.request.url.includes('chrome-extension') ||
    e.request.url.includes('localhost') && e.request.url.includes('@vite')
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If response is invalid or not ok, just return it
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache the newly fetched asset
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // If offline, serve from cache
        return caches.match(e.request);
      })
  );
});
