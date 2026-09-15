"""Source-led advanced module; shares the spread lab, with an isolated notebook."""
from pathlib import Path
from html import escape as E
import json
import build_spread_grammar as shared

ROOT=Path(__file__).resolve().parents[1]
BASE='/course/reversal-study/'
PATHS=json.loads((ROOT/'content/pathways.json').read_text())['paths']
BY_PATH={p['id']:dict(p,number=11+i) for i,p in enumerate(PATHS)}
D=json.loads((ROOT/'content/reversal-study.json').read_text())
N=len(D['lessons'])
SEFIROT=['Кетер','Хохма','Бина','Хесед','Гвура','Тиферет','Нецах','Ход','Йесод','Малхут']
def p(t):return '<p>'+E(t)+'</p>'
def progress():return f'<div class="sg-progress"><progress value="0" max="{N}" aria-label="Прогресс модуля" data-sg-progress></progress><span data-sg-count>Отмечено 0 из {N} занятий</span></div>'
def payload(l=None):
    data={'reversalStudy':True,'app':D['app'],'title':D['title'],'layoutIds':D['layoutIds'],'lessons':[{k:x[k] for k in ['id','slug','title','default']} for x in D['lessons']],'current':l['id'] if l else 0,'quiz':l['quiz'] if l else []}
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
def lab(l):
    out=shared.lab(l)
    panel='<section id="rv-panel" class="rv-panel"><h3>Сравнить ориентации и способы проявления</h3><p id="rv-count" role="status"></p><p id="rv-order" class="rv-note"></p><p class="rv-note">П — прямо, О — перевёрнуто. Знаки идут в порядке позиций. Переключение сохраняет текущую запись и открывает запись выбранного варианта. Варианты с текстом доступны ниже в «Моих других вариантах».</p><label class="sg-field">Вариант ориентаций<select id="rv-pattern" disabled data-sg-enable></select></label><div class="rv-controls"><button type="button" id="rv-previous" class="button secondary" disabled data-sg-enable>Предыдущий вариант</button><button type="button" id="rv-next" class="button secondary" disabled data-sg-enable>Следующий вариант</button><button type="button" id="rv-upright" class="button secondary" disabled data-sg-enable>Все прямо</button><button type="button" id="rv-flip" class="button secondary" disabled data-sg-enable>Перевернуть выбранную</button></div><label class="sg-field">Карта для сравнения гипотез<select id="rv-target" disabled data-sg-enable></select></label><h4 id="rv-focus-title"></h4><p id="rv-role"></p><p class="rv-note">Этот выбор также задаёт карту для временного исключения ниже. Четыре гипотезы доступны в обеих ориентациях. Таблица содержит авторские опоры курса; она не определяет Вашу ситуацию автоматически.</p><div id="rv-compare"><div class="rv-table-wrap" tabindex="0" role="region" aria-label="Гипотезы о проявлении выбранной карты"><table class="rv-table"><caption>Сравните две правдоподобные версии и назовите основание выбора</caption><thead><tr><th scope="col">Гипотеза</th><th scope="col">Опора по образу</th><th scope="col">Проверочный вопрос</th></tr></thead><tbody id="rv-hypotheses"></tbody></table></div><details class="sg-disclosure"><summary>Собственные соответствия сохраняются при перевороте</summary><div id="rv-reference"></div></details><p class="rv-note">Запишите выбранную версию в поле толкования, другую — в поле альтернативы, основания — отдельно. Если конфигурация не меняется, перед новой редакцией можно зафиксировать снимок.</p></div></section>'
    out=out.replace('<div id="sg-cards" class="sg-card-grid"></div>','<div id="sg-cards" class="sg-card-grid"></div>'+panel)
    out=out.replace('На какие детали, соответствия и источники я опираюсь','Основание: деталь / источник / соответствие / правило ориентации')
    out=out.replace('<p id="sg-layout-help" class="sg-help"></p>','<p id="sg-layout-help" class="sg-help"></p><p class="fine">В схемах «Своя схема» можно задать свои вопросы позиций. Поменяв схему, Вы получите её стандартные вопросы и отдельный вариант записи.</p>')
    return out
