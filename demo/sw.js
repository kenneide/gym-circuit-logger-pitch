const BUILD_ID = "bb4102e6-e3a6-40ba-b68f-6c6e65c01bd6";
const PREFIX = "gym-logger-demo-";
const CACHE = "gym-logger-demo-1f9fee2b5f8e";
const FILES = ["./","assets/i18n-pGmWG4KM.js","assets/main-AFGkr9u9.js","assets/main-D3mIL1NU.css","assets/poster-DRz_Rifp.css","assets/poster-a2eqMRfP.js","font-license.txt","icon.png","manifest.webmanifest","poster.html","scan.html"];
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
