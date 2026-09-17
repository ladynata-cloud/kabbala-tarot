'use strict';
(() => {
  const node = document.querySelector('#book-module-data');
  const root = document.querySelector('[data-book-audit]');
  if (!node || !root) return;
  const lab = JSON.parse(node.textContent).lab;
  if (lab?.type !== 'audit') return;
  const groups = [...root.querySelectorAll('[data-audit-step]')];
  const result = root.querySelector('[data-audit-result]');
  root.querySelector('[data-audit-check]').addEventListener('click', () => {
    let correct = 0;
    let answered = 0;
    groups.forEach((group, i) => {
      const choice = group.querySelector('input:checked');
      const out = group.querySelector('[role="status"]');
      const option = choice && lab.steps[i].options[Number(choice.value)];
      const ok = !!choice && Number(choice.value) === lab.steps[i].answer;
      answered += Number(!!choice);
      correct += Number(ok);
      group.setAttribute('aria-invalid', String(!ok));
      out.className = ok ? 'sy-correct' : 'sy-retry';
      out.textContent = !option ? 'Выберите решение для этого шага.' :
        (ok ? 'Верно. ' : 'Проверьте переход. ') + option.feedback;
    });
    result.textContent = answered < groups.length
      ? 'Выбрано ' + answered + ' из ' + groups.length + '. Завершите все три шага; уже выбранные решения проверены.'
      : 'Верно ' + correct + ' из ' + groups.length + '. ' + (correct === groups.length
        ? 'Теперь восстановите довод своими словами и разберите новый случай ниже.'
        : 'Прочитайте пояснения и исправьте нужный шаг. Верный вывод требует верного основания.');
  });
  groups.forEach(group => group.addEventListener('change', () => {
    group.removeAttribute('aria-invalid');
    const out = group.querySelector('[role="status"]');
    out.textContent = '';
    out.className = '';
    result.textContent = '';
  }));
})();
