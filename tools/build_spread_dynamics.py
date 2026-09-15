"""Source-led advanced module; shares the spread lab, with an isolated notebook."""
from pathlib import Path
from html import escape as E
import json
import build_spread_grammar as shared

ROOT=Path(__file__).resolve().parents[1]
BASE='/course/spread-dynamics/'
PATHS=json.loads((ROOT/'content/pathways.json').read_text())['paths']
BY_PATH={p['id']:dict(p,number=11+i) for i,p in enumerate(PATHS)}
D=json.loads((ROOT/'content/spread-dynamics.json').read_text())
N=len(D['lessons'])
SEFIROT=['Кетер','Хохма','Бина','Хесед','Гвура','Тиферет','Нецах','Ход','Йесод','Малхут']
def p(t):return '<p>'+E(t)+'</p>'
def progress():return f'<div class="sg-progress"><progress value="0" max="{N}" aria-label="Прогресс модуля" data-sg-progress></progress><span data-sg-count>Отмечено 0 из {N} занятий</span></div>'
def payload(l=None):
    data={'spreadDynamics':True,'app':D['app'],'title':D['title'],'layoutIds':D['layoutIds'],'lessons':[{**{k:x[k] for k in ['id','slug','title','default']},**({'demoA':{'lesson':str(x['id']),'config':x['default'],'question':x['example']['question'],'reading':x['example']['reading'],'basis':x['example']['evidence'],'alternative':x['example']['alternative'],'step':'Проверить предложенное действие и записать наблюдение.'},'comparison':x['comparison']} if l and x['id']==l['id'] else {})} for x in D['lessons']],'current':l['id'] if l else 0,'quiz':l['quiz'] if l else []}
    return '<script id="spread-grammar-data" type="application/json">'+json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+'</script>'
def sources(l=None):
    out='<section id="sources" class="sg-section sg-sources"><h2>Источники и границы метода</h2>'
    if l:out+=p(l['bridge'])
    for key in l['refs'] if l else D['sources']:
        x=D['sources'][key];out+='<p><a href="'+E(x['url'],quote=True)+'" target="_blank" rel="noopener noreferrer">'+E(x['title'])+'</a><br>'+E(x['detail'])+'</p>'
    return out+p('Русские пояснения, современные ситуации, вопросы позиций и примеры написаны для курса. Соответствия Таро выбраны по герметической линии Golden Dawn; изображения — Уэйта–Смит. Для придворных используется адаптация Король / Королева / Рыцарь / Паж = Огонь / Вода / Воздух / Земля внутри масти. Она не подменяет названия придворных в других колодах. Номер Старшего аркана не равен номеру сефиры.')+'</section>'
def reading(l):
    x=l['reading'];out='<section id="reading" class="tr-reading sg-section"><p class="eyebrow">Сначала источник</p><h2>'+E(x['title'])+'</h2>'
    if x['original']:out+='<p class="tr-original" lang="'+x.get('lang','he')+'" dir="'+('ltr' if x.get('lang')=='en' else 'rtl')+'">'+E(x['original'])+'</p>'
    out+='<p class="tr-translation">'+E(x['translation'])+'</p>'+p(x['context'])+'<p><a href="'+E(x['url'],quote=True)+'" target="_blank" rel="noopener noreferrer">Открыть указанное место →</a></p><p class="tr-question"><strong>Вопрос к тексту.</strong> '+E(x['question'])+'</p></section>'
    return out
def passport(l):
    out='<details class="sg-disclosure mr-passport"><summary>Проверить соответствия исходных карт</summary>'
    for id in l['default']['ids']:
        c=shared.BY_ID[id]
        if c['group']=='major':
            m=next(m for m in shared.METHOD['majors'] if m['id']==id);path=BY_PATH[id];text=m['name']+' · '+m['letter']+'; путь '+str(path['number'])+': '+SEFIROT[path['a']-1]+' — '+SEFIROT[path['b']-1]
        elif c['rank']<=10:text=str(c['rank'])+' · '+SEFIROT[c['rank']-1]+'; '+shared.METHOD['suits'][c['group']]['world']
        else:
            rank=shared.METHOD['courts'][str(c['rank'])];suit=shared.METHOD['suits'][c['group']];letter={14:'Йод',13:'Первая хе',12:'Вав',11:'Последняя хе'}[c['rank']];text=rank['element']+' (ранг); '+suit['element']+' (масть); '+letter+'; '+suit['world']
        out+='<p><strong>'+E(c['name'])+'</strong> — '+E(text)+'</p>'
    return out+'</details>'
