#!/usr/bin/env python3
"""Build the static course; no packages or network needed. Run from any directory."""
from pathlib import Path
from html import escape as E
from datetime import date
import json,math,re
import build_expansion as expansion
import build_reading_catalog as reading_catalog
import build_yetzirah as yetzirah
import build_book_studies as book_studies
import build_study_tools as study_tools
import build_book_modules as book_modules
import build_tarot_pairs as tarot_pairs
import build_tarot_triples as tarot_triples
import build_spread_grammar as spread_grammar
import build_tree_reading as tree_reading
import build_pathways as pathways
import build_court_relations as court_relations
import build_mixed_reading as mixed_reading
import build_reversal_study as reversal_study
import build_spread_dynamics as spread_dynamics
import build_spread_workshop as spread_workshop
import build_hekate as hekate
import design
ROOT=Path(__file__).resolve().parents[1]
D=json.loads((ROOT/'content/course.json').read_text());CFG=json.loads((ROOT/'content/site.json').read_text());ORIGIN=CFG['origin'].rstrip('/')
LESSONS=D['lessons'];routes=[]
BYID={l['id']:l for l in LESSONS}
# Program (navigation) order: ids stay as they are, only the path through them changes (SPEC §3).
ORDER=D.get('programOrder') or [l['id'] for l in LESSONS]
assert sorted(ORDER)==sorted(BYID), 'programOrder must be a permutation of the lesson ids'
PROGRAM=[BYID[i] for i in ORDER]
def in_module(i):return [l for l in PROGRAM if l['module']==i]
PAGE_DEFAULTS={'courseLead':'Первый круг: книги и карты вперемешку — 8 встреч по 10–20 минут. Вся программа — 45 уроков — ниже.','circleStart':'Начать первую встречу →','circleContinue':'Продолжить круг →','courseLibraryTitle':'После первого круга · библиотека','courseLibraryLead':'Книги, фрагменты Зоара и мастерская раскладов. Сюда не нужно заходить, пока идёт первый круг, — всё останется на месте.','circleDoneTitle':'Первый круг пройден','circleDoneText':'','landingSecondLink':'Начать с карты →','tarotFirstBlockTitle':'Можно начать отсюда: одна карта, потом вся колода','tarotFirstBlockText':'','notebookIntro':'Записи и прогресс хранятся только в этом браузере на этом устройстве и никуда не отправляются. Перед очисткой браузера или сменой устройства сохраните файл тетради.','booksIntroDone':'Я познакомился(-ась) с книгами','quizIntro':'Ошибиться здесь не страшно: ответ проверяется сразу, а подсказки ничего не отнимают — ни баллов, ни отметок.','completionTitle':'Урок завершён'}
PAGES={**PAGE_DEFAULTS,**(D.get('pages') or {})}
CIRCLE=D.get('firstCircle')
def plural(n,one,few,many):
 a,b=n%10,n%100
 return one if a==1 and b!=11 else few if 2<=a<=4 and not 12<=b<=14 else many
def time_range(L):
 m=re.match(r'\s*(\d+\s*[–-]\s*\d+\s*минут)',L.get('time') or '')
 return m.group(1) if m else '10–20 минут'
def circle_items():
 """First-circle items with resolved hrefs (root-absolute) for the page payload and the /course/ block."""
 if not CIRCLE:return []
 readings={r['id']:r for r in json.loads((ROOT/'content/readings88.json').read_text())['readings']}
 out=[]
 for it in CIRCLE['items']:
  k,ref=it['kind'],it['ref']
  if k=='intro':href,label,key='/course/books/','Введение','intro'
  elif k=='lesson':href,label,key=f'/course/{BYID[ref]["slug"]}/',f'Урок {ref}',f'l{ref}'
  else:
   r=readings[ref];href,label,key=f'/course/reading/{r["group"]}/#reading-{ref:02d}',f'Зоар · фрагмент {ref:02d}',f'r{ref}'
  out.append({'kind':k,'ref':ref,'key':key,'href':href,'label':label,'title':it['title'],'minutes':it.get('minutes','10–20'),'why':it.get('why','')})
 return out
CIRCLE_ITEMS=circle_items()
def linkify(html,links):
 for x in links or []:
  t=E(x['text'])
  if t in html:html=html.replace(t,f'<a href="{E(x["href"],quote=True)}">{t}</a>',1)
 return html
def para(text,links=None):
 """Section text: paragraphs are separated by a blank line; optional phrase links (lesson.links)."""
 return ''.join('<p>'+linkify(E(p.strip()),links)+'</p>' for p in re.split(r'\n\s*\n',text) if p.strip())
def table(t):
 heads=t.get('headers') or t.get('head') or []
 return '<div class="table-scroll" tabindex="0"><table>'+(f'<caption>{E(t["caption"])}</caption>' if t.get('caption') else '')+('<thead><tr>'+''.join(f'<th scope="col">{E(h)}</th>' for h in heads)+'</tr></thead>' if heads else '')+'<tbody>'+''.join('<tr>'+''.join(f'<td>{E(str(c))}</td>' for c in row)+'</tr>' for row in t.get('rows',[]))+'</tbody></table></div>'
def lesson_summary(L):return '<p class="lesson-summary">'+E(L['summary'])+'</p>' if L['summary']!=L['hook'] else ''
def btn(text,attrs='',secondary=False):return f'<button class="button {"secondary" if secondary else ""}" type="button" {attrs}>{text}</button>'
def chips(labels,attr):return '<div class="chips">'+''.join(f'<button type="button" {attr}="{i}">{E(t)}</button>' for i,t in enumerate(labels))+'</div>'
def rootprefix(path):return '../'*len([x for x in path.split('/') if x])
def tree():
 pts=[(250,45),(407,145),(93,145),(407,265),(93,265),(250,335),(407,435),(93,435),(250,505),(250,605)]
 edges=[(0,1),(0,2),(1,3),(2,4),(3,5),(4,5),(5,6),(5,7),(6,8),(7,8),(8,9)]
 s='<svg class="tree-visual" viewBox="0 0 500 663" role="group" aria-label="Учебное Древо десяти сефирот: нажмите на имя">'
 for a,b in edges:s+=f'<line class="tree-edge" x1="{pts[a][0]}" y1="{pts[a][1]}" x2="{pts[b][0]}" y2="{pts[b][1]}"/>'
 for i,((x,y),d) in enumerate(zip(pts,D['sefirot'])):
  s+=f'<g class="tree-node" role="button" tabindex="0" aria-label="{E(d[0]+", "+d[2])}" data-node="{i}"><circle cx="{x}" cy="{y}" r="38"/><text x="{x}" y="{y-1}" text-anchor="middle">{i+1}</text><text class="he" x="{x}" y="{y+19}" text-anchor="middle">{d[1]}</text><text x="{x}" y="{y+60}" text-anchor="middle">{d[0]}</text></g>'
 return s+'</svg>'
def symbols(kind):
 if kind=='river':return design.diagram('b-light/rivers.svg')
 if kind=='rose':return design.diagram('c-images/rose.svg')
 if kind=='hermit':return design.diagram('c-images/hermit.svg')
 return design.diagram('b-light/soul.svg' if kind=='soul' else 'a-tree/balance-triad.svg')
