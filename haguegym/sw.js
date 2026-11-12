const BUILD_ID = "5a5457b7-895d-4f2b-b769-2826049769de";
const PREFIX = "gym-logger-haguegym-";
const CACHE = "gym-logger-haguegym-da6e9ea1b585";
const FILES = ["./","assets/i18n-CL9V5gj2.js","assets/main-BAtA2AFX.css","assets/main-DOIqH0IJ.js","assets/poster-C80KWx7v.js","assets/poster-DJwdJKLZ.css","icon.png","manifest.webmanifest","poster.html","scan.html"];
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
