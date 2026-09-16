"""Scaffolded close reading and small source-bounded experiments."""
from html import escape as E

def worked(l):
 d=l.get('pedagogy')
 if not d:return ''
 w=d['worked']
 return '<section class="book-worked"><p class="eyebrow">Смотрим, как строится объяснение</p><h2>'+E(w['question'])+'</h2><ol>'+''.join('<li>'+E(s)+'</li>' for s in w['steps'])+'</ol><p class="fine">Теперь закройте этот пример и попробуйте следующий случай самостоятельно.</p></section>'

def hints(l):
 if 'pedagogy' not in l:return ''
 return '<div class="book-hints"><h3>Если понадобилась помощь</h3>'+''.join('<details><summary>Подсказка '+str(i+1)+'</summary><p>'+E(t)+'</p></details>' for i,t in enumerate(l['pedagogy']['hints']))+'</div>'

def rubric(l):
 if 'pedagogy' not in l:return ''
 return '<div class="book-rubric"><h3>Проверьте свой ответ</h3><p>Для каждого пункта найдите фразу в своей записи. Если её нет — дополните ответ. Автоматическая проверка открытого текста не выполняется.</p><ul>'+''.join('<li>'+E(x)+'</li>' for x in l['pedagogy']['rubric'])+'</ul></div>'

def interactive(k):
 def btn(t,a):return '<button type="button" class="button secondary" disabled data-book-enhanced '+a+'>'+E(t)+'</button>'
 if k['type']=='kav':
  return '<figure class="kav-figure"><svg viewBox="0 0 440 310" role="img" aria-labelledby="kav-title kav-desc"><title id="kav-title">Модель связи: ограниченный кав</title><desc id="kav-desc">Окружность условно отмечает границу свободной области; линия идёт от верхней границы и не достигает нижней. Рисунок показывает отношения, а не размеры Эйн Соф.</desc><circle cx="220" cy="156" r="128" fill="#f7f9f5" stroke="#a98a50" stroke-width="4"/><path data-kav-line d="M220 28V231" stroke="#244b54" stroke-width="5"/><path data-kav-bottom d="M220 231V284" stroke="#244b54" stroke-width="5" opacity="0"/><circle cx="220" cy="28" r="6" fill="#244b54"/><text x="240" y="92">Начало</text><text x="240" y="229">Конец</text></svg><figcaption>Граница области условна. Изменяется только способ связи; масштабы и физические расстояния не показаны.</figcaption></figure><div class="sy-actions">'+''.join(btn(t,'data-kav="'+v+'" aria-pressed="'+str(v=='single').lower()+'"') for v,t in [('none','Без линии'),('single','Один связанный конец'),('double','Два связанных конца')])+'</div><p class="sy-output" data-kav-output role="status">Один связанный конец: сохраняются поступление и различие начала и конца.</p>'
 if k['type']=='fives':
  return '<div class="sy-actions">'+''.join(btn(x['title'],'data-five="'+str(i)+'" aria-pressed="false"') for i,x in enumerate(k['cards']))+'</div><div class="book-experiment-output" data-five-output role="status"><p>Выберите пятёрку после собственного предположения.</p></div><details class="sy-solution"><summary>Все четыре описания для сверки</summary>'+''.join('<h3>'+E(x['title'])+'</h3><p>'+E(x['pair']+' · '+x['name'])+'</p><p>'+E(x['image'])+'</p><p>'+E(x['meaning'])+'</p>' for x in k['cards'])+'</details>'
 if k['type']=='dignities':
  choices=[('wands','Жезлы'),('cups','Кубки'),('swords','Мечи'),('pentacles','Пентакли')]
  def select(pos,label):return '<label for="dignity-'+pos+'">'+label+'</label><select id="dignity-'+pos+'" data-dignity-'+pos+' disabled data-book-enhanced>'+''.join('<option value="'+v+'">'+t+'</option>' for v,t in choices)+'</select>'
  return '<div class="dignity-controls">'+select('left','Масть слева')+'<p><strong>В центре: Пятёрка Жезлов</strong></p>'+select('right','Масть справа')+'</div>'+btn('Разобрать соседство','data-dignity-check')+'<p class="sy-output" data-dignity-output role="status">Выберите соседей, сформулируйте ожидание и нажмите кнопку.</p><p class="fine">Числовой балл не вычисляется: источник не задаёт полной шкалы смешанных сочетаний.</p>'
 raise ValueError(k['type'])
