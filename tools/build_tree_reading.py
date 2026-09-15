"""Source-led advanced module; shares the spread lab, with an isolated notebook."""
from pathlib import Path
from html import escape as E
import json
import build_spread_grammar as shared

ROOT=Path(__file__).resolve().parents[1]
BASE='/course/tree-reading/'
D=json.loads((ROOT/'content/tree-reading.json').read_text())
N=len(D['lessons'])
SEFIROT=['Кетер','Хохма','Бина','Хесед','Гвура','Тиферет','Нецах','Ход','Йесод','Малхут']
def p(t):return '<p>'+E(t)+'</p>'
def progress():return f'<div class="sg-progress"><progress value="0" max="{N}" aria-label="Прогресс модуля" data-sg-progress></progress><span data-sg-count>Отмечено 0 из {N} занятий</span></div>'
def payload(l=None):
    data={'app':D['app'],'title':D['title'],'layoutIds':D['layoutIds'],'lessons':[{k:x[k] for k in ['id','slug','title','default']} for x in D['lessons']],'current':l['id'] if l else 0,'quiz':l['quiz'] if l else []}
    return '<script id="spread-grammar-data" type="application/json">'+json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+'</script>'
def sources(l=None):
    out='<section id="sources" class="sg-section sg-sources"><h2>Источники и границы метода</h2>'
    if l:out+=p(l['bridge'])
    for key in l['refs'] if l else D['sources']:
        x=D['sources'][key];out+='<p><a href="'+E(x['url'],quote=True)+'" target="_blank" rel="noopener noreferrer">'+E(x['title'])+'</a><br>'+E(x['detail'])+'</p>'
    return out+p('Русские пояснения, современные ситуации, вопросы позиций и примеры написаны для курса. Соответствия Таро выбраны по герметической линии Golden Dawn; изображения — Уэйта–Смит. Для придворных используется адаптация Король / Королева / Рыцарь / Паж = Огонь / Вода / Воздух / Земля внутри масти. Она не подменяет названия придворных в других колодах. Номер Старшего аркана не равен номеру сефиры.')+'</section>'
def reading(l):
    x=l['reading'];out='<section id="reading" class="tr-reading sg-section"><p class="eyebrow">Сначала источник</p><h2>'+E(x['title'])+'</h2>'
    if x['original']:out+='<p class="tr-original" lang="'+('arc' if 'Тиккуней' in x['title'] else 'he')+'" dir="rtl">'+E(x['original'])+'</p>'
    out+='<p class="tr-translation">'+E(x['translation'])+'</p>'+p(x['context'])+'<p><a href="'+E(x['url'],quote=True)+'" target="_blank" rel="noopener noreferrer">Открыть указанное место →</a></p><p class="tr-question"><strong>Вопрос к тексту.</strong> '+E(x['question'])+'</p></section>'
    return out
def matrix():
    out='<section class="sg-section"><h2>Сефира × мир: сорок числовых карт</h2><p>Герметическая таблица выбранной системы. Каждая строка — один ранг в четырёх мастях. Она не распространяет номера сефирот на Старшие арканы. Кнопка ранга в лаборатории ниже позволяет сравнить четыре изображения.</p><div class="tr-table-wrap" tabindex="0" role="region" aria-label="Таблица сефирот и миров, прокручивается по горизонтали"><table class="tr-matrix"><caption>Ранг и сефира / масть и мир</caption><thead><tr><th scope="col">Ранг · сефира</th>'
    for x in ['Жезлы · Ацилут','Кубки · Брия','Мечи · Йецира','Пентакли · Асия']:out+='<th scope="col">'+x+'</th>'
    out+='</tr></thead><tbody>'
    for i,name in enumerate(SEFIROT,1):
        out+=f'<tr><th scope="row">{i} · {name}</th>'
        for suit in ['w','c','s','p']:out+='<td>'+E(shared.BY_ID[suit+str(i)]['name'])+'</td>'
        out+='</tr>'
    return out+'</tbody></table></div></section>'
def lab(l):
    out=shared.lab(l)
    panel='''<section id="sg-tree-panel" class="tr-tree-panel" hidden><h3>Ориентир десяти позиций</h3><p>Справа на схеме — Хохма, Хесед, Нецах; слева — Бина, Гвура, Ход. Это выбранная ориентация изображения Древа. Буквенные пути не нанесены. Нажмите название, чтобы перейти к карте; список ниже следует номерам сефирот.</p><div class="tr-columns" aria-hidden="true"><span>Левый столп</span><span>Средний столп</span><span>Правый столп</span></div><nav id="sg-tree-map" class="tr-tree-map" aria-label="Карты в десяти позициях Древа"></nav><label class="sg-field">Как рассмотреть группы<select id="sg-tree-mode"><option value="triads">Три группы и Малхут</option><option value="pillars">Три столпа</option><option value="whole">Все десять вместе</option></select></label><p class="fine">Переключатель меняет вид связей для сравнения в одном разборе. Запишите оба наблюдения в поле основания. Отдельные карты и роли остаются прежними.</p></section>'''
    out=out.replace('<div id="sg-cards" class="sg-card-grid"></div>',panel+'<div id="sg-cards" class="sg-card-grid"></div>')
    out=out.replace('На какие детали, соответствия и источники я опираюсь','Основание: текст источника / соответствие / моя гипотеза')
    return out
