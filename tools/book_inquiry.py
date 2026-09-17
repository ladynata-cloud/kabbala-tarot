"""Small exercises with explicit source operations and fading support."""
from html import escape as E

def button(text,attrs=''):
 return '<button type="button" class="button secondary" disabled data-book-enhanced '+attrs+'>'+E(text)+'</button>'

def interactive(k):
 if k['type']=='arithmetic':
  return '<div class="inquiry-controls"><label for="papus-number">Положительное целое число от 1 до 9999</label><input id="papus-number" type="number" inputmode="numeric" min="1" max="9999" step="1" value="4" disabled data-book-enhanced aria-describedby="papus-arithmetic-output">'+button('Сравнить две операции','data-papus-calculate')+'</div><div id="papus-arithmetic-output" class="sy-output" data-papus-arithmetic role="status">Сначала запишите два ожидаемых результата.</div><p class="fine">Сокращение числа и сокращение суммы 1…n — разные последовательности. Для авторской цепочки 13 → 4 → 10 → 1 дополнительно назовите смену операций.</p>'
 if k['type']=='frames':
  return '<div class="inquiry-controls"><label for="papus-group">Группа отсчёта</label><select id="papus-group" disabled data-book-enhanced><option value="1">1–2–3–4</option><option value="4">4–5–6–7</option><option value="7">7–8–9–10</option></select><label for="papus-member">Число внутри группы</label><select id="papus-member" disabled data-book-enhanced><option>1</option><option>2</option><option>3</option><option selected>4</option></select>'+button('Показать роль в этой группе','data-papus-frame-check')+'</div><p class="sy-output" data-papus-frame-output role="status">Предскажите роль четвёрки в выбранной группе, затем проверьте.</p><details class="sy-solution"><summary>Группы для чтения без тренажёра</summary><p>В каждой группе позиции имеют функции: Йод — первое Хе — Вав — второе Хе. Группы: 1–2–3–4; 4–5–6–7; 7–8–9–10. Четвёрка и семёрка имеют разные роли относительно двух соседних групп.</p></details>'
 if k['type']=='argument':
  static=''.join('<h4>'+E(s['title'])+'</h4><p>'+E(s['premise']+' '+s['prompt'])+'</p><ul>'+''.join('<li>'+E(o['text']+' '+o['feedback'])+'</li>' for o in s['options'])+'</ul>' for s in k['stages'])
  return '<div class="argument-stage" data-argument-stage></div><p class="sy-output" data-argument-feedback role="status">Выберите недостающий переход.</p><div class="sy-actions">'+button('Следующий переход','data-argument-next')+button('Начать заново','data-argument-reset')+'</div><details class="sy-solution"><summary>Все переходы с пояснениями для сверки</summary>'+static+'</details>'
 raise ValueError(k['type'])
