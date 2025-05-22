const CACHE_NAME = "quizer-cache-v1";
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error("Cache install failed:", err))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Try cache first, then network
      return cachedResponse || fetch(event.request);
    }).catch(error => {
      console.error("Fetch failed; returning offline fallback if available:", error);

      // Optional: return a fallback page for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html'); // fallback to main page
      }
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});
