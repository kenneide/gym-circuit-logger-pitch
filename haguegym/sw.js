const BUILD_ID = "9b3cbdd3-3215-40fc-800f-bfd3c27d5780";
const PREFIX = "gym-logger-haguegym-";
const CACHE = "gym-logger-haguegym-fe4a94ae9074";
const FILES = ["./","assets/i18n-BhwA5F1f.js","assets/main-CLMZSs0V.js","assets/main-CssNx1Bj.css","assets/poster-Csqn7Sxn.css","assets/poster-DPZv4uwx.js","icon.png","manifest.webmanifest","poster.html"];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(FILES.map(async (file) => {
    const url = new URL(file, self.registration.scope);
    url.searchParams.set('app-build', BUILD_ID);
    const response = await fetch(new Request(url, { cache: 'reload' }));
    if (!response.ok) throw new Error('Incomplete application download');
    if (file === './' && !(await response.clone().text()).includes('content="' + BUILD_ID + '"'))
      throw new Error('Application deployment is not ready');
    await cache.put(file, response);
  }))));
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_BUILD') event.ports[0]?.postMessage({ buildId: BUILD_ID });
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(PREFIX) && /^[a-f0-9]{12}$/.test(key.slice(PREFIX.length)) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  const url = new URL(request.url);
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }
  // Pages (the app, the poster) come from their own cached copy; an uncached page falls back
  // to the app shell only when the network is unavailable.
  const navigate = request.mode === 'navigate';
  event.respondWith(
    caches.open(CACHE).then((cache) => cache.match(request, { ignoreSearch: navigate })).then(
      (cached) =>
        cached ||
        fetch(request).catch((error) =>
          navigate ? caches.open(CACHE).then((cache) => cache.match('./')).then((shell) => shell || Promise.reject(error)) : Promise.reject(error)
        )
    )
  );
});