def notebook(page,crumbs):
    b=crumbs('../../../','Тетрадь ориентаций и проявлений')+'<div class="sg-module tr-module mr-module rv-module"><header class="sg-hero"><p class="eyebrow">Отдельная тетрадь модуля</p><h1>Мои исследования ориентаций</h1><p class="lead">Варианты раскладов, источники Ваших объяснений, зафиксированные гипотезы и последующие наблюдения.</p>'+progress()+'<p>Записи остаются в этом браузере на этом устройстве. Автор курса их не получает. Скачайте JSON для резервной копии и переноса; TXT подходит для чтения.</p>'+shared.notes_controls()+'<p id="sg-save-status" role="status"></p><p><a href="../">Вернуться к программе →</a></p></header><section class="sg-section"><h2>Мои варианты</h2><label class="sg-field">Найти карту, вопрос или текст<input type="search" id="sg-search" disabled data-sg-enable></label><div id="sg-notes"></div><button type="button" class="button secondary" id="sg-more" hidden>Показать ещё</button></section><section id="observations" class="sg-section"><h2>Сохранённые разборы и возвращения</h2><p>Исходный снимок остаётся прежним. Новые факты и понимание добавляются отдельной записью с датой.</p><div id="sg-snapshots"></div><button type="button" class="button secondary" id="sg-snap-more" hidden>Показать ещё снимки</button></section><noscript><p>Для личных записей и переноса тетради включите JavaScript.</p></noscript></div>'+payload()
    page(BASE+'notebook/','Мои исследования ориентаций — тетрадь','Личная тетрадь прямых и перевёрнутых карт: сравнение вариантов и наблюдения.',b,noindex=True)
