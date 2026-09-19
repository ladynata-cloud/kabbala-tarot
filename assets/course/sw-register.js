/* Регистрирует офлайн-режим (только по https или на localhost) и просит сохранить текущую страницу:
   первая открытая страница загружается раньше, чем service worker начинает перехватывать запросы. */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function () { return navigator.serviceWorker.ready; })
      .then(function (reg) { if (reg.active) reg.active.postMessage({ type: 'cache-page', url: location.pathname }); })
      .catch(function () {});
  });
}
