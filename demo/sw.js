const PREFIX = "gym-logger-demo-";
const CACHE = "gym-logger-demo-5c1bb8405511";
const FILES = ["./","assets/i18n-B6eDQwTA.js","assets/main-D-wejDL7.js","assets/main-DSUFcY13.css","assets/poster-BYWHqoMS.js","assets/poster-Csqn7Sxn.css","icon.png","manifest.webmanifest","poster.html"];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  // Pages (the app, the poster) come from their own cached copy; an uncached page falls back
  // to the app shell only when the network is unavailable.
  const navigate = request.mode === 'navigate';
  event.respondWith(
    caches.match(request, { ignoreSearch: navigate }).then(
      (cached) =>
        cached ||
        fetch(request).catch((error) =>
          navigate ? caches.match('./').then((shell) => shell || Promise.reject(error)) : Promise.reject(error)
        )
    )
  );
});