def build(page,crumbs):
    assert N==6 and [l['id'] for l in D['lessons']]==list(range(1,N+1))
    assert len({l['slug'] for l in D['lessons']})==N
    for l in D['lessons']:
        assert len(l['quiz'])==2 and all(0<=q['answer']<len(q['options']) for q in l['quiz'])
        assert len(l['default']['ids'])==len(set(l['default']['ids'])) and set(l['default']['ids'])<=set(shared.BY_ID)
        assert set(l['refs'])<=set(D['sources']) and l['default']['layout'] in D['layoutIds']
    b=crumbs('../../','Мера и возвращение')+'<div class="sg-module tr-module mr-module rv-module"><header class="sg-hero"><p class="eyebrow">Следующая ступень · 6 занятий · 12 вопросов</p><h1>'+E(D['title'])+'</h1><p class="sg-subtitle">'+E(D['subtitle'])+'</p><p class="lead">'+E(D['lead'])+'</p><div class="sg-actions"><a class="button" href="choose-the-rule/">Начать с выбора правила →</a><a class="button secondary" href="#program">Шесть занятий</a><a href="notebook/">Моя тетрадь</a></div>'+progress()+'</header><section class="sg-section sg-intro"><div><h2>От проявления к самостоятельному выбору</h2><p>После <a href="../mixed-reading/">света, сосуда и передачи</a> возвращаемся к вопросу о прямых и перевёрнутых картах. Опора — Тания о мере и принятии, Пардес римоним о свете и сосудах, Томер Двора о Бине и возвращении.</p><p>Сначала определяем правило чтения, затем сравниваем его применение. Еврейские тексты, герметические соответствия и учебные аналогии курса обозначены отдельно.</p></div><div><h2>Лаборатория вариантов</h2><p>Все 78 карт, схемы из четырёх, пяти и шести позиций, все 16 / 32 / 64 варианта ориентаций при фиксированном порядке. Опоры для сравнения соразмерности, недостатка, избытка и искажения доступны в обоих положениях.</p><p>На занятие — 25–40 минут. Изучите исходный пример, сравните две-три версии и сохраните собственное объяснение. Отдельная тетрадь хранит варианты, снимки и последующие наблюдения.</p></div></section><section class="sg-section"><h2>Три вопроса, которые нужно различать</h2><div class="rv-table-wrap" tabindex="0" role="region" aria-label="Ориентация, соответствие и проявление"><table class="rv-table rv-rule-table"><caption>Что меняется при повороте карты</caption><thead><tr><th scope="col">Слой чтения</th><th scope="col">Что устанавливаем</th><th scope="col">Как проверяем</th></tr></thead><tbody><tr><td>Ориентация</td><td>Изображение прямо или перевёрнуто</td><td>Наблюдаем положение; заранее выбираем правило</td></tr><tr><td>Соответствие</td><td>Число и сефира, ранг и стихия либо буква и путь</td><td>Обращаемся к указанной системе; переворот её не меняет</td></tr><tr><td>Проявление в ситуации</td><td>Возможная соразмерность, недостаток, избыток или искажение</td><td>Сравниваем гипотезы по образам, контексту и наблюдениям</td></tr></tbody></table></div><p>В модуле переворот служит поводом исследовать проявление. Это выбранная учебная договорённость. Она не выдаётся за единое историческое правило каббалы.</p></section><section id="program" class="sg-section"><h2>Маршрут занятий</h2><div class="sg-program">'
    for l in D['lessons']:b+=f'<article><span class="sg-number">{l["id"]:02d}</span><h3><a href="{l["slug"]}/">'+E(l['title'])+'</a></h3>'+p(l['aim'])+f'<span class="fine" data-sg-mark="{l["id"]}">Можно начать</span></article>'
    b+='</div></section><section class="sg-section"><h2>Слова, с которыми будем работать</h2><dl class="tr-terms">'+''.join('<div><dt>'+E(k)+'</dt><dd>'+E(v)+'</dd></div>' for k,v in D['terms'])+'</dl></section>'+checklist()+sources()+'</div>'+payload()
    page(BASE,D['title'],D['lead'],b)
    for l in D['lessons']:
        b=crumbs('../../../','Ориентация и мера · '+str(l['id']))+'<div class="sg-module tr-module mr-module rv-module"><p><a href="../">← Весь модуль</a> · <a href="../notebook/">Моя тетрадь</a></p><header class="sg-lesson-hero"><p class="eyebrow">Занятие '+str(l['id'])+' из 6</p><h1>'+E(l['title'])+'</h1><p class="lead">'+E(l['aim'])+'</p>'+progress()+'</header><nav class="sg-lesson-nav" aria-label="Разделы занятия"><a href="#reading">Источник</a><a href="#explanation">Разбор</a><a href="#task">Задание</a><a href="#laboratory">Лаборатория</a><a href="#check">Самопроверка</a></nav>'+reading(l)+'<div id="explanation" class="sg-reading"><p class="sg-opening">'+E(l['opening'])+'</p>'
        for s in l['sections']:b+='<section><h2>'+E(s['title'])+'</h2>'+''.join(p(t) for t in s['text'])+'</section>'
        b+='</div>'
        b+='<section id="task" class="sg-section"><h2>Попробуйте сами</h2><ol>'+''.join('<li>'+E(t)+'</li>' for t in l['task'])+'</ol>'+p('Исходные карты: '+' → '.join(shared.BY_ID[id]['name']+(' (перевёрнута)' if l['default'].get('reversed',[False]*len(l['default']['ids']))[i] else ' (прямо)') for i,id in enumerate(l['default']['ids'])))+shared.example(l)+passport(l)+'</section>'+lab(l)
        b+='<section id="check" class="sg-section sg-quiz"><h2>Могу ли я объяснить?</h2><p>Вопросы проверяют понимание метода; смысл личного толкования автоматически не оценивается.</p>'
        for i,q in enumerate(l['quiz']):
            b+=f'<fieldset disabled data-sg-enable><legend>{i+1}. '+E(q['q'])+'</legend>'+''.join(f'<label><input type="radio" name="sg-q-{i}" value="{j}" data-sg-answer="{i}"> '+E(o)+'</label>' for j,o in enumerate(q['options']))+f'<p id="sg-feedback-{i}" role="status"></p></fieldset>'
        b+='<button type="button" class="button" id="sg-check" disabled data-sg-enable>Проверить ответы</button><p id="sg-check-status" role="status"></p><details class="sg-disclosure"><summary>Ответы с объяснениями</summary>'+''.join('<p><strong>'+str(i+1)+'. '+E(q['options'][q['answer']])+'.</strong> '+E(q['why'])+'</p>' for i,q in enumerate(l['quiz']))+'</details></section><section class="sg-section"><h2>После занятия</h2>'+p(l['reflection'])+'<label class="sg-complete"><input type="checkbox" id="sg-completed" disabled data-sg-enable> Отмечаю занятие как пройденное</label><details class="sg-disclosure"><summary>Скачать или перенести записи модуля</summary>'+shared.notes_controls()+'</details></section>'+sources(l)
        if l.get('continue'):b+='<section class="sg-section"><h2>Продолжить чтение</h2>'+''.join('<p><a href="'+E(x['url'],quote=True)+'">'+E(x['title'])+' →</a></p>' for x in l['continue'])+'</section>'
        if l['id']==N:b+=checklist()
        prev=D['lessons'][l['id']-2] if l['id']>1 else None;nxt=D['lessons'][l['id']] if l['id']<N else None
        b+='<nav class="sg-next" aria-label="Соседние занятия">'+('<a href="../'+prev['slug']+'/">← '+E(prev['title'])+'</a>' if prev else '<a href="../">← Программа</a>')+('<a href="../'+nxt['slug']+'/">'+E(nxt['title'])+' →</a>' if nxt else '<a href="../notebook/">Тетрадь и наблюдения →</a>')+'</nav></div>'+payload(l)
        page(BASE+l['slug']+'/',l['title']+' — мера и возвращение',l['aim'],b)
    notebook(page,crumbs)
