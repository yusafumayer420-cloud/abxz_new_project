// Service Worker for PWA installability
// IMPORTANT: Does NOT cache or intercept API/upload requests

const CACHE_NAME = 'cryptosimia-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

// Install: pre-cache only static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER intercept: non-GET requests (uploads, POST, PUT, PATCH, DELETE)
  if (request.method !== 'GET') {
    return; // Let the browser handle it natively
  }

  // NEVER intercept: API calls — always go to network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io')) {
    return; // Let the browser handle it natively
  }

  // NEVER intercept: cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // For static assets: cache-first with network fallback
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(networkResponse => {
          // Only cache successful responses for our static assets
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic' &&
            STATIC_ASSETS.includes(url.pathname)
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
