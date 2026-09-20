/* Каббала и Таро — офлайн-режим (опционально).
   Страницы: сначала сеть, при её отсутствии — сохранённая копия.
   Оформление, шрифты, эмблемы, карты: из кэша, с тихим обновлением в фоне.
   Чтобы выключить офлайн-режим, замените этот файл содержимым tools/design/sw-remove.js
   (sw.js пишет tools/design.py из tools/design/sw.template.js; VERSION меняется вместе с файлами оболочки). */
const VERSION = 'kt-2026-09-19';
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;
const MEDIA = `${VERSION}-media`;
const MAX_PAGES = 120;
const MAX_MEDIA = 400;

const PRECACHE = [
  '/', '/course/', '/course/tarot/', '/course/tarot/deck/', '/course/notebook/',
  '/assets/course/course.css', '/assets/course/state.js', '/assets/course/app.js', '/assets/course/extensions.js',
  '/assets/course/tarot-view.js', '/assets/course/labs.js',
  '/assets/fonts/Cormorant-400-normal.woff', '/assets/fonts/Cormorant-400-italic.woff', '/assets/fonts/Golos-400-normal.woff',
  '/assets/emblems/emblems.svg', '/assets/icons/icon-192.png', '/site.webmanifest',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (!key.startsWith(VERSION)) await caches.delete(key);
    await self.clients.claim();
  })());
});

async function trim(cacheName, max) {
  const c = await caches.open(cacheName);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) { cache.put(request, fresh.clone()); trim(PAGES, MAX_PAGES); }
    return fresh;
  } catch {
    // Offline, a page opened with a query tail (?selftest=1, ?__errs=1, utm…) is the same document as the
    // saved copy, so the navigation is matched without the query string.
    const same = { ignoreSearch: true };
    return (await cache.match(request, same)) || (await caches.match(request, same)) ||
      new Response('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Нет сети — Каббала и Таро</title>' +
        '<body style="margin:0;background:#fcfcfa;color:#122e3b;font:17px/1.75 Georgia,serif"><main style="max-width:34em;margin:14vh auto 0;padding:0 24px">' +
        '<p style="font:600 11px/1.6 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#526c78;margin:0 0 10px">Нет подключения</p>' +
        '<h1 style="font:400 38px/1.1 Georgia,serif;margin:0 0 18px">Эта страница ещё не сохранена <em style="color:#987438">на устройстве</em></h1>' +
        '<p>Уроки и страницы, которые Вы уже открывали, доступны и без сети. Когда подключение появится, эта страница откроется сама — достаточно обновить её.</p>' +
        '<p style="margin-top:26px"><a href="/course/" style="display:inline-block;padding:13px 20px;border-radius:3px;background:#122e3b;color:#fff;text-decoration:none;font:14px system-ui,sans-serif">Открыть курс</a> ' +
        '<a href="" style="margin-left:14px;color:#122e3b;font:14px system-ui,sans-serif">Попробовать снова</a></p></main></body></html>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
}

async function staleWhileRevalidate(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const update = fetch(request).then(r => { if (r.ok) { cache.put(request, r.clone()); if (max) trim(cacheName, max); } return r; }).catch(() => null);
  return cached || (await update) || Response.error();
}

// The very first page a visitor opens loads before the worker takes control, so the page asks to be
// remembered once the worker is ready (see sw-register.js).
self.addEventListener('message', event => {
  const d = event.data;
  if (d && d.type === 'cache-page' && typeof d.url === 'string' && d.url.startsWith('/')) {
    // …together with the images, styles and scripts that page already loaded (they came before the worker, too).
    const assets = (Array.isArray(d.assets) ? d.assets : []).filter(u => typeof u === 'string' && u.startsWith('/assets/')).slice(0, 80);
    const isMedia = u => u.startsWith('/assets/tarot/') || u.startsWith('/assets/img/');
    const put = (name, list) => list.length ? caches.open(name).then(c => Promise.all(list.map(u => c.match(u).then(hit => hit || c.add(u)).catch(() => {})))) : Promise.resolve();
    event.waitUntil(Promise.all([
      caches.open(PAGES).then(c => c.add(d.url).catch(() => {})).then(() => trim(PAGES, MAX_PAGES)),
      put(MEDIA, assets.filter(isMedia)).then(() => trim(MEDIA, MAX_MEDIA)),
      put(SHELL, assets.filter(u => !isMedia(u))),
    ]));
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') { event.respondWith(networkFirst(request)); return; }
  if (url.pathname.startsWith('/assets/tarot/') || url.pathname.startsWith('/assets/img/')) { event.respondWith(staleWhileRevalidate(request, MEDIA, MAX_MEDIA)); return; }
  if (url.pathname.startsWith('/assets/') || url.pathname === '/site.webmanifest') { event.respondWith(staleWhileRevalidate(request, SHELL)); }
});
