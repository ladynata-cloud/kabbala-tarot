'use strict';
(() => {
  const node = document.querySelector('#book-module-data');
  if (!node) return;
  const data = JSON.parse(node.textContent);
  const box = document.querySelector('[data-evidence]');
  if (!box || data.lab?.type !== 'evidence') return;
  const selects = [...box.querySelectorAll('[data-evidence-answer]')];
  const result = box.querySelector('[data-evidence-result]');
  box.querySelector('[data-evidence-check]').addEventListener('click', () => {
    let correct = 0;
    selects.forEach((select, index) => {
      const item = data.lab.items[index];
      const out = document.getElementById(select.getAttribute('aria-describedby'));
      const answered = select.value !== '';
      const ok = answered && select.value === item.answer;
      correct += Number(ok);
      select.setAttribute('aria-invalid', String(!ok));
      out.className = ok ? 'sy-correct' : 'sy-retry';
      out.textContent = !answered ? 'Выберите основание.' :
        (ok ? 'Верно. ' : 'Сверьте основание: ' + item.answer + '. ') + item.feedback;
    });
    result.textContent = 'Верно ' + correct + ' из ' + selects.length + '. ' +
      (correct === selects.length ? 'Теперь объясните один переход своими словами в черновике.' : 'Можно исправить выбор и проверить ещё раз.');
  });
  selects.forEach(select => select.addEventListener('change', () => {
    select.removeAttribute('aria-invalid');
    const out = document.getElementById(select.getAttribute('aria-describedby'));
    out.textContent = '';
    out.className = '';
    result.textContent = '';
  }));
})();
