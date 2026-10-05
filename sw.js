// Service Worker — TPQ Bani Saleh Cicadas
const CACHE_NAME = 'tpq-bani-saleh-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install: cache assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        console.warn('[SW] Partial cache fail:', err);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: hapus cache lama
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
          .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: cache-first untuk assets, network-first untuk API
self.addEventListener('fetch', function(e) {
  const url = e.request.url;

  // Jangan cache request ke Google Apps Script (API)
  if (url.indexOf('script.google.com') !== -1 || url.indexOf('script.googleusercontent.com') !== -1) {
    return; // biarkan browser handle langsung
  }

  // Jangan cache request non-GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) {
        // Update cache di background
        fetch(e.request).then(function(res) {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then(function(c) { c.put(e.request, res.clone()); });
          }
        }).catch(function() {});
        return cached;
      }
      return fetch(e.request).then(function(res) {
        if (res && res.status === 200 && res.type === 'basic') {
          const cloned = res.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, cloned); });
        }
        return res;
      }).catch(function() {
        // Fallback offline
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});