def lab(kind,L=None):
 if kind=="study":return expansion.study(L)
 if kind=="gematria":return expansion.gematria()
 if kind in ('sort','observe','pair'):return lab_static(kind,L)
 titles={'tree':'Посмотрите, как связаны сефирот','worlds':'Четыре мира, десять сефирот','timeline':'Поставим события на свои места','letters':'Из чего складываются 32 пути','permutations':'Соберите шесть сочетаний','river':'Проследите путь от рек к морю','rose':'Рассмотрим образ по слоям','soul':'Три уровня и их связь','balance':'Щедрость, мера и согласование','luria':'Пройдём по рассказу шаг за шагом','layers':'Чья это мысль?','context':'Книга, толкование и поступок','deck':'Найдите место карты в колоде','hermit':'Посмотрим внимательно','permutations-alef':'Соберите шесть порядков'}
 s=f'<div class="lab" data-lab="{kind}"><h3>{titles[kind]}</h3>'
 detail='<div class="lab-detail" data-detail aria-live="polite"></div>'
 if kind=='tree':s+='<p>Нажимайте на имена. Начните с верхней тройки, затем найдите милость, меру и их согласование.</p><div class="lab-split">'+tree()+detail+'</div><div class="chips"><button data-tree-group="0,1,2" type="button">Верхняя тройка</button><button data-tree-group="3,4,5" type="button">Милость и мера</button><button data-tree-group="6,7,8,9" type="button">К Малхут</button></div>'+btn('Найти на Древе','data-tree-task',True)+'<p class="feedback" data-tree-feedback aria-live="polite">Когда освоитесь, попробуйте найти имя без подсказки.</p><p class="diagram-caption">Условная схема нескольких связей. Она не задаёт универсальные 22 пути или соответствия картам Таро.</p>'
 elif kind=='worlds':s+='<p>Выберите мир. Затем обратите внимание: десять сефирот рассматриваются на каждом уровне.</p><div class="worlds-grid">'+''.join(f'<button type="button" data-world="{i}">{x[0]}<small>{x[1]}</small></button>' for i,x in enumerate(D['worlds']))+'</div><div class="dot-row" aria-label="Десять сефирот">'+''.join('<span></span>' for i in range(10))+'</div>'+detail
 elif kind=='timeline':s+='<p>Выберите период, чтобы прочитать, что тогда менялось.</p><div class="time-list">'+''.join(f'<button type="button" data-time="{i}"><b>{E(x[0])}</b>{E(x[1])}</button>' for i,x in enumerate(D['timeline']))+'</div>'+detail
 elif kind=='letters':s+='<div class="formula">10 + 22 = 32</div><p>Десять сефирот и двадцать две буквы. А сами буквы разделены на три группы:</p>'+chips(['3 матери','7 двойных','12 простых'],'data-letter-group')+'<div class="letters" data-letters lang="he" dir="rtl"></div>'+detail
 elif kind=='permutations':s+='<p>Нажмите на три буквы в любом порядке. Сколько разных порядков Вы найдёте, если каждый знак можно использовать только один раз?</p><div class="chips">'+''.join(f'<button type="button" data-letter="{c}">{c}</button>' for c in 'АБВ')+'</div><div class="permutation-result" data-perm aria-live="polite"></div>'+btn('Следующий порядок','data-perm-next',True)+'<p class="feedback" data-perm-feedback aria-live="polite">Начните с любой буквы.</p><p data-perm-count>0 из 6</p><div class="found" data-found></div><p class="diagram-caption">А, Б, В — учебные обозначения. Считаем перестановки трёх различимых знаков, чтобы понять образ «камней и домов».</p>'
 elif kind=='permutations-alef':s+='<p>Соберите шесть порядков трёх букв: алеф, мем и шин — трёх «матерей» из урока 9. Нажимайте буквы; в одном порядке каждый знак используется один раз.</p><div class="chips">'+''.join(f'<button type="button" lang="he" data-letter="{c}">{c}</button>' for c in 'אמש')+'</div><div class="permutation-result perm-ltr" data-perm aria-live="polite"></div>'+btn('Следующий порядок','data-perm-next',True)+'<p class="feedback" data-perm-feedback aria-live="polite">Начните с любой буквы.</p><p data-perm-count>0 из 6</p><div class="found perm-ltr" data-found></div><p class="diagram-caption">א — алеф, מ — мем, ש — шин. У этих сочетаний нет привычного для нас значения: удобно наблюдать, как работает внимание, когда смысл не подсказывает порядок. Последовательность нажатий показана слева направо.</p>'
 elif kind in ['river','rose','soul','balance']:
  names={'river':['Реки','Море','Ниже по течению'],'rose':['Образ','Соответствие','Комментарий'],'soul':['Нефеш','Руах','Нешама'],'balance':['Щедрость','Мера','Согласование']}[kind]
  s+=symbols(kind)+chips(names,'data-symbol-step')+detail
 elif kind=='luria':
  s+='<p>Выберите номер. Следите, какой вопрос появляется после предыдущего шага.</p><div class="lab-stepper">'+''.join(f'<button type="button" data-luria="{i}" aria-label="{E(t[0])}">{i+1}</button>' for i,t in enumerate(D['luria']))+'</div><div class="luria-symbol">'
  for i in range(6):s+=re.sub(r'aria-label="[^"]*"','aria-label="Условный образ: '+E(D['luria'][i][0])+'"',design.diagram(f'b-light/luria-{i}.svg'),count=1)
  s+='</div>'+detail
 elif kind=='layers':s+='<p>Отличите слова текста, пояснение редакции и собственный отклик.</p><p class="sort-prompt" data-sort-prompt></p><div class="chips">'+''.join(f'<button type="button" data-sort="{i}">{t}</button>' for i,t in enumerate(['Наблюдение','Пояснение источника','Личная ассоциация']))+'</div><p class="feedback" data-sort-feedback aria-live="polite"></p>'+btn('Другая фраза','data-sort-next',True)
 elif kind=='context':s+=chips(['Писание','Толкование','Практика'],'data-context')+detail
 elif kind=='deck':s+='<div class="formula">22 + 4 × 14 = 78</div><div class="deck-grid">'+''.join(f'<div class="deck-unit"><b>{sym}</b><span>{name}<br>10 + 4 карты</span></div>' for sym,name in [('Ⅰ','Жезлы'),('Ⅱ','Кубки'),('Ⅲ','Мечи'),('Ⅳ','Пентакли')])+'</div><h4 data-deck-card></h4><div class="chips">'+''.join(f'<button type="button" data-deck-type="{i}">{t}</button>' for i,t in enumerate(['Старший аркан','Придворная','Числовая']))+'</div><p class="feedback" data-deck-feedback aria-live="polite"></p>'+btn('Следующая карта','data-deck-next',True)
 elif kind=='hermit':s+='<div class="lab-split">'+symbols('hermit')+detail+'</div>'+chips(['Сначала вижу','Читаю Уэйта','Задаю свой вопрос'],'data-hermit')
 return s+'<noscript><p>Чтобы переключать схему и выполнять это упражнение, включите JavaScript. Текст урока и источники доступны без него.</p></noscript></div>'
def lab_static(kind,L,data=None):
 """Readable placeholder for the new §4 lab kinds (sort, observe, pair) until their interactive engine lands:
 the task and its material are shown as text, so the lesson stays usable without the widget."""
 d=data if data is not None else (L.get('labData') or {})
 titles={'sort':'Разложим по полкам','observe':'Сначала — только то, что видно','pair':'Две карты в двух порядках'}
 s=f'<div class="lab lab-static" data-lab-static="{kind}"><h3>{titles[kind]}</h3>'+(para(d['instruction']) if d.get('instruction') else '')
 if kind=='sort':
  s+='<p class="fine">Полки: '+' · '.join(E(x) for x in d.get('shelves',[]))+'</p><ol class="sort-static">'+''.join(f'<li>{E(it["text"])}<details><summary>Подсказка</summary><p>{E(it.get("hint",""))}</p></details></li>' for it in d.get('items',[]))+'</ol>'
 elif kind in ('observe','pair'):
  ids=[d.get('card')] if kind=='observe' else [d.get('a'),d.get('b')]
  s+='<div class="tarot-grid lesson-cards">'+''.join(expansion.card(expansion.CARDS[i],observe=True,anchor=False) for i in ids if i in expansion.CARDS)+'</div>'
 return s+'</div>'
def lessonlist(items,prefix,current=0):
 return '<ol class="lesson-list">'+''.join(f'<li data-search-item="lessons"><a href="{prefix}course/{l["slug"]}/" {"aria-current=page" if current==l["id"] else ""}><span class="num">{l["id"]:02d}</span><span>{E(l["title"])}</span><span class="done-mark" data-lesson-status="{l["id"]}"></span></a></li>' for l in items)+'</ol>'
