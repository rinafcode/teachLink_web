const CACHE_NAME = 'teachlink-cache-v1';
const OFFLINE_URL = '/offline.html';

// Core assets to cache immediately upon service worker installation
const URLS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('teachlink-cache-')) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, falling back to cache strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for navigation and assets
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful network responses dynamically for future offline use
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(async () => {
        console.log('[ServiceWorker] Fetch failed; returning offline page instead.', event.request.url);
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        // Return cached response if available, otherwise return the fallback offline page
        return cachedResponse || cache.match(OFFLINE_URL);
      })
  );
});