def checklist():return '<section class="sg-section"><h2>Памятка самостоятельного чтения</h2><ol class="mr-checklist">'+''.join('<li>'+E(t)+'</li>' for t in D['checklist'])+'</ol></section>'
def comparison():
    return '<section id="comparison" class="sg-section dy-panel"><div id="dy-panel"><p class="eyebrow">Две записи рядом</p><h2>Что изменилось между разборами</h2><p>Выберите учебные примеры, свои снимки или текущую запись. После правки текста нажмите «Обновить сравнение». Учебные примеры не сохраняются в личную тетрадь.</p><div class="dy-selectors"><label>Запись А<select id="dy-a" disabled data-sg-enable></select></label><label>Запись Б<select id="dy-b" disabled data-sg-enable></select></label></div><div class="sg-actions"><button type="button" class="button" id="dy-own" disabled data-sg-enable>Сравнить мои записи</button><button type="button" class="button secondary" id="dy-refresh" disabled data-sg-enable>Обновить сравнение</button></div><p id="dy-status" role="status">Для сравнения записей включите JavaScript. Разобранный пример доступен в тексте занятия.</p><div id="dy-results" hidden><div id="dy-warnings" class="dy-warnings"></div><h3>Состав, порядок и ориентация</h3><ul id="dy-changes"></ul><div class="dy-table-wrap" tabindex="0" role="region" aria-label="Карты и вопросы позиций в двух записях"><table class="dy-table"><caption>Сопоставление мест: вопросы позиций могут различаться</caption><thead><tr><th scope="col">Место</th><th scope="col">Запись А</th><th scope="col">Запись Б</th></tr></thead><tbody id="dy-positions"></tbody></table></div><h3>Изменения в объяснении</h3><p id="dy-no-text">Основные текстовые поля совпадают.</p><div class="dy-table-wrap" tabindex="0" role="region" aria-label="Изменённые текстовые поля"><table class="dy-table"><caption>Только поля с различающимися текстами</caption><thead><tr><th scope="col">Поле</th><th scope="col">Запись А</th><th scope="col">Запись Б</th></tr></thead><tbody id="dy-text"></tbody></table></div><h3>Записи и последующие наблюдения</h3><div id="dy-notes" class="dy-notes"></div><p>Сравнение фиксирует различия, но не устанавливает их причину. Сведения о жизни добавляются Вами отдельно; одинаковая карта и более поздняя дата сами по себе не доказывают развитие события.</p></div></div></section>'
def lab(l):
    out=shared.lab(l)
    out=out.replace('На какие детали, соответствия и источники я опираюсь','Основание: наблюдение / соответствие / источник / условие перехода')
    out=out.replace('Какой шаг или наблюдение поможет уточнить толкование','Действие, условие перехода и критерий последующего наблюдения')
    out=out.replace('<p id="sg-layout-help" class="sg-help"></p>','<p id="sg-layout-help" class="sg-help"></p><p class="fine">В схемах «Своя схема» можно изменить вопросы позиций. Снимок сохранит исходную формулировку для последующего сравнения.</p>')
    return out+comparison()
def notebook(page,crumbs):
    b=crumbs('../../../','Тетрадь раскладов во времени')+'<div class="sg-module tr-module mr-module dy-module"><header class="sg-hero"><p class="eyebrow">Отдельная тетрадь модуля</p><h1>Мои расклады во времени</h1><p class="lead">Варианты раскладов, источники Ваших объяснений, зафиксированные гипотезы и последующие наблюдения.</p>'+progress()+'<p>Записи остаются в этом браузере на этом устройстве. Автор курса их не получает. Скачайте JSON для резервной копии и переноса; TXT подходит для чтения.</p>'+shared.notes_controls()+'<p id="sg-save-status" role="status"></p><p><a href="../">Вернуться к программе →</a></p></header>'+comparison()+'<section class="sg-section"><h2>Мои варианты</h2><label class="sg-field">Найти карту, вопрос или текст<input type="search" id="sg-search" disabled data-sg-enable></label><div id="sg-notes"></div><button type="button" class="button secondary" id="sg-more" hidden>Показать ещё</button></section><section id="observations" class="sg-section"><h2>Сохранённые разборы и возвращения</h2><p>Исходный снимок остаётся прежним. Новые факты и понимание добавляются отдельной записью с датой.</p><div id="sg-snapshots"></div><button type="button" class="button secondary" id="sg-snap-more" hidden>Показать ещё снимки</button></section><noscript><p>Для личных записей и переноса тетради включите JavaScript.</p></noscript></div>'+payload()
    page(BASE+'notebook/','Мои расклады во времени — тетрадь','Личная тетрадь раскладов в динамике: два разбора, даты и наблюдения.',b,noindex=True)
