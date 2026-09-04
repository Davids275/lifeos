/* Service worker do Life OS.
   Guarda os arquivos locais e também as bibliotecas do CDN, então
   depois da PRIMEIRA abertura com internet o app roda offline. */

const CACHE = 'lifeos-v14';
const LOCAIS = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(LOCAIS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  /* Bibliotecas do esm.sh: guarda na primeira vez, depois serve do cache.
     É isso que faz o app abrir sem internet nas próximas vezes. */
  if (req.url.includes('esm.sh')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  /* Arquivos do próprio app: tenta a rede pra pegar atualização,
     cai pro cache se estiver offline. */
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
