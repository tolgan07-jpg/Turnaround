// Turnaround Log - cevrimdisi onbellek
// Internet varsa her zaman guncel dosyayi alir, yoksa (veya baglanti cok yavassa) kayitli kopyayi acar.
const CACHE = 'turnaround-v3';
const TIMEOUT_MS = 3000;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(['./', 'index.html']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    new Promise((resolve) => {
      const fromCache = () =>
        caches.match(e.request).then((r) => r || caches.match('index.html'));
      const timer = setTimeout(() => fromCache().then((r) => r && resolve(r)), TIMEOUT_MS);
      fetch(e.request)
        .then((res) => {
          clearTimeout(timer);
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          resolve(res);
        })
        .catch(() => {
          clearTimeout(timer);
          fromCache().then((r) => resolve(r || Response.error()));
        });
    })
  );
});