def notebook(page,crumbs):
    b=crumbs('../../../','Тетрадь чтения Древа')+'<div class="sg-module tr-module"><header class="sg-hero"><p class="eyebrow">Отдельная тетрадь модуля</p><h1>Мои чтения Древа</h1><p class="lead">Варианты раскладов, источники Ваших объяснений, зафиксированные гипотезы и последующие наблюдения.</p>'+progress()+'<p>Записи остаются в этом браузере на этом устройстве. Автор курса их не получает. Скачайте JSON для резервной копии и переноса; TXT подходит для чтения.</p>'+shared.notes_controls()+'<p id="sg-save-status" role="status"></p><p><a href="../">Вернуться к программе →</a></p></header><section class="sg-section"><h2>Мои варианты</h2><label class="sg-field">Найти карту, вопрос или текст<input type="search" id="sg-search" disabled data-sg-enable></label><div id="sg-notes"></div><button type="button" class="button secondary" id="sg-more" hidden>Показать ещё</button></section><section id="observations" class="sg-section"><h2>Сохранённые разборы и возвращения</h2><p>Исходный снимок остаётся прежним. Новые факты и понимание добавляются отдельной записью с датой.</p><div id="sg-snapshots"></div><button type="button" class="button secondary" id="sg-snap-more" hidden>Показать ещё снимки</button></section><noscript><p>Для личных записей и переноса тетради включите JavaScript.</p></noscript></div>'+payload()
    page(BASE+'notebook/','Мои чтения Древа — тетрадь','Личная тетрадь модуля о Древе сефирот: разборы и наблюдения.',b,noindex=True)
