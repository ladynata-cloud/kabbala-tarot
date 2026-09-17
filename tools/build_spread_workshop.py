"""Capstone: guided practice, fading support and an independent reading portfolio."""
from pathlib import Path
from html import escape as E
import json
import build_spread_grammar as shared
import build_spread_dynamics as dynamics
import build_tree_reading as tree_reading

ROOT = Path(__file__).resolve().parents[1]
BASE = '/course/spread-workshop/'
D = json.loads((ROOT/'content/spread-workshop.json').read_text())

def p(text): return '<p>'+E(text)+'</p>'
def progress():
    return '<div class="sg-progress"><progress value="0" max="8" aria-label="Прогресс мастерской" data-sg-progress></progress><span data-sg-count>Отмечено 0 из 8 практикумов</span></div>'

def payload(lesson=None):
    lessons=[]
    for l in D['lessons']:
        item={k:l[k] for k in ['id','slug','title','default']}
        if lesson and l['id']==lesson['id']:
            item.update(demoA={'lesson':str(l['id']),'config':l['default'], 'question':l['example']['question'],'reading':l['example']['reading'],'basis':l['example']['evidence'],'alternative':l['example']['alternative'],'step':l['example']['step']},comparison=l['comparison'],support=l['support'],rubric=l['rubric'])
        lessons.append(item)
    data={'app':D['app'],'title':D['title'],'spreadDynamics':True,'spreadWorkshop':True,'layoutIds':D['layoutIds'],'lessons':lessons,'current':lesson['id'] if lesson else 0,'quiz':lesson['quiz'] if lesson else []}
    return '<script id="spread-grammar-data" type="application/json">'+json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+'</script>'

def source(l):
    x=l['source']
    return '<section id="source" class="sg-section"><p class="eyebrow">Опора для практики</p><h2>'+E(x['title'])+'</h2>'+p(x['idea'])+'<p><a href="'+E(x['url'],quote=True)+'" target="_blank" rel="noopener noreferrer">Прочитать указанное место →</a></p>'+p(x['application'])+'<p class="fine">'+E(x['boundary'])+'</p></section>'

def prerequisites(l):
    return '<div class="sw-links"><strong>Если понадобится опора:</strong> '+ ' · '.join('<a href="'+E(x['url'],quote=True)+'">'+E(x['title'])+'</a>' for x in l['links'])+'</div>'

def support(l):
    return '<section class="sw-support sg-section"><h2>Сколько помощи Вам сейчас нужно?</h2><label>Режим практики<select id="sw-support" disabled data-sg-enable><option value="guided">С подробным разбором</option><option value="hints">Только с подсказками</option><option value="independent">Сначала самостоятельно</option></select></label><p id="sw-support-status" role="status">Можно сначала решить задание на бумаге, затем открыть разбор.</p><p class="fine">Режим меняет видимость помощи. Ваши записи, карты и отметки сохраняются. Проверяйте исходный набор: при выборе другой схемы его состав и роли могут измениться.</p></section>'

def rubric(l):
    return '<section id="review" class="sg-section"><h2>Проверьте качество своего объяснения</h2><p>Сопоставьте свою работу с признаками ниже. В поле «Моё толкование целого» допишите, что удалось и что Вы пересмотрели. Галочка прохождения означает Вашу самооценку.</p><ol class="sw-rubric">'+''.join('<li>'+E(x)+'</li>' for x in l['rubric'])+'</ol><p class="sw-transfer"><strong>Проверка переноса.</strong> '+E(l['transfer'])+'</p><label class="sg-complete"><input type="checkbox" id="sg-completed" disabled data-sg-enable> Я выполнил(а) работу и проверил(а) её по критериям</label><details class="sg-disclosure"><summary>Скачать или перенести тетрадь мастерской</summary>'+shared.notes_controls()+'</details></section>'

def route():
    rows=[
      ('tarot-looking','Учимся видеть карту','Изображение, детали, собственный вопрос; затем двадцать вводных встреч.'),
      ('tarot-pairs','Пара','Свяжите два действия и объясните, что меняет перестановка.'),
      ('tarot-triples','Тройка','Найдите вклад третьей карты и смысл целого.'),
      ('spread-grammar','Устройство расклада · 12 занятий','Четвёрки, пары пар, 2+3, две тройки; роли и расположение.'),
      ('tree-reading','Древо · 8 занятий','Различайте собственное соответствие карты и функцию её места.'),
      ('pathways','Пути · 6 занятий','Читайте Старший аркан как переход и связь в выбранной системе.'),
      ('court-relations','Придворные · 6 занятий','Различайте ранг, масть и способ участия в ситуации.'),
      ('mixed-reading','Смешанное чтение · 6 занятий','Соберите числа, пути и придворные в одно объяснение.'),
      ('reversal-study','Ориентация · 6 занятий','Заранее выберите правило работы с перевёрнутыми картами.'),
      ('spread-dynamics','Динамика · 6 занятий','Сравните версии и отдельно запишите жизненное наблюдение.'),
      ('spread-workshop','Самостоятельная мастерская · 8 практикумов','Пройдите от помощи к своему раскладу, аргументам и пересмотру.')]
    out='<section class="section sw-route" id="reading-route"><p class="eyebrow">Вся ветвь раскладов</p><h2>От первой карты к самостоятельному чтению</h2><p>Идите по порядку или возвращайтесь к тому навыку, который сейчас нужен. Вводные встречи находятся ниже; после них — конструкторы, 50 занятий о раскладах и итоговая мастерская.</p><ol class="sw-route-list">'
    for slug,title,goal in rows:out+='<li><a href="/course/'+slug+'/">'+E(title)+'</a>'+p(goal)+'</li>'
    return out+'</ol><p><a class="button" href="/course/spread-workshop/">Перейти в мастерскую →</a></p></section>'

