/* Регистрирует офлайн-режим (только по https или на localhost) и просит сохранить текущую страницу:
   первая открытая страница загружается раньше, чем service worker начинает перехватывать запросы. */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function () { return navigator.serviceWorker.ready; })
      .then(function (reg) {
        if (!reg.active) return;
        var assets = [];
        try {
          assets = performance.getEntriesByType('resource').map(function (e) { return new URL(e.name); })
            .filter(function (u) { return u.origin === location.origin && u.pathname.indexOf('/assets/') === 0; })
            .map(function (u) { return u.pathname + u.search; });
        } catch (e) {}
        reg.active.postMessage({ type: 'cache-page', url: location.pathname, assets: assets });
      })
      .catch(function () {});
  });
}