def build(page,crumbs):
    assert N==8 and [l['id'] for l in D['lessons']]==list(range(1,N+1))
    assert len({l['slug'] for l in D['lessons']})==N
    for l in D['lessons']:
        assert len(l['quiz'])==2 and all(0<=q['answer']<len(q['options']) for q in l['quiz'])
        assert len(l['default']['ids'])==len(set(l['default']['ids'])) and set(l['default']['ids'])<=set(shared.BY_ID)
        assert set(l['refs'])<=set(D['sources']) and l['default']['layout'] in D['layoutIds']
    b=crumbs('../../','Чтение Древа')+'<div class="sg-module tr-module"><header class="sg-hero"><p class="eyebrow">Следующая ступень · 8 занятий · 16 вопросов</p><h1>'+E(D['title'])+'</h1><p class="sg-subtitle">'+E(D['subtitle'])+'</p><p class="lead">'+E(D['lead'])+'</p><div class="sg-actions"><a class="button" href="source-and-analogy/">Начать с источника →</a><a class="button secondary" href="#program">Восемь занятий</a><a href="notebook/">Моя тетрадь</a></div>'+progress()+'</header><section class="sg-section sg-intro"><div><h2>Что меняется в чтении</h2><p>После <a href="../spread-grammar/">модуля о четвёрках</a> переходим к двум определённым сефиротическим триадам и целому Древу. Изучаем отношения частей, уровни проявления и вопрос поступка.</p><p>Патах Элиягу даёт образ связанных сефирот; Сефер Йецира — вопросы о десяти, буквах, начале и конце; Тания — различение миров; Томер Двора — возвращение и действие. Для соответствий карт отдельно обращаемся к герметическому Таро.</p></div><div><h2>Как заниматься</h2><p>На занятие — примерно 25–40 минут. Прочитайте короткий фрагмент и его контекст. Затем рассмотрите карты, запишите основание и свою гипотезу. Сравните с примером, ответьте на два вопроса и самостоятельно отметьте завершение.</p><p>В лаборатории доступны все 78 карт, отдельные варианты и снимки разборов. Для десяти позиций есть схема Древа и чтение по группам или столпам. Последнее занятие связывает разбор с наблюдением и пересмотром.</p></div></section><section class="sg-section tr-layers"><h2>Три слоя каждого занятия</h2><ol><li><strong>Текст и его религиозный смысл.</strong> Указанное место, короткий рабочий перевод и вопрос к нему.</li><li><strong>Герметические соответствия.</strong> Выбранная система сефирот, букв и мастей.</li><li><strong>Ваша гипотеза.</strong> Образы, роли позиций, условия, альтернатива и возможный поступок.</li></ol></section><section id="program" class="sg-section"><h2>Маршрут занятий</h2><div class="sg-program">'
    for l in D['lessons']:b+=f'<article><span class="sg-number">{l["id"]:02d}</span><h3><a href="{l["slug"]}/">'+E(l['title'])+'</a></h3>'+p(l['aim'])+f'<span class="fine" data-sg-mark="{l["id"]}">Можно начать</span></article>'
    b+='</div></section><section class="sg-section"><h2>Слова, с которыми будем работать</h2><dl class="tr-terms">'+''.join('<div><dt>'+E(k)+'</dt><dd>'+E(v)+'</dd></div>' for k,v in D['terms'])+'</dl></section>'+sources()+'</div>'+payload()
    page(BASE,D['title'],D['lead'],b)
    for l in D['lessons']:
        b=crumbs('../../../','Чтение Древа · '+str(l['id']))+'<div class="sg-module tr-module"><p><a href="../">← Весь модуль</a> · <a href="../notebook/">Моя тетрадь</a></p><header class="sg-lesson-hero"><p class="eyebrow">Занятие '+str(l['id'])+' из 8</p><h1>'+E(l['title'])+'</h1><p class="lead">'+E(l['aim'])+'</p>'+progress()+'</header><nav class="sg-lesson-nav" aria-label="Разделы занятия"><a href="#reading">Источник</a><a href="#explanation">Разбор</a><a href="#task">Задание</a><a href="#laboratory">Лаборатория</a><a href="#check">Самопроверка</a></nav>'+reading(l)+'<div id="explanation" class="sg-reading"><p class="sg-opening">'+E(l['opening'])+'</p>'
        for s in l['sections']:b+='<section><h2>'+E(s['title'])+'</h2>'+''.join(p(t) for t in s['text'])+'</section>'
        b+='</div>'
        if l['id']==4:b+=matrix()
        b+='<section id="task" class="sg-section"><h2>Попробуйте сами</h2><ol>'+''.join('<li>'+E(t)+'</li>' for t in l['task'])+'</ol>'+p('Исходные карты: '+' → '.join(shared.BY_ID[id]['name'] for id in l['default']['ids']))+shared.example(l)+'</section>'+lab(l)
        b+='<section id="check" class="sg-section sg-quiz"><h2>Могу ли я объяснить?</h2><p>Вопросы проверяют понимание метода; смысл личного толкования автоматически не оценивается.</p>'
        for i,q in enumerate(l['quiz']):
            b+=f'<fieldset disabled data-sg-enable><legend>{i+1}. '+E(q['q'])+'</legend>'+''.join(f'<label><input type="radio" name="sg-q-{i}" value="{j}" data-sg-answer="{i}"> '+E(o)+'</label>' for j,o in enumerate(q['options']))+f'<p id="sg-feedback-{i}" role="status"></p></fieldset>'
        b+='<button type="button" class="button" id="sg-check" disabled data-sg-enable>Проверить ответы</button><p id="sg-check-status" role="status"></p><details class="sg-disclosure"><summary>Ответы с объяснениями</summary>'+''.join('<p><strong>'+str(i+1)+'. '+E(q['options'][q['answer']])+'.</strong> '+E(q['why'])+'</p>' for i,q in enumerate(l['quiz']))+'</details></section><section class="sg-section"><h2>После занятия</h2>'+p(l['reflection'])+'<label class="sg-complete"><input type="checkbox" id="sg-completed" disabled data-sg-enable> Отмечаю занятие как пройденное</label><details class="sg-disclosure"><summary>Скачать или перенести записи модуля</summary>'+shared.notes_controls()+'</details></section>'+sources(l)
        if l.get('continue'):b+='<section class="sg-section"><h2>Продолжить чтение</h2>'+''.join('<p><a href="'+E(x['url'],quote=True)+'">'+E(x['title'])+' →</a></p>' for x in l['continue'])+'</section>'
        prev=D['lessons'][l['id']-2] if l['id']>1 else None;nxt=D['lessons'][l['id']] if l['id']<N else None
        b+='<nav class="sg-next" aria-label="Соседние занятия">'+('<a href="../'+prev['slug']+'/">← '+E(prev['title'])+'</a>' if prev else '<a href="../">← Программа</a>')+('<a href="../'+nxt['slug']+'/">'+E(nxt['title'])+' →</a>' if nxt else '<a href="../notebook/">Тетрадь и наблюдения →</a>')+'</nav></div>'+payload(l)
        page(BASE+l['slug']+'/',l['title']+' — чтение Древа',l['aim'],b)
    notebook(page,crumbs)
