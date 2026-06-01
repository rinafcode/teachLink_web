const CACHE_NAME = 'teachlink-cache-v1';
const OFFLINE_URL = '/offline.html';

const URLS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

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

// PUSH NOTIFICATION HANDLER - Tracks DELIVERED events
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  let data = { title: 'TeachLink', body: 'New notification' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'New Update', body: event.data.text() };
    }
  }
  
  const notificationId = data.id || `notif_${Date.now()}`;
  
  fetch('/api/notifications/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notificationId: notificationId,
      event: 'delivered',
      userId: data.userId || 'anonymous',
      timestamp: new Date().toISOString(),
      message: data.body,
      title: data.title
    })
  }).catch(err => console.error('[Push] Delivery tracking failed:', err));
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'TeachLink', {
      body: data.body || 'New notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        url: data.url || '/',
        notificationId: notificationId,
        userId: data.userId || 'anonymous'
      }
    })
  );
});

// NOTIFICATION CLICK HANDLER - Tracks CLICKED events
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');
  event.notification.close();
  
  const notificationId = event.notification.data?.notificationId || 'unknown';
  const userId = event.notification.data?.userId || 'anonymous';
  
  fetch('/api/notifications/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notificationId: notificationId,
      event: 'clicked',
      userId: userId,
      timestamp: new Date().toISOString()
    })
  }).catch(err => console.error('[Push] Click tracking failed:', err));
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          }).catch(err => console.error('Cache put error:', err));
        }
        return response;
      })
      .catch(async () => {
        console.log('[ServiceWorker] Fetch failed; returning offline page');
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        return cachedResponse || cache.match(OFFLINE_URL);
      })
  );
});