/* Ссылка «Написать автору»: адрес собирается из частей уже в браузере,
   чтобы его не видели простые сборщики адресов в исходном коде страницы. */
(function () {
  'use strict';
  function build() {
    var links = document.querySelectorAll('a[data-contact-user][data-contact-host]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var addr = a.getAttribute('data-contact-user') + '@' + a.getAttribute('data-contact-host');
      a.setAttribute('href', 'mailto:' + addr);
      if (a.getAttribute('data-contact-show') === 'address') a.textContent = addr;
      a.removeAttribute('aria-disabled');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