def build(page,crumbs):
    assert len(D['lessons'])==8
    intro=crumbs('../../','Мастерская раскладов')+'<div class="sg-module sw-module"><header class="sg-hero"><p class="eyebrow">Завершающая ступень · 8 практикумов</p><h1>'+E(D['title'])+'</h1><p class="lead">Вы уже умеете рассматривать части. Теперь построим законченный разбор: от вопроса и выбора схемы до связного толкования, альтернативы и возвращения к записи.</p><div class="sg-actions"><a class="button" href="question-and-structure/">Начать первый практикум →</a><a href="notebook/">Моя тетрадь мастерской</a><a href="/course/tarot/#reading-route">Весь маршрут Таро</a></div>'+progress()+'</header><section class="sg-section sw-intro"><div><h2>Как устроена работа</h2><p>Восемь встреч по 30–50 минут. Первые две — с подробной опорой, следующие три — с подсказками, последние три — сначала самостоятельно. Вы можете менять режим. В каждом практикуме сохраняйте исходную версию до чтения образца.</p><p>Лаборатория предлагает все 78 карт, схемы из 4–6 карт и десять позиций Древа. Можно менять карты и ориентацию, исследовать пары и тройки, временно убирать одну карту, создавать свои вопросы позиций.</p></div><div><h2>Что останется после мастерской</h2><p>Ваши разборы, их зафиксированные версии и последующие наблюдения. Тетрадь сохраняется в этом браузере; скачайте JSON для переноса и TXT для чтения. Прежние тетради доступны отдельно.</p><p>Задания, ситуации и практические вопросы позиций — авторская методика курса. Соответствия карт остаются в принятой герметической системе. Образец показывает ход обоснования; возможны другие прочтения.</p></div></section><section class="sg-section"><h2>Готовы ли Вы начать?</h2><p>Попробуйте объяснить: чем роль позиции отличается от соответствия карты; что меняется при перестановке; какое наблюдение заставило бы Вас уточнить трактовку. Если трудно, откройте соответствующую ступень маршрута. Книги можно читать параллельно.</p></section><section class="sg-section" id="program"><h2>Восемь практикумов</h2><div class="sg-program">'
    for l in D['lessons']:
        intro+='<article><span class="sg-number">'+str(l['id']).zfill(2)+'</span><h3><a href="'+l['slug']+'/">'+E(l['title'])+'</a></h3>'+p(l['aim'])+'<p class="fine">'+E({'guided':'Подробный разбор','hints':'Подсказки','independent':'Сначала самостоятельно'}[l['support']])+'</p><span data-sg-mark="'+str(l['id'])+'">Можно начать</span></article>'
    intro+='</div></section><section class="sg-section"><h2>Книжные опоры</h2><p><a href="/course/shaarei-orah/">Шаарей Ора: отношения имён и сефирот</a> · <a href="/course/mystical-qabalah/">Форчун: Древо и соответствия</a> · <a href="/course/book-of-thoth/">Кроули: устройство своей системы Таро</a> · <a href="/course/book-t/">Книга T: соответствия и соседство</a></p><p>Для карт Уэйта–Смит сохраняйте таблицу курса. При чтении Кроули специально отмечайте переход к системе Тота; не переносите отдельное соответствие незаметно.</p></section></div>'+payload()
    page(BASE,D['title'],'Восемь практикумов самостоятельного чтения Таро с каббалистической опорой: схемы, сравнение трактовок и личная тетрадь.',intro)
    for l in D['lessons']:
        assert len(l['quiz'])==2 and len(l['default']['ids'])==len(set(l['default']['ids']))
        b=crumbs('../../../','Мастерская · '+str(l['id']))+'<div class="sg-module sw-module"><p><a href="../">← Восемь практикумов</a> · <a href="../notebook/">Моя тетрадь</a> · <a href="/course/tarot/#reading-route">Маршрут Таро</a></p><header class="sg-lesson-hero"><p class="eyebrow">Практикум '+str(l['id'])+' из 8</p><h1>'+E(l['title'])+'</h1><p class="lead">'+E(l['aim'])+'</p>'+progress()+'</header>'+support(l)+'<nav class="sg-lesson-nav" aria-label="Разделы практикума"><a href="#case">Задача</a><a href="#source">Опора</a><a href="#laboratory">Рабочий стол</a><a href="#comparison">Сравнение</a><a href="#review">Критерии</a></nav><section id="case" class="sg-section"><h2>Ситуация для исследования</h2>'+p(l['case'])+'<p><strong>Вопрос.</strong> '+E(l['example']['question'])+'</p><p><strong>Результат работы.</strong> '+E(l['product'])+'</p><ol>'+''.join('<li>'+E(x)+'</li>' for x in l['task'])+'</ol><p>Стартовые карты: '+E(' → '.join(shared.BY_ID[x]['name'] for x in l['default']['ids']))+'.</p><p class="fine">Это учебный набор. Вы можете выбрать свои карты; тогда явно отметьте, что Ваш разбор относится к изменённому набору.</p>'+prerequisites(l)+'</section>'+source(l)
        b+='<section class="sg-section" data-sw-hints><h2>Подсказки по ходу работы</h2>'+''.join('<details class="sg-disclosure"><summary>Подсказка '+str(i+1)+'</summary>'+p(x)+'</details>' for i,x in enumerate(l['hints']))+'</section>'
        b+='<section class="sg-section" data-sw-model><h2>Разбор преподавателя</h2>'+''.join('<section><h3>'+E(s['title'])+'</h3>'+p(s['text'])+'</section>' for s in l['explanation'])+shared.example(l)+dynamics.passport(l)+'</section>'
        b+=tree_reading.lab(l)+dynamics.comparison()
        b+='<section class="sg-section" data-sw-model><h2>Два прочтения: какое лучше обосновано?</h2><p>Запись А — возможный разбор стартового набора. Запись Б — учебная версия для критики. В таблице сначала найдите различия, затем объясните, какие из них имеют основания.</p><details class="sg-disclosure" data-sw-model><summary>Показать разбор записи Б</summary>'+p(l['comparison']['label'])+p(l['comparison']['note']['reading'])+'<p><strong>Комментарий.</strong> '+E(l['comparison']['feedback'])+'</p></details></section>'
        b+='<section id="check" class="sg-section sg-quiz"><h2>Два вопроса о методе</h2>'
        for i,q in enumerate(l['quiz']):
            b+='<fieldset disabled data-sg-enable><legend>'+E(q['q'])+'</legend>'+''.join('<label><input type="radio" name="sg-q-'+str(i)+'" value="'+str(j)+'" data-sg-answer="'+str(i)+'"> '+E(o)+'</label>' for j,o in enumerate(q['options']))+'<p id="sg-feedback-'+str(i)+'" role="status"></p></fieldset>'
        b+='<button class="button" type="button" id="sg-check" disabled data-sg-enable>Проверить ответы</button><p id="sg-check-status" role="status"></p><details class="sg-disclosure"><summary>Ответы с пояснениями</summary>'+''.join('<p>'+E(q['options'][q['answer']])+'. '+E(q['why'])+'</p>' for q in l['quiz'])+'</details></section>'+rubric(l)
        prev='<a href="../'+D['lessons'][l['id']-2]['slug']+'/">← Предыдущий практикум</a>' if l['id']>1 else '<a href="../">← Программа</a>'
        nxt='<a href="../'+D['lessons'][l['id']]['slug']+'/">Следующий практикум →</a>' if l['id']<8 else '<a href="../notebook/">Мои работы и возвращения →</a>'
        b+='<nav class="sg-next" aria-label="Следующий шаг">'+prev+nxt+'</nav></div>'+payload(l)
        page(BASE+l['slug']+'/',l['title']+' — мастерская раскладов',l['aim'],b)
    # The notebook shares the tested record/snapshot/import UI, under a distinct app key.
    b=crumbs('../../../','Тетрадь мастерской')+'<div class="sg-module sw-module"><header class="sg-hero"><h1>Мои самостоятельные расклады</h1><p class="lead">Черновики, зафиксированные версии и наблюдения после возвращения.</p>'+progress()+'<p>Эта тетрадь хранится в браузере на этом устройстве. JSON переносит записи, TXT позволяет читать их отдельно. Импорт объединяет тетради этой мастерской; тетради прежних модулей открываются по своим ссылкам.</p>'+shared.notes_controls()+'<p id="sg-save-status" role="status"></p><p><a href="../">Программа мастерской</a> · <a href="/course/notebook/">Все мои тетради</a></p></header>'+dynamics.comparison()+'<section class="sg-section"><h2>Мои варианты</h2><label>Поиск по записям<input type="search" id="sg-search" disabled data-sg-enable></label><div id="sg-notes"></div><button class="button secondary" type="button" id="sg-more" hidden>Показать ещё</button></section><section class="sg-section"><h2>Сохранённые разборы и возвращения</h2><p>К снимку добавляются факты и пересмотр; исходный текст остаётся прежним.</p><div id="sg-snapshots"></div><button class="button secondary" type="button" id="sg-snap-more" hidden>Показать ещё снимки</button></section><noscript><p>Для записей и переноса тетради включите JavaScript.</p></noscript></div>'+payload()
    page(BASE+'notebook/','Тетрадь самостоятельных раскладов','Личные работы мастерской Таро и наблюдения после возвращения.',b,noindex=True)
