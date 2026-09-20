/* Выключение офлайн-режима: положите этот файл на место sw.js.
   При следующем визите он удалит сохранённые копии и снимет себя с регистрации. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
  })());
});