def progress():return '<div class="progress-line" role="presentation"><i data-progress-fill></i></div><small data-progress-text>0 из 45 уроков завершено</small>'
HEKATE_FEATURE='<section class="books-start" id="hekate-line"><div><p class="eyebrow">Ритуальная магия · новая большая линия</p><h2>Геката, каббала и Таро</h2><p>28 занятий: от античных гимнов и теургии к Жрице, образу врат и герметическим соответствиям. Примеры, самостоятельные работы, возвращение к изученному и отдельная тетрадь.</p><p><a href="/course/hekate/bridges/">Как связаны три линии →</a></p></div><a class="button" href="/course/hekate/">Открыть маршрут →</a></section>'
SPREAD_PROMO='<section class="books-start"><div><p class="eyebrow">Ветвь Таро · завершённая ступень</p><h2>Мастерская самостоятельного расклада</h2><p>Восемь практикумов: от разбора с подсказками к собственному вопросу, схеме, обоснованию и возвращению к записи.</p><p><a href="/course/tarot/#reading-route">Весь маршрут раскладов →</a></p></div><a class="button" href="/course/spread-workshop/">Начать практику →</a></section>'
def page(path,title,description,body,kind='page',L=None,noindex=False):
 if path in ('/course/tarot/','/course/book-studies/'):body+=HEKATE_FEATURE
 if path=='/course/':body=body.replace('<!--circle-promos-->',HEKATE_FEATURE+SPREAD_PROMO,1)

 if path=='/course/tarot/':
  body=body.replace('<!--/tarot-first-->',spread_workshop.route(),1)
  title='Таро: полный маршрут от первой карты к самостоятельному раскладу'
  description='Все ступени изучения Таро: 78 карт, пары, тройки, Древо, пути, придворные, динамика и итоговая мастерская.'
 if path=='/course/notebook/':
  sec='<section class="section"><h2>Мои самостоятельные расклады</h2><p>Работы итоговой мастерской, снимки версий и возвращения к наблюдениям.</p><a href="/course/spread-workshop/notebook/">Тетрадь мастерской →</a></section>';k=body.rfind('</details>');body=body[:k]+sec+body[k:]
 if path=='/course/spread-dynamics/' or path=='/course/spread-dynamics/record-and-revisit/':
  body+='<section class="section"><p class="eyebrow">Следующая ступень</p><h2>Собрать самостоятельный расклад</h2><p>Соедините изученное в мастерской: вопрос, схема, связи карт, обоснование и собственные наблюдения.</p><a class="button" href="/course/spread-workshop/">Перейти к восьми практикумам →</a></section>'
 prefix=rootprefix(path);url=ORIGIN+path;author={'@type':'Person','name':D['author'],'url':ORIGIN+'/author/'}
 schema={'@context':'https://schema.org','@graph':[{'@type':'WebPage','@id':url+'#page','url':url,'name':title,'description':description,'inLanguage':'ru','isPartOf':{'@id':ORIGIN+'/#website'}},{'@type':'WebSite','@id':ORIGIN+'/#website','name':'Каббала и Таро','url':ORIGIN+'/','inLanguage':'ru'}]}
 if L:schema['@graph']+=[{'@type':'Article','headline':L['title'],'description':description,'author':author,'dateModified':CFG['updated'],'inLanguage':'ru','mainEntityOfPage':url,'isPartOf':{'@type':'Course','name':D['title'],'url':ORIGIN+'/course/'}},{'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Главная','item':ORIGIN+'/'},{'@type':'ListItem','position':2,'name':'Курс','item':ORIGIN+'/course/'},{'@type':'ListItem','position':3,'name':L['title'],'item':url}]}]
 if path=='/course/':schema['@graph'].append({'@type':'Course','@id':url+'#course','name':D['title'],'description':description,'inLanguage':'ru','isAccessibleForFree':True,'educationalLevel':'Beginner','provider':author,'hasPart':[{'@type':'LearningResource','name':x['title'],'url':ORIGIN+'/course/'+x['slug']+'/','position':x['id']} for x in LESSONS]})
 if path=='/author/':schema['@graph'].append(author)
 payload={'root':prefix,'order':ORDER,'modules':[m['title'] for m in D['modules']],'circle':[{k:x[k] for k in ['key','href','label','title','minutes']} for x in CIRCLE_ITEMS],'pages':{k:PAGES[k] for k in ['completionTitle','circleStart','circleContinue']},'lessons':[{'id':l['id'],'slug':l['slug'],'title':l['title'],'module':l['module'],'time':time_range(l),**({'qv':l['quizVersion']} if isinstance(l.get('quizVersion'),int) else {})} for l in LESSONS],**{k:D[k] for k in ['sefirot','worlds','timeline','luria']}}
 if L:payload['lesson']={**{k:L[k] for k in ['id','quiz','module']},'qv':L.get('quizVersion'),'aim':L.get('aim',''),'keyword':L.get('keyword',''),'scaffold':L.get('scaffold') or []}
 jsonsafe=lambda x:json.dumps(x,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
 nav=''.join(f'<a href="{prefix}{loc}" {"aria-current=page" if path=="/"+loc else ""}>{txt}</a>' for loc,txt in [('course/','Курс'),('course/books/','О книгах'),('course/tarot/','Таро'),('course/atlas/','Схемы'),('course/reading/','Читаем Зоар'),('course/glossary/','Словарь'),('course/notebook/','Моя тетрадь')])
 catalog_script=f'<script defer src="{prefix}assets/course/reading-catalog.js"></script>' if path=='/course/reading/catalog/' else ''
 html=f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#122e3b"><title>{E(title)} | Элиора Вейра</title><meta name="description" content="{E(description,quote=True)}"><meta name="author" content="Элиора Вейра"><meta name="robots" content="{'noindex,follow' if noindex else 'index,follow,max-image-preview:large'}"><link rel="canonical" href="{url}"><meta property="og:type" content="{'article' if L else 'website'}"><meta property="og:locale" content="ru_RU"><meta property="og:site_name" content="Каббала и Таро"><meta property="og:title" content="{E(title,quote=True)}"><meta property="og:description" content="{E(description,quote=True)}"><meta property="og:url" content="{url}"><meta property="og:image" content="{ORIGIN}/assets/beginning.jpg"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="{prefix}assets/course/course.css"><link rel="icon" href="{prefix}assets/course/icon.svg"><script type="application/ld+json">{jsonsafe(schema)}</script></head><body><a class="skip" href="#main">Перейти к содержанию</a><header class="top"><div class="top-inner"><a class="wordmark" href="{prefix or './'}" aria-label="Каббала и Таро — главная">Каббала<span><i>и</i> Таро</span></a><nav aria-label="Разделы курса">{nav}</nav><a class="author" href="{prefix}author/">Элиора Вейра</a></div></header><main class="wrap" id="main">{body}</main><footer class="footer"><div>Каббала и Таро · Элиора Вейра · 2026<br>Знакомиться можно постепенно. Возвращаться — сколько угодно.</div><div><a href="{prefix}author/">Об авторе и курсе</a><a href="{prefix}course/reading/#sources">Источники</a><a href="{prefix}course/notebook/">Тетрадь и перенос записей</a></div></footer><script id="course-data" type="application/json">{jsonsafe(payload)}</script><script defer src="{prefix}assets/course/state.js"></script><script defer src="{prefix}assets/course/readings-data.js"></script><script defer src="{prefix}assets/course/app.js"></script><script defer src="{prefix}assets/course/extensions.js"></script>{catalog_script}</body></html>'''
 if path.startswith('/course/yetzirah/'):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/yetzirah.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/yetzirah-state.js"></script><script defer src="{prefix}assets/course/yetzirah.js"></script></body>')
 if path.startswith(('/course/tomer-devorah/','/course/bahir/','/course/book-modules/')):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/yetzirah.css"><link rel="stylesheet" href="{prefix}assets/course/book-modules.css"></head>')
  if path!='/course/book-modules/':html=html.replace('</body>',f'<script defer src="{prefix}assets/course/book-state.js"></script><script defer src="{prefix}assets/course/book-modules.js"></script></body>')
 if path=='/course/tarot-pairs/':
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/tarot-pairs.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/tarot-pairs-core.js"></script><script defer src="{prefix}assets/course/tarot-pairs.js"></script></body>')
 if path=='/course/tarot-triples/':
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/tarot-pairs.css"><link rel="stylesheet" href="{prefix}assets/course/tarot-triples.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/tarot-pairs-core.js"></script><script defer src="{prefix}assets/course/tarot-triples-core.js"></script><script defer src="{prefix}assets/course/tarot-triples.js"></script></body>')
 if path.startswith(('/course/spread-grammar/','/course/tree-reading/')):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/spread-grammar.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/tarot-pairs-core.js"></script><script defer src="{prefix}assets/course/spread-grammar-atlas.js"></script><script defer src="{prefix}assets/course/spread-grammar-core.js"></script><script defer src="{prefix}assets/course/spread-grammar.js"></script></body>')
 if path.startswith('/course/tree-reading/'):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/tree-reading.css"></head>').replace('spread-grammar-core.js"','spread-grammar-core.js?v=2"').replace('spread-grammar.js"','spread-grammar.js?v=2"')
 if path.startswith('/course/spread-dynamics/'):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/spread-grammar.css"><link rel="stylesheet" href="{prefix}assets/course/tree-reading.css"><link rel="stylesheet" href="{prefix}assets/course/mixed-reading.css"><link rel="stylesheet" href="{prefix}assets/course/spread-dynamics.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/tarot-pairs-core.js"></script><script defer src="{prefix}assets/course/spread-grammar-core.js?v=3"></script><script defer src="{prefix}assets/course/spread-grammar-atlas.js"></script><script defer src="{prefix}assets/course/spread-dynamics-core.js"></script><script defer src="{prefix}assets/course/spread-dynamics.js"></script><script defer src="{prefix}assets/course/spread-grammar.js?v=6"></script></body>')
 if path.startswith('/course/reversal-study/'):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/spread-grammar.css"><link rel="stylesheet" href="{prefix}assets/course/tree-reading.css"><link rel="stylesheet" href="{prefix}assets/course/mixed-reading.css"><link rel="stylesheet" href="{prefix}assets/course/reversal-study.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/tarot-pairs-core.js"></script><script defer src="{prefix}assets/course/spread-grammar-core.js?v=3"></script><script defer src="{prefix}assets/course/spread-grammar-atlas.js"></script><script defer src="{prefix}assets/course/reversal-study-core.js"></script><script defer src="{prefix}assets/course/reversal-study.js"></script><script defer src="{prefix}assets/course/spread-grammar.js?v=5"></script></body>')
 if path.startswith('/course/mixed-reading/'):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/spread-grammar.css"><link rel="stylesheet" href="{prefix}assets/course/tree-reading.css"><link rel="stylesheet" href="{prefix}assets/course/mixed-reading.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/tarot-pairs-core.js"></script><script defer src="{prefix}assets/course/spread-grammar-core.js?v=3"></script><script defer src="{prefix}assets/course/spread-grammar-atlas.js"></script><script defer src="{prefix}assets/course/mixed-reading-core.js"></script><script defer src="{prefix}assets/course/mixed-reading.js"></script><script defer src="{prefix}assets/course/spread-grammar.js?v=4"></script></body>')
 if path.startswith('/course/court-relations/'):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/spread-grammar.css"><link rel="stylesheet" href="{prefix}assets/course/court-relations.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/spread-grammar-core.js?v=3"></script><script defer src="{prefix}assets/course/court-relations-atlas.js"></script><script defer src="{prefix}assets/course/court-relations-core.js"></script><script defer src="{prefix}assets/course/court-relations.js"></script></body>')
 if path.startswith('/course/pathways/'):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/spread-grammar.css"><link rel="stylesheet" href="{prefix}assets/course/pathways.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/spread-grammar-core.js?v=3"></script><script defer src="{prefix}assets/course/pathways-atlas.js"></script><script defer src="{prefix}assets/course/pathways-core.js"></script><script defer src="{prefix}assets/course/pathways.js"></script></body>')
 if path=='/course/bahir/letters-and-number/':html=html.replace('book-modules.js','book-modules.js?v=2').replace('book-modules.css','book-modules.css?v=2')
 if path.startswith(('/course/shaarei-orah/','/course/mystical-qabalah/','/course/book-of-thoth/','/course/pardes-rimmonim/','/course/tanya/','/course/etz-chaim/','/course/book-t/','/course/daat-tevunot/','/course/tarot-bohemians/','/course/nefesh-hachaim/','/course/levi-dogma-ritual/','/course/shaarei-kedusha/','/course/pictorial-key/','/course/derekh-hashem/','/course/mathers-tarot/','/course/kalach-pitchei-chokhmah/','/course/kabbalah-unveiled/','/course/book-studies/')):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/yetzirah.css"><link rel="stylesheet" href="{prefix}assets/course/book-studies.css"></head>')
  if path!='/course/book-studies/':html=html.replace('</body>',f'<script defer src="{prefix}assets/course/study-state.js"></script><script defer src="{prefix}assets/course/book-studies.js"></script></body>')
 if path.startswith(('/course/etz-chaim/','/course/book-t/')):
  html=html.replace('study-state.js"','study-state.js?v=3"')
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/book-workshops.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/book-workshops-core.js"></script><script defer src="{prefix}assets/course/book-workshops.js"></script></body>')
 if path.startswith(('/course/daat-tevunot/','/course/tarot-bohemians/')):
  html=html.replace('study-state.js"','study-state.js?v=4"')
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/book-workshops.css"><link rel="stylesheet" href="{prefix}assets/course/book-inquiry.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/book-inquiry-core.js"></script><script defer src="{prefix}assets/course/book-inquiry.js"></script></body>')
 if path.startswith(('/course/nefesh-hachaim/','/course/levi-dogma-ritual/','/course/shaarei-kedusha/','/course/pictorial-key/')):
  html=html.replace('study-state.js"','study-state.js?v=5"')
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/book-workshops.css"><link rel="stylesheet" href="{prefix}assets/course/book-inquiry.css"><link rel="stylesheet" href="{prefix}assets/course/book-close.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/book-inquiry-core.js"></script><script defer src="{prefix}assets/course/book-inquiry.js?v=2"></script><script defer src="{prefix}assets/course/book-close-core.js"></script><script defer src="{prefix}assets/course/book-close.js"></script></body>')
 if path.startswith(('/course/shaarei-kedusha/','/course/pictorial-key/')):
  html=html.replace('study-state.js?v=5','study-state.js?v=6')
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/book-evidence.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/book-evidence.js"></script></body>')
 if path.startswith(('/course/derekh-hashem/','/course/mathers-tarot/')):
  html=html.replace('study-state.js"','study-state.js?v=7"')
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/book-workshops.css"><link rel="stylesheet" href="{prefix}assets/course/book-close.css"><link rel="stylesheet" href="{prefix}assets/course/book-audit.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/book-audit.js"></script></body>')
 if path.startswith(('/course/kalach-pitchei-chokhmah/','/course/kabbalah-unveiled/')):
  html=html.replace('study-state.js"','study-state.js?v=8"')
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/book-workshops.css"><link rel="stylesheet" href="{prefix}assets/course/book-close.css"><link rel="stylesheet" href="{prefix}assets/course/book-audit.css?v=2"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/book-audit.js?v=2"></script></body>')
 if path.startswith('/course/pardes-rimmonim/'):
  html=html.replace('study-state.js\"','study-state.js?v=2\"').replace('book-studies.js\"','book-studies.js?v=2\"').replace('book-studies.css\"','book-studies.css?v=2\"')
 if path.startswith(('/course/study-tools/','/course/reading-workshop/','/course/compare-authors/','/course/argument-clinic/')):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/study-tools.css"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/study-tools-core.js"></script><script defer src="{prefix}assets/course/study-tools.js?v=2"></script></body>')
 if path in ('/course/tarot-pairs/','/course/tarot-triples/'):
  html=html.replace('</body>',f'<script defer src="{prefix}assets/course/reasoning-prompts.js?v=2"></script></body>')
 if path.startswith('/course/hekate/'):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/hekate.css?v=1"></head>').replace('</body>',f'<script defer src="{prefix}assets/course/hekate-core.js?v=1"></script><script defer src="{prefix}assets/course/hekate.js?v=1"></script></body>')
 if path=='/course/tarot/' or path.startswith('/course/spread-workshop/'):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/spread-workshop.css?v=1"></head>')
 if path.startswith('/course/spread-workshop/'):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/spread-grammar.css"><link rel="stylesheet" href="{prefix}assets/course/tree-reading.css"><link rel="stylesheet" href="{prefix}assets/course/mixed-reading.css"><link rel="stylesheet" href="{prefix}assets/course/spread-dynamics.css"></head>')
  html=html.replace('</body>',f'<script defer src="{prefix}assets/course/tarot-pairs-core.js"></script><script defer src="{prefix}assets/course/spread-grammar-core.js?v=3"></script><script defer src="{prefix}assets/course/spread-grammar-atlas.js"></script><script defer src="{prefix}assets/course/spread-dynamics-core.js"></script><script defer src="{prefix}assets/course/spread-dynamics.js"></script><script defer src="{prefix}assets/course/spread-grammar.js?v=6"></script><script defer src="{prefix}assets/course/spread-workshop.js?v=1"></script></body>')
 rel=path.strip('/')+'/index.html' if path!='/' else 'index.html';html=design.finish(rel,html)
 out=ROOT/path.strip('/')/'index.html' if path!='/' else ROOT/'index.html';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(html+'\n')
 if not noindex:routes.append(path)
def crumbs(prefix,title=None):return '<nav class="crumb" aria-label="Путь к странице"><span><a href="'+prefix+'">Главная</a></span><span><a href="'+prefix+'course/">Курс</a></span>'+(('<span>'+E(title)+'</span>') if title else '')+'</nav>'
def sources(ids):return ''.join(f'<p class="fine"><a href="{E(D["sources"][i]["url"],quote=True)}" target="_blank" rel="noopener noreferrer">{E(D["sources"][i]["title"])}</a><br>{E(D["sources"][i]["detail"])}</p>' for i in ids)
# Books orientation is available before the numbered lessons and needs no JavaScript.
body=crumbs('../../','Тора, Талмуд, Зоар')+(ROOT/'content/books.html').read_text()
# First-circle meeting 1 is this introduction: a tick marks it (state.intro), nothing else is required.
body+='<section class="section intro-done" id="intro-done"><h2>Первая встреча круга</h2><p>Если общая картина сложилась — три обложки, роза и вопрос к ним, — отметьте это. Прогресс первого круга на странице курса учтёт отметку.</p><label class="self-check"><input type="checkbox" data-intro-done><span>'+E(PAGES['booksIntroDone'])+'</span></label><p class="feedback" data-intro-status role="status" hidden></p><div class="actions"><a class="button" href="../jewish-context/">Дальше: урок 1 →</a><a class="button secondary" href="../#first-circle">Весь первый круг</a></div><p class="fine">Подробное чтение отдельных книг — в <a href="../book-studies/">библиотеке курса</a>; к ней удобно прийти после первого круга.</p></section>'
page('/course/books/','Тора, Талмуд и Зоар — подробное знакомство с книгами','Что такое Тора, Танах, Мишна, Талмуд и Зоар: устройство книг, примеры чтения, комментарий Сулам и понятные объяснения для начинающих.',body)
# Course overview
# First circle (SPEC §3 firstCircle): its own progress derived from lesson done flags, readings[id].done and state.intro.
def circle_block():
 if not CIRCLE_ITEMS:return ''
 items=''.join(f'<li data-circle-item="{x["key"]}"><a href="{E(x["href"],quote=True)}"><span class="circle-num">{n}</span><span class="circle-body"><small>{E(x["label"])} · {E(x["minutes"])} мин</small><b>{E(x["title"])}</b><span class="circle-why">{E(x["why"])}</span></span><span class="done-mark" data-circle-mark="{x["key"]}"></span></a></li>' for n,x in enumerate(CIRCLE_ITEMS,1))
 forks=''.join(f'<a class="button secondary" href="{BYID[f["ref"]]["slug"]}/">{E(f["title"])}: урок {f["ref"]} →</a>' for f in CIRCLE.get('forks',[]))
 total=len(CIRCLE_ITEMS)
 return f'<section class="section first-circle" id="first-circle" aria-labelledby="circle-title"><p class="eyebrow">{total} {plural(total,"встреча","встречи","встреч")} по 10–20 минут · <span data-circle-count>0 из {total}</span></p><h2 id="circle-title">{E(CIRCLE.get("title","Первый круг"))}</h2><p class="lead">{E(PAGES["courseLead"])}</p><div class="progress-line" role="presentation"><i data-circle-fill></i></div><ol class="circle-list">{items}</ol><div class="actions"><a class="button" data-circle-resume href="{E(CIRCLE_ITEMS[0]["href"],quote=True)}">{E(PAGES["circleStart"])}</a></div><details class="circle-after" id="circle-after" data-circle-after><summary><span class="eyebrow">После восьми встреч</span><strong>{E(PAGES["circleDoneTitle"])}</strong></summary>'+para(CIRCLE.get('done',''))+f'<div class="actions">{forks}</div>'+(para(PAGES['circleDoneText']) if PAGES['circleDoneText'] else '')+'<!--circle-promos--></details></section>'
body='<section class="hero-course"><div><p class="eyebrow">Бесплатный вводный курс</p><h1>Сначала — интерес.<br><em>Потом — понимание.</em></h1><p class="lead">Если Вы уже пытались читать о каббале и запутались в первых же терминах — Вы не одиноки. Здесь начнём спокойно: один небольшой урок, одна понятная схема, несколько вопросов. Так постепенно и сложится целая картина.</p><div class="actions"><a class="button" data-circle-resume href="'+(CIRCLE_ITEMS[0]['href'] if CIRCLE_ITEMS else 'jewish-context/')+'">'+E(PAGES['circleStart'])+'</a><a href="#program">Вся программа: 45 уроков ↓</a></div><div class="hero-meta"><span><strong>45</strong> уроков</span><span><strong>888</strong> фрагментов Зоара</span><span>В своём темпе</span></div><div class="index-progress">'+progress()+'</div></div><figure class="cover"><picture><source type="image/webp" srcset="../assets/img/beginning-640.webp 640w, ../assets/img/beginning-960.webp 960w, ../assets/img/beginning-1280.webp 1280w" sizes="(max-width: 760px) calc(100vw - 44px), 40vw"><img src="../assets/beginning.jpg" width="1536" height="1024" fetchpriority="high" alt="Открытая книга и карты у золотого дерева под ночным небом" decoding="async"></picture></figure></section>'
body+=circle_block()
body+='<section class="section"><div class="features"><div><h3>Можно начать с нуля</h3><p>Иврит знать не нужно, названия сефирот тоже пока учить не придётся. Сначала разберёмся со словами, а затем увидим их в тексте.</p></div><div><h3>Будем читать, а не пересказывать легенды</h3><p>Возьмём небольшие отрывки Зоара и разберём их рядом со схемами. Для цитат и пересказов укажем источники, чтобы всё можно было проверить.</p></div><div><h3>Свои мысли не потеряются</h3><p>Вопросы, заметки и пройденные уроки сохраняются в этом браузере. Тетрадь можно выгрузить и перенести на другое устройство.</p></div></div></section><section class="section" id="program"><div class="section-head"><h2>Как устроен курс</h2><p>Можно идти по порядку, а можно открыть тему, которая зацепила именно Вас. Все уроки уже доступны.</p><p><a class="button secondary" data-resume href="jewish-context/">Начать первый урок</a></p></div><label for="lesson-search" class="fine">Найти тему</label><br><input class="search" id="lesson-search" data-search="lessons" type="search" placeholder="Например, Зоар или четыре мира"><span class="status-text" data-search-status="lessons" aria-live="polite"></span><div class="program">'
for i,m in enumerate(D['modules']):body+=f'<details class="module" {"open" if i==0 else ""}><summary>{design.emblem("../","em-tree" if i==1 else f"em-s{i+1:02d}","module-emblem")}<p class="eyebrow">Раздел {i+1} · <span data-module-count="{i}"></span>{len(in_module(i))} {plural(len(in_module(i)),"занятие","занятия","занятий")}</p><h3>{m["title"]}</h3><small>{m["subtitle"]}</small></summary>{lessonlist(in_module(i),"../")}</details>'
body+='</div><div data-all-done hidden class="course-done"><h3>Все 45 уроков пройдены</h3><p>Теперь выберите один отрывок, который хочется перечитать. Часто после курса в знакомом тексте обнаруживается совсем другой вопрос.</p><a class="button" href="notebook/">Открыть тетрадь</a></div></section><section class="section"><h2>Что здесь соединяет каббалу и Таро?</h2><p>Интерес к символам и умение читать внимательно. Можно чередовать еврейские тексты, историю западной эзотерики и работу с картами с самого начала. В новом маршруте эти занятия идут рядом: прочитать сцену, рассмотреть образ, задать свой вопрос. Вы сможете творчески работать с образами и при этом видеть, какой автор, книга или школа стоит за объяснением.</p><a href="../author/">Несколько слов о замысле курса →</a></section>'
body+='<details class="library" id="library"><summary><span class="eyebrow">Библиотека курса</span><strong>'+E(PAGES['courseLibraryTitle'])+'</strong><span class="library-lead">'+E(PAGES['courseLibraryLead'])+'</span></summary><div class="library-doors"><section><h3>Читать книги</h3><p>Отдельные книги подробно: Сефер Йецира, Томер Двора, Бахир и ещё семнадцать модулей с тетрадями.</p><p><a href="book-studies/">Выбрать книгу →</a></p></section><section><h3>Читать Зоар</h3><p>888 коротких фрагментов, из них 88 встреч с пояснениями и вопросом.</p><p><a href="reading/">888 встреч с Зоаром →</a></p></section><section><h3>Раскладывать</h3><p>Все занятия Таро и 78 карт, пары и тройки, мастерская самостоятельного расклада.</p><div class="actions"><a class="button secondary" href="tarot/">Все занятия Таро и 78 карт</a>'+design.fragment('course/deck-link.html')+'</div></section></div><p class="fine">Ещё — <a href="ritual-magic/">европейская ритуальная магия</a>: тексты, символы и линия «Геката, каббала и Таро».</p>'
body+='<section class="books-start"><div><p class="eyebrow">Новый модуль · 12 занятий</p><h2>Сефер Йецира: от выписки к своему комментарию</h2><p>Читаем, собираем схемы и сравниваем редакции. 231 врата, камни и дома, три матери и проверенные параллели двух текстов.</p></div><a class="button" href="yetzirah/">Открыть модуль →</a></section>'
body+='<section class="books-start"><div><p class="eyebrow">Два новых модуля · 24 занятия</p><h2>Томер Двора и Бахир</h2><p>У Кордоверо — нравственные качества и жизненные ситуации. В «Бахире» — притчи, вопросы, буквенные и числовые толкования. Подробные пояснения, 48 вопросов для самопроверки и две отдельные тетради.</p><p><a href="tomer-devorah/">Томер Двора →</a> · <a href="bahir/">Бахир →</a></p></div><a class="button" href="book-modules/">Все модули по книгам →</a></section>'
body+='<section class="books-start"><div><p class="eyebrow">Искусство расклада · отдельный модуль</p><h2>Четыре карты: уровни, пары и пространство</h2><p>12 занятий с каббалистическими опорами: часть и целое, четыре мира, пары пар, место карты и наблюдение во времени.</p></div><a class="button" href="spread-grammar/">Открыть модуль →</a></section>'
body+='<section class="books-start"><div><p class="eyebrow">Продолжение искусства расклада · 8 занятий</p><h2>Древо сефирот: от текста к целому раскладу</h2><p>Каббалистические источники, три столпа, две связанные триады и десять позиций Древа. Учимся различать сефиру позиции, соответствие карты и мир масти.</p></div><a class="button" href="tree-reading/">Перейти к новой ступени →</a></section>'
body+='<section class="books-start"><div><p class="eyebrow">Следующая ступень · 6 занятий</p><h2>22 пути: Старшие арканы и связи Древа</h2><p>Полный атлас путей, чтение двух и трёх арканов, цепи и развилки, направление и перевёрнутость. От точного соответствия — к самостоятельному объяснению.</p></div><a class="button" href="pathways/">Исследовать пути →</a></section>'
body+='<section class="books-start"><div><p class="eyebrow">Следующая ступень · 6 занятий</p><h2>16 придворных: Имя, стихии и отношения</h2><p>Четыре буквы, матрица рангов и мастей, диалог двух функций и органическое чтение четвёрки. Практика всех порядков и трёх разбиений на пары.</p></div><a class="button" href="court-relations/">Исследовать придворных →</a></section>'
body+='<section class="books-start"><div><p class="eyebrow">Следующая ступень · 6 занятий</p><h2>Свет, сосуд и передача: смешанный расклад</h2><p>Соединяем числовые карты, придворных и Старшие арканы. Пардес римоним, Тания и практика целого: форма, мера, восприятие и поступок.</p></div><a class="button" href="mixed-reading/">Читать смешанный расклад →</a></section>'
body+='<section class="books-start"><div><p class="eyebrow">Следующая ступень · 6 занятий</p><h2>Мера и возвращение: прямые и перевёрнутые карты</h2><p>Сопоставляем правила Таро, каббалистические вопросы о мере и собственные гипотезы. Все варианты ориентаций, примеры и тетрадь наблюдений.</p></div><a class="button" href="reversal-study/">Исследовать ориентации →</a></section>'
body+='<section class="books-start"><div><p class="eyebrow">Следующая ступень · 6 занятий</p><h2>Время, ритм и возвращение: расклад в динамике</h2><p>Условия перехода, порыв и воплощение, мир — год — человек. Сравниваем два разбора и возвращаемся к своим выводам с наблюдениями.</p></div><a class="button" href="spread-dynamics/">Исследовать динамику →</a></section>'
body+='<section class="books-start" id="new-book-studies"><div><p class="eyebrow">'+str(book_studies.COUNT)+' книг · '+str(book_studies.LESSON_COUNT)+' занятий</p><h2>От имён и сефирот к языку Таро</h2><p>«Шаарей Ора» Йосефа Гикатилы, «Мистическая Каббала» Дион Форчун и «Книга Тота» Алистера Кроули, «Пардес римоним» Моше Кордоверо, «Тания» Шнеура-Залмана, «Эц Хаим» Хаима Виталя, «Книга T» в Liber LXXVIII, «Даат Твунот» Рамхаля, «Таро богемцев» Папюса, «Нефеш ха-Хаим» Хаима из Воложина, «Учение и ритуал высшей магии» Леви, «Шаарей Кдуша» Виталя и «Иллюстрированный ключ к Таро» Уэйта, «Дерех Ашем» Рамхаля и «Таро» Мазерса 1888 года, «138 врат мудрости» Рамхаля и «Разоблачённая Каббала» Мазерса. Подробное чтение, тренажёры, самостоятельные комментарии и отдельные тетради.</p><p><a href="/course/shaarei-orah/">Врата света →</a> · <a href="/course/mystical-qabalah/">Мистическая Каббала →</a> · <a href="/course/book-of-thoth/">Книга Тота →</a> · <a href="/course/pardes-rimmonim/">Пардес римоним →</a> · <a href="/course/tanya/">Тания →</a> · <a href="/course/etz-chaim/">Эц Хаим →</a> · <a href="/course/book-t/">Книга T →</a> · <a href="/course/daat-tevunot/">Даат Твунот →</a> · <a href="/course/tarot-bohemians/">Таро богемцев →</a> · <a href="/course/nefesh-hachaim/">Нефеш ха-Хаим →</a> · <a href="/course/levi-dogma-ritual/">Леви →</a> · <a href="/course/shaarei-kedusha/">Шаарей Кдуша →</a> · <a href="/course/pictorial-key/">Иллюстрированный ключ →</a> · <a href="/course/derekh-hashem/">Дерех Ашем →</a> · <a href="/course/mathers-tarot/">Мазерс, 1888 →</a> · <a href="/course/kalach-pitchei-chokhmah/">138 врат мудрости →</a> · <a href="/course/kabbalah-unveiled/">Разоблачённая Каббала →</a> · <a href="/course/study-tools/">Мастерские чтения →</a></p></div><a class="button" href="/course/book-studies/">Выбрать книгу →</a></section>'
body+='</details>'
page('/course/','Курс каббалы и Таро для начинающих — 45 уроков','Понятное введение в каббалу и Таро: 45 уроков, Древо сефирот, чтение Зоара, задания с пояснениями и личная тетрадь. Бесплатный курс Элиоры Вейры.',body)
# Separate crawlable lesson pages.
def card_figure(ids):
 """Real card images next to the first section (lessons whose lab does not already show the cards)."""
 cs=[expansion.CARDS[k] for k in ids if k in expansion.CARDS]
 if not cs:return ''
 return '<figure class="lesson-card-figure">'+''.join(f'<a class="card-picture" href="{E(c["imageSource"],quote=True)}" target="_blank" rel="noopener noreferrer"><img loading="lazy" width="120" height="208" src="{E(c["image"],quote=True)}" alt="{E(c["name"],quote=True)} — Памела Колман Смит"></a>' for c in cs)+'<figcaption>'+' · '.join(E(c['name']) for c in cs)+' — колода Уэйта–Смит, рисунки Памелы Колман Смит (1909).</figcaption></figure>'
def lesson_section(L,i,s,p):
 links=[x for x in L.get('links',[]) if x.get('section')==i]
 h=f'<section class="learn-text" id="sec-{i+1}"><h2>{E(s["title"])}</h2>{para(s["text"],links)}'
 if i==0 and L.get('cards') and L['lab'] not in ('study','observe','pair'):h+=card_figure(L['cards'])
 if s.get('table'):h+=table(s['table'])
 if s.get('links'):h+='<ul class="section-links">'+''.join(f'<li><a href="{E(x["href"],quote=True)}">{E(x["text"])}</a></li>' for x in s['links'])+'</ul>'
 return h+'</section>'
GLOSS={g['term'].lower() for g in D['glossary']}
def term_link(t,p):
 # a term the glossary does not (yet) define stays plain text instead of a dead anchor
 return f'<a href="{p}course/glossary/#{E(t.lower().replace(" ","-"))}">{E(t)}</a>' if t.lower() in GLOSS else f'<span class="term-plain">{E(t)}</span>'
def extra_lab(x,L):return lab_static(x['lab'],L,x.get('labData') or {}) if x['lab'] in ('sort','observe','pair') else lab(x['lab'],L)
def stage4(L):
 h='<section class="stage" data-stage="3" tabindex="-1" aria-label="Собственная запись"><h2>А как бы Вы это объяснили?</h2>'+para(L['prompt'])
 if L.get('checklist'):h+='<div class="note-checklist"><p class="fine">Перед тем как писать, держите в уме:</p><ul>'+''.join(f'<li>{E(c)}</li>' for c in L['checklist'])+'</ul></div>'
 sc=L.get('scaffold') or []
 if sc:
  h+='<div class="scaffold" data-scaffold><p class="fine">Начните любую строку — подсказка в поле исчезнет, как только Вы начнёте писать.</p>'+''.join(f'<textarea class="scaffold-field" rows="2" maxlength="4000" data-scaffold-field="{n}" aria-label="Строка {n+1}: {E(t,quote=True)}" placeholder="{E(t,quote=True)}"></textarea>' for n,t in enumerate(sc))+'</div><label class="reflection-label" for="reflection">Ещё мысль или вопрос — если хочется</label><textarea class="note note-free" id="reflection" maxlength="20000" placeholder="Можно оставить пустым"></textarea>'
 else:h+='<label class="reflection-label" for="reflection">Ваша мысль, пример или вопрос</label><textarea class="note" id="reflection" maxlength="20000" placeholder="Можно начать с одной фразы…"></textarea>'
 h+='<span class="status-text" id="note-status" role="status">Записи хранятся в этом браузере и не отправляются автору курса.</span>'
 h+='<label class="self-check"><input id="reflection-check" type="checkbox"><span>Я обдумал(а) вопрос и хочу пока оставить ответ без записи.</span></label><div class="one-word" data-one-word hidden><label for="one-word">Одно слово, которое запомнилось (необязательно)</label><input id="one-word" type="text" maxlength="80" autocomplete="off"></div>'
 if L.get('sampleHint'):h+='<p class="sample-hint"><strong>Вопрос перед образцом.</strong> '+E(L['sampleHint'])+'</p>'
 h+='<p class="fine" data-sample-locked>Один из возможных ответов откроется здесь, когда Вы напишете хотя бы строку или отметите, что обдумали вопрос без записи.</p><details class="example" data-sample hidden><summary>Посмотреть один из возможных ответов</summary>'+para(L['sample'])+'<p class="fine">Что в образце есть, чего нет у Вас? А что есть у Вас, чего в нём нет?</p></details>'
 h+='<div class="completion">'+btn('Завершить урок','id="complete-lesson"')+'<p class="feedback" id="completion-status" role="status">Урок будет отмечен, когда все три вопроса разобраны (с подсказкой тоже считается) и есть запись или отметка «без записи».</p><div class="complete-banner" id="completion-result" tabindex="-1" hidden></div></div></section>'
 return h
for L in LESSONS:
 p='../../';side='<aside class="side"><details class="toc" open><summary class="toc-summary"><span class="mobile-toc-title">Программа и мой прогресс ▾</span></summary><div><p class="eyebrow">Мой путь</p><div class="side-note">'+progress()+'</div>'
 side+='<a class="books-side-link" href="../books/">Перед началом: Тора, Талмуд, Зоар</a>'
 for i,m in enumerate(D['modules']):side+=f'<details {"open" if i==L["module"] else ""}><summary>{i+1}. {m["title"]}</summary>{lessonlist(in_module(i),p,L["id"])}</details>'
 side+='</div></details></aside>'
 b=crumbs(p,'Урок '+str(L['id']))+'<div class="lesson-shell">'+side+f'<article class="lesson-main"><p class="eyebrow">Раздел {L["module"]+1} · {D["modules"][L["module"]]["title"]} · Урок {L["id"]}</p><h1>{E(L["title"])}</h1><p class="hook">{E(L["hook"])}</p>{lesson_summary(L)}<p class="aim">После урока Вы сможете: {E(L["aim"][0].lower()+L["aim"][1:])}</p><div class="lesson-meta"><span class="meta-time">{E(L.get("time") or "10–20 минут вместе с упражнением и записью; можно в два подхода")}</span>'+(f'<span class="meta-keyword">Главное слово: <b>{E(L["keyword"])}</b></span>' if L.get('keyword') else '')+'<span class="reader-tools"><button data-font-size type="button">Крупнее текст</button></span></div><nav class="steps" aria-label="Шаги урока">'+''.join(f'<button type="button" data-go-stage="{i}"><b>0{i+1}</b>{t}</button>' for i,t in enumerate(['Разберёмся','Попробуем','Проверим','Своими словами']))+'</nav>'
 if L['id'] in (9,10):b+='<aside class="books-reminder"><p><strong>Продолжить чтение Сефер Йецира.</strong> Отдельный модуль из 12 занятий: короткие выписки, схемы, сравнение редакций и собственный комментарий.</p><a href="../yetzirah/">Открыть подробный модуль →</a></aside>'
 if L['id'] in (1,11,12):b+='<aside class="books-reminder"><p><strong>Если названия книг пока путаются.</strong> Введение поможет вспомнить, что такое Тора, Талмуд и Зоар, как они связаны и где начинается комментарий.</p><a href="../books/">Открыть знакомство с книгами →</a></aside>'
 src=L.get('source')
 b+='<section class="stage active" data-stage="0" tabindex="-1" aria-label="Объяснение">'+(f'<figure class="source-line"><blockquote>{E(src["text"])}</blockquote><figcaption>{E(src["ref"])}</figcaption></figure>' if src else '')+''.join(lesson_section(L,i,s,p) for i,s in enumerate(L['sections']))
 if L.get('terms'):b+='<div class="term-row"><span class="fine">Слова урока:</span>'+''.join(term_link(t,p) for t in L['terms'])+'</div>'
 b+=btn('Перейдём к практике →','data-go-stage="1"')+'</section>'
 b+='<section class="stage" data-stage="1" tabindex="-1" aria-label="Исследование"><h2>Попробуйте сами</h2>'+lab(L['lab'],L)+''.join(extra_lab(x,L) for x in L.get('extraLabs',[]))+btn('Теперь несколько вопросов →','data-go-stage="2"')+'</section>'
 b+='<section class="stage" data-stage="2" tabindex="-1" aria-label="Проверка понимания"><h2>Проверим себя?</h2><p class="quiz-intro">'+E(PAGES['quizIntro'])+'</p>'
 for qi,q in enumerate(L['quiz']):b+=f'<fieldset class="quiz-item" data-quiz-item="{qi}"><legend>{qi+1}. {E(q["q"])}</legend>'+''.join(f'<label class="option" data-option="{i}"><input type="radio" data-question="{qi}" name="q{qi}" value="{i}"><span>{E(t)}</span></label>' for i,t in enumerate(q['options']))+f'<div class="q-feedback" data-q-feedback="{qi}" aria-live="polite"></div></fieldset>'
 b+='<p id="quiz-summary" class="feedback" role="status">Выберите ответ — он проверится сразу.</p><div class="actions">'+btn('К своей записи →','data-go-stage="3"',True)+'</div></section>'
 b+=stage4(L)
 if L['slug']=='bahir-and-zohar':b+='<section class="books-start"><div><h2>Читаем Бахир подробнее</h2><p>12 занятий: притчи, источники и дерево, буквы и числа, свой комментарий.</p></div><a class="button" href="../bahir/">Открыть модуль →</a></section>'
 b+='<section class="source-block"><h2>Если хочется прочитать дальше</h2><ul>'+''.join('<li>'+E(t)+'</li>' for t in L['reading'])+'</ul>'+sources(L['sourceIds'])+'</section><nav class="next-prev" aria-label="Соседние уроки">'
 k=ORDER.index(L['id'])
 if k>0:
  prev=PROGRAM[k-1];b+=f'<a href="../{prev["slug"]}/"><small>← Урок {prev["id"]}</small>{E(prev["title"])}</a>'
 else:b+='<a href="../books/"><small>← Перед первым уроком</small>Тора, Талмуд и Зоар</a>'
 if k<len(PROGRAM)-1:
  nxt=PROGRAM[k+1];b+=f'<a href="../{nxt["slug"]}/"><small>Урок {nxt["id"]} →</small>{E(nxt["title"])}</a>'
 else:b+='<a href="../notebook/"><small>Моя тетрадь →</small>Посмотреть записи</a>'
 b+='</nav></article></div>'
 page('/course/'+L['slug']+'/',L['title'],L['summary'],b,L=L)
# Reference atlas
body=crumbs('../../','Схемы')+'<header class="hero-small"><p class="eyebrow">Можно вернуться в любой момент</p><h1>Когда проще увидеть</h1><p class="lead">Нажмите на имя, переключите уровень, проследите связь. Схемы помогают держать в уме целое, пока Вы разбираетесь с подробностями.</p></header><div class="atlas-grid">'
for k in ['tree','worlds','luria','letters','timeline','balance']:body+=('<section class="atlas-wide">' if k in ['tree','timeline'] else '<section>')+lab(k)+'</section>'
body+='</div><div class="notice">Древо показывает выбранные учебные связи, а последовательность Лурии — ход объяснения. Исторические школы могут изображать эти отношения иначе. <a href="../reading/#sources">Источники и пояснения</a>.</div>'
page('/course/atlas/','Древо сефирот, четыре мира и учение Лурии — интерактивные схемы','Изучайте десять сефирот, четыре мира, буквы и этапы лурианского рассказа на интерактивных схемах с понятными пояснениями.',body)
# Reading library and Tarot workshop.
expansion.build(page,crumbs,D,lessonlist)
reading_catalog.build(page,crumbs)
yetzirah.build(page,crumbs)
book_studies.build(page,crumbs)
study_tools.build(page,crumbs)
book_modules.build(page,crumbs)
tarot_pairs.build(page,crumbs)
tarot_triples.build(page,crumbs)
spread_grammar.build(page,crumbs)
tree_reading.build(page,crumbs)
pathways.build(page,crumbs)
court_relations.build(page,crumbs)
mixed_reading.build(page,crumbs)
reversal_study.build(page,crumbs)
spread_dynamics.build(page,crumbs)
spread_workshop.build(page,crumbs)
hekate.build(page,crumbs)
# Full deck gallery (reads the finished /course/tarot/ page for its head, header and footer).
routes.append(design.build_deck())
# Glossary
body=crumbs('../../','Словарь')+'<header class="hero-small"><p class="eyebrow">Слово можно просто посмотреть</p><h1>Словарь без спешки</h1><p class="lead">Если термин забылся, вернитесь сюда. Короткое объяснение поможет вспомнить урок, а подробности найдутся в самом тексте.</p><label for="term-search">Какое слово ищем?</label><br><input id="term-search" class="search" type="search" data-search="terms" placeholder="Например, тиккун"><span class="status-text" data-search-status="terms" aria-live="polite"></span></header>'
body+='<div class="books-reminder"><p>Нужно подробнее о Торе, Талмуде или Зоаре? Для них есть отдельное введение с примерами.</p><a href="../books/">Открыть знакомство с книгами →</a></div>'
body+='<dl class="glossary">'
FIRST_USE={}
for l in PROGRAM:
 for t in l.get('terms',[]):FIRST_USE.setdefault(t.lower(),l)
def gloss_back(term):
 l=FIRST_USE.get(term.lower())
 return f' <a class="gloss-back" href="../{l["slug"]}/" aria-label="{E(term,quote=True)}: урок {l["id"]}">урок {l["id"]}</a>' if l else ''
for g in sorted(D['glossary'],key=lambda x:x['term']):body+='<div class="gloss-entry" data-search-item="terms" id="'+E(g['term'].lower().replace(' ','-'))+'"><dt>'+E(g['term'])+'</dt><dd>'+E(g['meaning'])+gloss_back(g['term'])+'</dd></div>'
body+='</dl><p class="notice">Определения даны для первого знакомства. У разных авторов значения могут различаться. <a href="../reading/#sources">Книги и источники курса</a>.</p>'
page('/course/glossary/',f'Словарь каббалы и Таро для начинающих — {len(D["glossary"])} понятий','Простые объяснения терминов: Эйн Соф, сефирот, Шхина, цимцум, тиккун, Зоар, старшие и младшие арканы. Словарь к курсу Элиоры Вейры.',body)
# Personal notebook — private browser state, noindex
body=crumbs('../../','Моя тетрадь')+'<header class="hero-small"><p class="eyebrow">Здесь остаются Ваши мысли</p><h1>Моя тетрадь</h1><p class="lead">Можно вернуться к старому вопросу, дописать ответ или заметить, что теперь Вы понимаете его иначе.</p>'+progress()+'<p class="notice">'+E(PAGES['notebookIntro'])+'</p><div class="actions">'+btn('Сохранить тетрадь для переноса','data-export')+btn('Скачать записи текстом','data-export-text',True)+'</div><details class="example"><summary>Перенести сохранённую тетрадь сюда</summary><p>Выберите JSON-файл, который Вы выгрузили из курса. Текущие записи сохранятся: если в файле есть другая версия, она добавится ниже.</p><label class="import-label">Файл тетради <input type="file" data-import accept="application/json,.json"></label><p id="import-status" class="feedback" role="status"></p></details></header><p><a href="#reading-notes">К записям о Зоаре ↓</a></p><h2 class="notebook-h">Записи к урокам</h2><p class="fine" data-notebook-summary></p><div id="notebook-items" data-notebook-mode="started"><noscript><p>Для записи и переноса тетради нужен JavaScript. Тексты уроков остаются доступны в программе курса.</p></noscript></div>'+'<p><button class="button secondary" type="button" data-notebook-all aria-expanded="false">Показать все 45 уроков</button></p>'
body+='<section id="reading-notes" class="section"><h2>Мои встречи с Зоаром</h2><p class="reading-first" data-reading-first>Первые 8 встреч с Зоаром: 0 из 8</p><p class="fine" data-reading-progress data-reading-limit="888">Прочитано 0 из 888</p><p class="fine">888 — весь каталог фрагментов: его не нужно проходить целиком, отмечаются только те, что Вы прочитали.</p><div id="reading-notebook"></div><p><a href="../reading/">Выбрать фрагмент →</a></p></section>'
body+='<details class="module-notebooks"><summary>Тетради модулей и книг — Сефер Йецира, книги, расклады, пути, придворные и другие</summary><section class="section"><h2>Мои занятия по Сефер Йецира</h2><p>У нового модуля есть отдельная тетрадь для первых предположений и итоговых объяснений. Откройте её, чтобы посмотреть записи или скачать их для переноса.</p><a class="button secondary" href="../yetzirah/notebook/">Тетрадь Сефер Йецира →</a></section><section class="section"><h2>Тетради других книг</h2><p>В каждой тетради сохраняются первое предположение, черновик и мысль после чтения. Файл можно скачать и перенести на другое устройство.</p><div class="actions"><a class="button secondary" href="../tomer-devorah/notebook/">Томер Двора →</a><a class="button secondary" href="../bahir/notebook/">Бахир →</a></div></section><section class="section"><h2>Мои исследования раскладов</h2><p>Варианты каждого упражнения, зафиксированные гипотезы и последующие наблюдения.</p><a class="button secondary" href="../spread-grammar/notebook/">Тетрадь искусства расклада →</a></section><section class="section"><h2>Мои чтения Древа</h2><p>Отдельная тетрадь следующего модуля: обоснования, расклады на десять позиций, сохранённые гипотезы и наблюдения.</p><a class="button secondary" href="../tree-reading/notebook/">Открыть тетрадь чтения Древа →</a></section><section class="section"><h2>Мои исследования путей</h2><p>Направления, порядки Старших арканов, основания и наблюдения в отдельной тетради.</p><a class="button secondary" href="../pathways/notebook/">Тетрадь 22 путей →</a></section><section class="section"><h2>Мои исследования придворных</h2><p>Ранги, масти, функции позиций, пары пар и возвращения к собственному толкованию.</p><a class="button secondary" href="../court-relations/notebook/">Тетрадь придворных →</a></section><section class="section"><h2>Мои смешанные расклады</h2><p>Источники, соответствия, гипотезы и наблюдения после выбранного шага.</p><a class="button secondary" href="../mixed-reading/notebook/">Тетрадь смешанных раскладов →</a></section><section class="section"><h2>Мои исследования ориентаций</h2><p>Прямые и перевёрнутые карты, варианты проявления, основания и последующие наблюдения.</p><a class="button secondary" href="../reversal-study/notebook/">Тетрадь меры и возвращения →</a></section><section class="section"><h2>Мои расклады во времени</h2><p>Два разбора рядом, сохранённые основания и наблюдения с датами.</p><a class="button secondary" href="../spread-dynamics/notebook/">Тетрадь динамики →</a></section><section class="section"><h2>Тетради новых книг</h2><p>В каждой сохраняются первый вопрос, работа с текстом и итоговый комментарий. Можно скачать JSON для переноса или текст для чтения.</p><p><a href="/course/shaarei-orah/notebook/">Врата света →</a> · <a href="/course/mystical-qabalah/notebook/">Мистическая Каббала →</a> · <a href="/course/book-of-thoth/notebook/">Книга Тота →</a> · <a href="/course/etz-chaim/notebook/">Эц Хаим →</a> · <a href="/course/book-t/notebook/">Книга T →</a> · <a href="/course/daat-tevunot/notebook/">Даат Твунот →</a> · <a href="/course/tarot-bohemians/notebook/">Таро богемцев →</a> · <a href="/course/nefesh-hachaim/notebook/">Нефеш ха-Хаим →</a> · <a href="/course/levi-dogma-ritual/notebook/">Леви →</a> · <a href="/course/shaarei-kedusha/notebook/">Шаарей Кдуша →</a> · <a href="/course/pictorial-key/notebook/">Иллюстрированный ключ →</a> · <a href="/course/derekh-hashem/notebook/">Дерех Ашем →</a> · <a href="/course/mathers-tarot/notebook/">Мазерс, 1888 →</a> · <a href="/course/kalach-pitchei-chokhmah/notebook/">138 врат мудрости →</a> · <a href="/course/kabbalah-unveiled/notebook/">Разоблачённая Каббала →</a></p></section><section class="section"><h2>Мои комментарии и сравнения</h2><p>Черновики, сохранённые редакции и исправления из трёх мастерских.</p><p><a class="button secondary" href="/course/study-tools/notebook/">Тетрадь мастерских →</a> · <a href="/course/pardes-rimmonim/notebook/">Тетрадь Пардес римоним →</a> · <a href="/course/tanya/notebook/">Тетрадь Тании →</a></p></section></details>'
page('/course/notebook/','Моя тетрадь — записи и прогресс курса','Личная учебная тетрадь курса каббалы и Таро: сохранённые мысли, пройденные уроки и перенос записей между устройствами.',body,noindex=True)
# Author page — no invented credentials or identity disclosure.
body=crumbs('../','Об авторе и курсе')+'<article class="hero-small"><p class="eyebrow">Несколько слов от автора</p><h1>Элиора Вейра</h1><p class="lead">Мне хотелось сделать место, куда можно прийти с простым «мне интересно» — без страха, что сначала придётся выучить словарь незнакомых слов.</p><p>О каббале и Таро легко говорить красиво и туманно. Гораздо труднее понять, что именно стоит за знакомыми символами, с какой книги начать и как прочитать хотя бы один непростой абзац. Поэтому уроки здесь небольшие: объяснение, схема, вопрос и немного времени для собственной мысли.</p><p>Я опиралась на книги по истории каббалы и русские издания Зоара с комментарием «Сулам». В уроках есть ссылки и точные указания на отрывки. Историческое исследование, религиозное объяснение и личная ассоциация могут быть рядом — важно только не выдавать одно за другое.</p><p>Здесь можно задержаться на одном образе, вернуться к схеме, не согласиться с объяснением и записать свой вопрос. Никакого экзамена на подготовленность нет. Есть лишь дорога от первого любопытства к более внимательному чтению.</p><p class="quote">Буду рада, если после курса у Вас появится книга, которую хочется открыть, — и свой вопрос к ней.</p><p>Элиора Вейра — мой авторский псевдоним для этого проекта.</p><div class="actions"><a class="button" href="../course/">Открыть курс</a><a class="button secondary" href="../course/reading/#sources">Посмотреть источники</a></div></article>'
page('/author/','Элиора Вейра — о курсе каббалы и Таро','Авторский проект Элиоры Вейры: понятное знакомство с каббалой, чтением Зоара и Таро. Замысел курса, подход к источникам и самостоятельной работе.',body)
# Existing home stays an introduction, now in a more natural voice with a visible course entrance.
home=ROOT/'index.html';s=home.read_text()
s=s.replace('<title>Каббала и Таро — от любопытства к пониманию</title>','<title>Каббала и Таро для начинающих — курс Элиоры Вейры</title>')
s=re.sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="С чего начать изучение каббалы и Таро: бесплатный курс Элиоры Вейры, 45 уроков, Древо сефирот и понятные разборы Зоара.">',s)
s=s.replace('За древними текстами и знакомыми символами — целый мир вопросов. О человеке. О его месте в мироздании. О смысле пути, который он выбирает.','Иногда достаточно одной картинки или случайно прочитанной строки, чтобы захотелось узнать больше. Если с Вами так и случилось — давайте попробуем разобраться вместе.')
s=s.replace('<a class="read" href="#about">Зачем появился этот проект <span aria-hidden="true">↓</span></a>','<a class="read" href="course/">Открыть курс: 45 занятий <span aria-hidden="true">→</span></a><p style="margin-top:18px;font-size:13px"><a href="#about">Несколько слов о замысле</a></p>')
start=s.index('<article>');end=s.index('</article>',start)
s=s[:start]+'''<article><h2 id="essay-title">Можно начать с простого любопытства</h2>
<p>Возможно, Вы уже открывали книгу по каббале — и закрывали её через несколько страниц. Слишком много непривычных слов, одно объяснение требует другого, а с чего начать, всё равно непонятно. Или Вас привлекли карты Таро: хочется рассмотреть их, понять образы, но не заучивать чужие толкования без разбора.</p>
<p>Я задумала этот курс именно для такого начала. Будем знакомиться с понятиями постепенно, пробовать читать небольшие отрывки, возвращаться к схемам. Где-то хватит одной страницы. Где-то захочется задержаться и задать ещё один вопрос.</p>
<p>Начать можно с книги, карты или знакомой песни. Будем чередовать чтение Зоара, знакомство с каббалой — мистической традицией иудаизма — и работу с образами Таро. Разберём, зачем нужны сефирот, что называют светом и сосудами, как числа связываются с буквами. У нас есть каталог из 888 коротких фрагментов Зоара, включая 88 встреч с пояснениями, и разборы всех 78 карт. Связи между этими традициями тоже рассмотрим: с именами авторов и пониманием того, когда эти связи появились.</p>
<p>Мне хочется, чтобы после урока у Вас оставалось ощущение: «Вот это я теперь могу объяснить». Поэтому здесь есть задания с пояснениями, схемы, на которых можно нажимать и переключать, и тетрадь для собственных мыслей. И никакой спешки: все уроки открыты, к любому можно вернуться.</p>
<p class="invitation">Начните со знакомства с книгами. Возможно, дальше Вас поведёт уже собственный вопрос.</p>
'''+design.routes_html()+'''<div class="signature">Элиора Вейра<span>Автор проекта</span></div></article>'''+s[end+len('</article>'):]
s=re.sub(r'<link rel="canonical"[^>]*>','',s)
s=re.sub(r'<meta (?:name="robots"|property="og:url")[^>]*>','',s)
s=re.sub(r'<script type="application/ld\+json">.*?</script>','',s,flags=re.S)
s=re.sub(r'<meta property="og:title"[^>]*>','<meta property="og:title" content="Каббала и Таро — курс Элиоры Вейры">',s)
s=re.sub(r'<meta property="og:description"[^>]*>','<meta property="og:description" content="45 занятий: читаем Зоар, разбираемся в символах и знакомимся с Таро. С понятными схемами, заданиями и личной тетрадью.">',s)
s=s.replace('</head>',f'<link rel="canonical" href="{ORIGIN}/"><meta name="robots" content="index,follow,max-image-preview:large"><meta property="og:url" content="{ORIGIN}/"><script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@type':'WebSite','name':'Каббала и Таро','url':ORIGIN+'/','inLanguage':'ru','creator':{'@type':'Person','name':'Элиора Вейра','url':ORIGIN+'/author/'}},ensure_ascii=False)+'</script></head>')
s=s.replace('Здесь начинается знакомство. Материалы будут появляться постепенно.','<a href="course/">Курс</a> · <a href="course/reading/">Читаем Зоар</a> · <a href="author/">Об авторе</a>')
s=re.sub(r'https?://kabbala-tarot.online/assets/beginning.jpg',ORIGIN+'/assets/beginning.jpg',s)
s=s.replace('24 небольших урока','45 занятий').replace('24 интерактивных урока','45 уроков')
s=design.landing(s)
home.write_text(s)
# An actual 404 status is provided by GitHub Pages for unknown URLs.
page('/404/','Страница не найдена','Эта страница не найдена. Вернитесь к программе курса каббалы и Таро.', '<section class="hero-small"><p class="eyebrow">404</p><h1>Похоже, этой страницы здесь нет</h1><p>Можно вернуться к программе и выбрать нужный урок.</p><a class="button" href="../course/">Открыть программу курса</a></section>',noindex=True)
# 404 must use root-relative assets so arbitrary missing URLs do not break it.
s=(ROOT/'404/index.html').read_text().replace('href="../','href="/').replace('src="../','src="/')
(ROOT/'404.html').write_text(s);(ROOT/'404/index.html').unlink();(ROOT/'404').rmdir()
css=(ROOT/'assets/course/style.css').read_text();css=re.sub(r'@import[^;]+;','',css)
(ROOT/'assets/course/course.css').write_text(design.course_css((ROOT/'assets/course/fonts.css').read_text(),css))
design.write_assets()
(ROOT/'assets/course/icon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#122e3b"/><path d="M32 9 37 27 55 32 37 37 32 55 27 37 9 32 27 27Z" fill="#dfc18c"/></svg>')
routes=['/']+routes
xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{ORIGIN}{p}</loc><lastmod>{CFG["updated"]}</lastmod></url>\n' for p in routes)+'</urlset>\n'
(ROOT/'sitemap.xml').write_text(xml);(ROOT/'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {ORIGIN}/sitemap.xml\n')
print(f'Built {len(LESSONS)} lessons; {len(routes)} indexable URLs; private notebook excluded from sitemap.')
