/* Service worker da Calculadora MRS.
   Guarda o app no aparelho para funcionar sem internet.
   Ao publicar uma versão nova, troque o número do CACHE abaixo. */
const CACHE = 'mrs-calc-v17';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  /* nunca guarda em cache chamadas ao RD Station */
  if (req.url.indexOf('rdstation') > -1 || req.url.indexOf('rd.services') > -1) return;
  /* o vídeo é grande e é tocado em pedaços: vai sempre direto para a internet */
  if (req.url.indexOf('.mp4') > -1) return;
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(resp => {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copia));
      }
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
