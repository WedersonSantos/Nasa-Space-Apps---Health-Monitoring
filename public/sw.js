// Service worker mínimo: rede primeiro, cache como reserva.
// Sem link com a Terra (ou sem internet), o app continua abrindo a partir do cache local.
const CACHE = 'vigilia-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch (error) {
        const cached = (await cache.match(request)) || (await cache.match('/'));
        if (cached) return cached;
        throw error;
      }
    }),
  );
});