def build(page,crumbs):
    assert N==6 and [l['id'] for l in D['lessons']]==list(range(1,N+1))
    assert len({l['slug'] for l in D['lessons']})==N
    for l in D['lessons']:
        assert len(l['quiz'])==2 and all(0<=q['answer']<len(q['options']) for q in l['quiz'])
        assert len(l['default']['ids'])==len(set(l['default']['ids'])) and set(l['default']['ids'])<=set(shared.BY_ID)
        assert set(l['refs'])<=set(D['sources']) and l['default']['layout'] in D['layoutIds']
    b=crumbs('../../','Расклад в динамике')+'<div class="sg-module tr-module mr-module dy-module"><header class="sg-hero"><p class="eyebrow">Следующая ступень · 6 занятий · 12 вопросов</p><h1>'+E(D['title'])+'</h1><p class="sg-subtitle">'+E(D['subtitle'])+'</p><p class="lead">'+E(D['lead'])+'</p><div class="sg-actions"><a class="button" href="time-and-position/">Начать со времени и позиции →</a><a class="button secondary" href="#program">Шесть занятий</a><a href="notebook/">Моя тетрадь</a></div>'+progress()+'</header><section class="sg-section sg-intro"><div><h2>Как меняется целое</h2><p>После <a href="../reversal-study/">модуля о мере и возвращении</a> рассматриваем расклад во времени. Учимся различать порядок чтения, условие перехода, изменение ситуации и пересмотр объяснения.</p><p>Новые опоры — Тания о времени и Малхут, глава о рацо ва-шов, триада «мир — год — человек» в Сефер Йецира. Источник, герметическое соответствие и современное упражнение обозначены отдельно.</p></div><div><h2>Сравнение двух разборов</h2><p>На занятие — 25–40 минут. В каждом уроке есть учебные записи А и Б. Инструмент показывает перестановки, замены, перевороты, изменения вопросов позиций и текста. Можно сравнивать собственные снимки и читать добавленные наблюдения рядом.</p><p>Лаборатория поддерживает все 78 карт и схемы из 4–6 позиций. Тетрадь хранится в браузере; сохраните JSON для переноса и резервной копии.</p></div></section><section class="sg-section"><h2>Четыре вида изменения</h2><div class="dy-table-wrap" tabindex="0" role="region" aria-label="Что может измениться между разборами"><table class="dy-table"><caption>У каждого различия своё основание</caption><thead><tr><th scope="col">Изменилось</th><th scope="col">Что сопоставить</th><th scope="col">Какой вопрос задать</th></tr></thead><tbody><tr><th scope="row">Событие</th><td>Наблюдаемые факты и их даты</td><td>Что действительно произошло?</td></tr><tr><th scope="row">Карты</th><td>Состав, порядок, ориентация</td><td>Зачем мы изменили набор?</td></tr><tr><th scope="row">Схема</th><td>Вопросы, места и группировки</td><td>Остался ли прежним предмет сравнения?</td></tr><tr><th scope="row">Понимание</th><td>Толкование, основание и альтернатива</td><td>Какое сведение изменило вывод?</td></tr></tbody></table></div><p>Сравнение двух записей не вычисляет будущее и не ставит оценку толкованию. Оно помогает увидеть, что Вы сохраняете, меняете и проверяете.</p></section><section id="program" class="sg-section"><h2>Маршрут занятий</h2><div class="sg-program">'
    for l in D['lessons']:b+=f'<article><span class="sg-number">{l["id"]:02d}</span><h3><a href="{l["slug"]}/">'+E(l['title'])+'</a></h3>'+p(l['aim'])+f'<span class="fine" data-sg-mark="{l["id"]}">Можно начать</span></article>'
    b+='</div></section><section class="sg-section"><h2>Слова, с которыми будем работать</h2><dl class="tr-terms">'+''.join('<div><dt>'+E(k)+'</dt><dd>'+E(v)+'</dd></div>' for k,v in D['terms'])+'</dl></section>'+checklist()+sources()+'</div>'+payload()
    page(BASE,D['title'],D['lead'],b)
    for l in D['lessons']:
        b=crumbs('../../../','Расклад в динамике · '+str(l['id']))+'<div class="sg-module tr-module mr-module dy-module"><p><a href="../">← Весь модуль</a> · <a href="../notebook/">Моя тетрадь</a></p><header class="sg-lesson-hero"><p class="eyebrow">Занятие '+str(l['id'])+' из 6</p><h1>'+E(l['title'])+'</h1><p class="lead">'+E(l['aim'])+'</p>'+progress()+'</header><nav class="sg-lesson-nav" aria-label="Разделы занятия"><a href="#reading">Источник</a><a href="#explanation">Разбор</a><a href="#task">Задание</a><a href="#laboratory">Лаборатория</a><a href="#comparison">Сравнить записи</a><a href="#check">Самопроверка</a></nav>'+reading(l)+'<div id="explanation" class="sg-reading"><p class="sg-opening">'+E(l['opening'])+'</p>'
        for s in l['sections']:b+='<section><h2>'+E(s['title'])+'</h2>'+''.join(p(t) for t in s['text'])+'</section>'
        b+='</div>'
        b+='<section id="task" class="sg-section"><h2>Попробуйте сами</h2><ol>'+''.join('<li>'+E(t)+'</li>' for t in l['task'])+'</ol>'+p('Исходные карты: '+' → '.join(shared.BY_ID[id]['name']+(' (перевёрнута)' if l['default'].get('reversed',[False]*len(l['default']['ids']))[i] else ' (прямо)') for i,id in enumerate(l['default']['ids'])))+shared.example(l)+passport(l)+'<details class="sg-disclosure"><summary>Учебное продолжение: запись Б</summary>'+p(l['comparison']['label'])+p('Вопрос: '+l['comparison']['note']['question'])+p(l['comparison']['note']['reading'])+p('Следующий шаг: '+l['comparison']['note']['step'])+'</details></section>'+lab(l)
        b+='<section id="check" class="sg-section sg-quiz"><h2>Могу ли я объяснить?</h2><p>Вопросы проверяют понимание метода; смысл личного толкования автоматически не оценивается.</p>'
        for i,q in enumerate(l['quiz']):
            b+=f'<fieldset disabled data-sg-enable><legend>{i+1}. '+E(q['q'])+'</legend>'+''.join(f'<label><input type="radio" name="sg-q-{i}" value="{j}" data-sg-answer="{i}"> '+E(o)+'</label>' for j,o in enumerate(q['options']))+f'<p id="sg-feedback-{i}" role="status"></p></fieldset>'
        b+='<button type="button" class="button" id="sg-check" disabled data-sg-enable>Проверить ответы</button><p id="sg-check-status" role="status"></p><details class="sg-disclosure"><summary>Ответы с объяснениями</summary>'+''.join('<p><strong>'+str(i+1)+'. '+E(q['options'][q['answer']])+'.</strong> '+E(q['why'])+'</p>' for i,q in enumerate(l['quiz']))+'</details></section><section class="sg-section"><h2>После занятия</h2>'+p(l['reflection'])+'<label class="sg-complete"><input type="checkbox" id="sg-completed" disabled data-sg-enable> Отмечаю занятие как пройденное</label><details class="sg-disclosure"><summary>Скачать или перенести записи модуля</summary>'+shared.notes_controls()+'</details></section>'+sources(l)
        if l.get('continue'):b+='<section class="sg-section"><h2>Продолжить чтение</h2>'+''.join('<p><a href="'+E(x['url'],quote=True)+'">'+E(x['title'])+' →</a></p>' for x in l['continue'])+'</section>'
        if l['id']==N:b+=checklist()
        prev=D['lessons'][l['id']-2] if l['id']>1 else None;nxt=D['lessons'][l['id']] if l['id']<N else None
        b+='<nav class="sg-next" aria-label="Соседние занятия">'+('<a href="../'+prev['slug']+'/">← '+E(prev['title'])+'</a>' if prev else '<a href="../">← Программа</a>')+('<a href="../'+nxt['slug']+'/">'+E(nxt['title'])+' →</a>' if nxt else '<a href="../notebook/">Тетрадь и наблюдения →</a>')+'</nav></div>'+payload(l)
        page(BASE+l['slug']+'/',l['title']+' — расклад в динамике',l['aim'],b)
    notebook(page,crumbs)
