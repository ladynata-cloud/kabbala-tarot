"""Stage-2 labs of the lessons, v3 (SPEC §4). Called by build_course.py.

One interaction pattern for every lab: task → action → check → an addressed hint that does not name the answer →
the answer after the second error on the same item → counter «N из M» → a short success text.
The markup is rendered here (card images go through design.finish(), so they get page-relative src and srcset);
assets/course/labs.js wires every [data-lab3] block. Each block carries its own data in an inline JSON script,
so a page may hold several labs of one kind (lesson 24 has two trees) and no fixed ids are used.
Old kinds without data (the atlas) stay in app.js and are untouched."""
from html import escape as E
import json,random,re
import design
import build_expansion as expansion

D=None
def init(data):
 global D;D=data

LETTERS=list('אבגדהוזחטיכלמנסעפצקרשת')
LETTER_NAMES=['алеф','бет','гимель','далет','хе','вав','заин','хет','тет','йод','каф','ламед','мем','нун','самех','айн','пе','цади','коф','реш','шин','тав']
# tree(): node centres before the CSS lift of Йесод (−29) and Малхут (−12); overlays use the lifted centres.
PTS=[(250,45),(407,145),(93,145),(407,265),(93,265),(250,335),(407,435),(93,435),(250,476),(250,593)]
PLACE=['вершина средней линии','справа вверху','слева вверху','справа, второй ряд','слева, второй ряд','средняя линия, центр','справа внизу','слева внизу','средняя линия, над нижним кругом','самый низ средней линии']
TITLES={'sort':'Разложим по полкам','timeline':'Поставим события на свои места','tree-find':'Найдите на Древе','tree-place':'Расставьте имена на Древе','tree-explore':'Посмотрите, как связаны сефирот','worlds':'Четыре мира, десять сефирот','letters':'Из чего складываются 32 пути','rose':'Рассмотрим образ по слоям','luria-explore':'Пройдём по рассказу шаг за шагом','luria-order':'Восстановите порядок рассказа','soul':'Три уровня и их связь','balance':'Щедрость, мера и согласование','river':'Проследите путь от рек к морю','deck':'Найдите место карты в колоде','hermit':'Одна карта в три прохода','observe':'Сначала — только то, что видно','pair':'Две карты в двух порядках'}

def jsonsafe(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
def paras(text):return ''.join('<p>'+E(p.strip())+'</p>' for p in re.split(r'\n\s*\n',text or '') if p.strip())
def shuffled(n,seed):
 """Deterministic order for the build (no diff between runs) that never starts solved."""
 idx=list(range(n));rnd=random.Random(seed)
 for _ in range(50):
  rnd.shuffle(idx)
  if n<2 or sum(i==k for k,i in enumerate(idx))<=max(1,n//4):return idx
 return idx[1:]+idx[:1]

def bar(check='Проверить',reset=True):
 """Common status line: the check button (optional), the counter, the addressed feedback, the success text."""
 b='<div class="lab3-bar">'
 if check:b+=f'<button class="button" type="button" data-lab3-check>{E(check)}</button>'
 b+='<span class="lab3-count" data-lab3-count role="status"></span>'
 if reset:b+='<button class="lab3-reset" type="button" data-lab3-reset>Начать заново</button>'
 return b+'</div><div class="lab3-feedback" data-lab3-feedback aria-live="polite"></div>'

def shell(kind,sub,data,inner,title=None,instruction=None,success=None,after=''):
 ins=data.get('instruction') if instruction is None else instruction
 succ=data.get('success') if success is None else success
 s=f'<div class="lab lab3" data-lab="{kind}" data-lab3="{sub}"><h3>{E(title or TITLES.get(sub) or TITLES.get(kind,""))}</h3>'+paras(ins)+inner+after
 s+=f'<script type="application/json" data-lab3-data>{jsonsafe({**data,"success":succ or "Все задания выполнены."})}</script>'
 return s+'<noscript><p>Это упражнение работает с включённым JavaScript. Текст урока и источники доступны без него.</p></noscript></div>'

def card_img(cid,width=150,cls='lab3-card'):
 c=expansion.CARDS[cid];h=round(width*208/120)
 return f'<figure class="{cls}"><a class="card-picture" href="{E(c["imageSource"],quote=True)}" target="_blank" rel="noopener noreferrer"><img loading="lazy" width="{width}" height="{h}" src="{E(c["image"],quote=True)}" alt="{E(c["name"],quote=True)} — Памела Колман Смит"></a><figcaption>{E(c["name"])}</figcaption></figure>'

# ---------------------------------------------------------------- sort
def sort(d,L):
 items=d['items'];order=shuffled(len(items),'sort:'+str(L and L['id'])+':'+d['items'][0]['text'])
 pool=''.join(f'<li class="sort3-item" data-item="{i}"><button type="button" class="sort3-pick" data-sort-pick aria-pressed="false">{E(items[i]["text"])}</button><span class="sort3-tools"><button type="button" class="sort3-hint-btn" data-sort-hint aria-expanded="false">Подсказка</button></span><p class="sort3-hint" data-sort-hint-text hidden>{E(items[i]["hint"])}</p><p class="sort3-explain" data-sort-explain hidden></p></li>' for i in order)
 shelves=''.join(f'<section class="sort3-shelf" data-shelf="{k}"><button type="button" class="sort3-put" data-sort-put="{k}"><b>{E(name)}</b><small>положить сюда</small></button><ul class="sort3-list" data-shelf-list></ul></section>' for k,name in enumerate(d['shelves']))
 inner=f'<div class="sort3" style="--shelves:{len(d["shelves"])}"><p class="lab3-label">Фразы: выберите одну, затем полку</p><ul class="sort3-list sort3-pool" data-sort-pool>{pool}</ul><div class="sort3-shelves">{shelves}</div></div>'+bar()
 return shell('sort','sort',d,inner)

# ---------------------------------------------------------------- timeline and luria order (one «ordered list» widget)
def order_list(entries,seed,movable=None):
 """entries: [(correct_index, html)], rendered shuffled among the movable positions; fixed ones stay in place."""
 n=len(entries);mov=[i for i in range(n) if movable is None or i in movable]
 perm=shuffled(len(mov),seed);slots=list(range(n))
 for k,pos in enumerate(mov):slots[pos]=mov[perm[k]]
 li=''
 for pos in range(n):
  i=slots[pos];fixed=i not in mov
  li+=f'<li class="order3-item{" is-fixed" if fixed else ""}" data-i="{i}">{entries[i]}'
  li+='<span class="order3-fixed">на месте</span>' if fixed else '<span class="order3-moves"><button type="button" data-move="-1" aria-label="Выше">↑</button><button type="button" data-move="1" aria-label="Ниже">↓</button></span>'
  li+='</li>'
 return f'<ol class="order3" data-order>{li}</ol>'
def timeline(d,L):
 ev=d['events']
 entries=[f'<span class="order3-body"><b class="order3-what">{E(e["what"])}</b><span class="order3-when" hidden>{E(e.get("when",""))}</span><span class="order3-note" hidden>{E(e.get("note",""))}</span></span>' for e in ev]
 inner='<p class="lab3-label">От раннего — вверху — к позднему</p>'+order_list(entries,'timeline:'+ev[0]['what'])+bar()
 return shell('timeline','timeline',d,inner)

# ---------------------------------------------------------------- Luria: images with small labels
def luria_svg(i):
 s=re.sub(r'aria-label="[^"]*"','aria-label="Условный образ: '+E(D['luria'][i][0])+'"',design.diagram(f'b-light/luria-{i}.svg'),count=1)
 add={1:'<g class="bl-label"><path d="M141 141 124 111" fill="none" stroke="#f3dfb0" stroke-width=".8"/><text x="146" y="156" text-anchor="middle" fill="#f3dfb0" font-size="12">решиму</text><text x="101" y="24" fill="#143545" font-size="12">кав</text></g>',
      4:'<g class="bl-label"><text x="95" y="167" text-anchor="middle" fill="#f3dfb0" font-size="12">обломки — клипот</text></g>'}.get(i,'')
 return s.replace('</svg>',add+'</svg>',1) if add else s
def luria(d,L):
 mode=d.get('mode','explore');notes=(d.get('notes') or ['']*6)+['']*6
 if mode=='order':
  order=[i for i in d.get('order',range(6)) if 0<=i<6]
  entries=[f'<span class="order3-img">{luria_svg(i).replace(" hidden>",">",1)}</span><span class="order3-body"><b class="order3-what">{E(D["luria"][i][0])}</b><span class="order3-q">{E(D["luria"][i][1])}</span><span class="order3-note" hidden>{E(notes[i])}</span></span>' for i in range(6)]
  inner='<p class="lab3-label">От первого шага — вверху — к последнему</p>'+order_list(entries,'luria:'+','.join(map(str,order)),set(order))+bar()
  return shell('luria','luria-order',d,inner,success=d.get('success'))
 start=d.get('start',0) if isinstance(d.get('start'),int) else 0
 steps='<div class="lab-stepper">'+''.join(f'<button type="button" data-luria="{i}" aria-label="Шаг {i+1}: {E(t[0],quote=True)}">{i+1}</button>' for i,t in enumerate(D['luria']))+'</div>'
 pics='<div class="luria-symbol">'+''.join(luria_svg(i) for i in range(6))+'</div>'
 inner=steps+pics+'<p class="lab3-note" data-luria-note></p><div class="lab-detail" data-detail aria-live="polite"></div>'+bar(check=None,reset=False)
 return shell('luria','luria-explore',{**d,'start':start,'notes':notes[:6]},inner)

# ---------------------------------------------------------------- tree (explore / find / place)
def tree_svg(d):
 edges=[(0,1),(0,2),(1,3),(2,4),(3,5),(4,5),(5,6),(5,7),(6,8),(7,8),(8,9)]
 base=[(250,45),(407,145),(93,145),(407,265),(93,265),(250,335),(407,435),(93,435),(250,505),(250,605)]
 hide=bool(d.get('hideLabels'))
 s=f'<svg class="tree-visual tree3-svg{" is-hidden-labels" if hide else ""}" viewBox="0 0 500 663" role="group" aria-label="Учебное Древо десяти сефирот{": подписи скрыты" if hide else ""}">'
 if d.get('showTriangle'):
  (x1,y1),(x2,y2),(x3,y3)=PTS[3],PTS[4],PTS[5]
  s+=f'<polygon class="tree-triangle" points="{x1},{y1} {x2},{y2} {x3},{y3}"/>'
 for a,b in edges:s+=f'<line class="tree-edge" x1="{base[a][0]}" y1="{base[a][1]}" x2="{base[b][0]}" y2="{base[b][1]}"/>'
 if d.get('showPairs'):
  for a,b in [(1,2),(3,4),(6,7)]:s+=f'<line class="tree-pair" x1="{PTS[b][0]+38}" y1="{PTS[a][1]}" x2="{PTS[a][0]-38}" y2="{PTS[a][1]}"/>'
 if d.get('showDaat'):
  s+='<g class="tree-daat" aria-hidden="true"><circle cx="250" cy="198" r="27"/><text x="250" y="204" text-anchor="middle">Даат</text><text class="tree-daat-note" x="250" y="246" text-anchor="middle">в счёт десяти не входит</text></g>'
 if d.get('arrow'):
  s+='<g class="tree-arrow" aria-hidden="true"><path d="M302 500V566"/><polygon points="294,562 310,562 302,578"/></g>'
 for i,((x,y),sf) in enumerate(zip(base,D['sefirot'])):
  label=f'Круг: {PLACE[i]}' if hide else f'{sf[0]}, {sf[2]}'
  s+=f'<g class="tree-node" role="button" tabindex="0" aria-label="{E(label,quote=True)}" data-node="{i}"><circle cx="{x}" cy="{y}" r="38"/><text x="{x}" y="{y-1}" text-anchor="middle">{i+1}</text><text class="tree-slot" x="{x}" y="{y+6}" text-anchor="middle"></text><text class="he" x="{x}" y="{y+19}" text-anchor="middle">{sf[1]}</text><text x="{x}" y="{y+60}" text-anchor="middle">{sf[0]}</text></g>'
 if d.get('showTriangle'):
  s+='<g class="tree-tri-labels" aria-hidden="true">'+''.join(f'<text x="{x}" y="{y}" text-anchor="middle">{t}</text>' for x,y,t in [(407,347,'щедрость'),(93,347,'мера'),(250,416,'согласование')])+'</g>'
 return s+'</svg>'
def tree3(d,L):
 mode=d.get('mode','explore');tasks=d.get('tasks') or []
 panel='<div class="tree3-panel">'
 if mode=='find':panel+='<p class="lab3-label" data-tree-step></p><p class="tree3-task" data-tree-task></p><div class="lab-detail" data-detail aria-live="polite"></div><button class="button secondary" type="button" data-tree-next hidden>Следующее задание →</button>'
 elif mode=='place':panel+='<p class="lab3-label">Имена</p><div class="tree3-names" data-tree-names>'+''.join(f'<button type="button" data-name="{i}" aria-pressed="false">{E(D["sefirot"][i][0])}</button>' for i in shuffled(10,'place:'+str(L and L['id'])))+'</div>'
 else:panel+='<div class="lab-detail" data-detail aria-live="polite"></div>'
 panel+='</div>'
 caption='<p class="diagram-caption">Условная схема нескольких связей. Она не задаёт универсальные 22 пути или соответствия картам Таро.</p>'
 inner=f'<div class="tree3 lab-split" data-tree-mode="{mode}">'+tree_svg(d)+panel+'</div>'+bar(check='Проверить' if mode=='place' else None,reset=True)+caption
 return shell('tree','tree-'+mode,{**d,'mode':mode,'tasks':tasks},inner)

# ---------------------------------------------------------------- worlds: a real 4 × 10 grid
def worlds(d,L):
 daat=bool(d.get('showDaat'))
 g=f'<div class="worlds3{" has-daat" if daat else ""}" role="group" aria-label="Четыре мира — строки, десять сефирот — столбцы">'
 g+='<span class="w3-corner" style="--r:1;--c:1"></span>'
 cols=lambda s:s+2+(1 if daat and s>=2 else 0)
 for s,sf in enumerate(D['sefirot']):g+=f'<span class="w3-head w3-col" style="--r:1;--c:{cols(s)}">{E(sf[0])}</span>'
 if daat:g+='<span class="w3-daat" style="--c:4" aria-hidden="true"><i>Даат</i></span>'
 for w,wd in enumerate(D['worlds']):
  g+=f'<span class="w3-head w3-row" style="--r:{w+2};--c:1">{E(wd[0])}<small>{E(wd[1])}</small></span>'
  for s,sf in enumerate(D['sefirot']):g+=f'<button type="button" class="w3-cell" style="--r:{w+2};--c:{cols(s)}" data-w="{w}" data-s="{s}" aria-label="{E(wd[0])}, {E(sf[0])}"></button>'
 g+='</div>'
 if daat:g+='<p class="diagram-caption w3-daat-caption"><span class="w3-daat-key" aria-hidden="true"></span>Даат — знание; в счёт десяти здесь не входит, поэтому своей клетки у него нет.</p>'
 inner='<p class="lab3-label" data-w-step></p><p class="tree3-task" data-w-task></p><p class="fine w3-turn">На узком экране таблица повёрнута: миры — столбцы, сефирот — строки.</p><div class="worlds3-scroll">'+g+'</div><div class="lab-detail" data-detail aria-live="polite"></div><button class="button secondary" type="button" data-w-next hidden>Следующее задание →</button>'+bar(check=None)
 return shell('worlds','worlds',d,inner)

# ---------------------------------------------------------------- letters: all 22 in one row, multi-select
def letters(d,L):
 row='<div class="letters3" dir="rtl" role="group" aria-label="22 буквы, справа налево: от алеф до тав">'+''.join(f'<button type="button" data-letter3="{c}" aria-pressed="false" aria-label="{n}"><span lang="he">{c}</span><small dir="ltr">{n}</small></button>' for c,n in zip(LETTERS,LETTER_NAMES))+'</div>'
 inner='<div class="formula">10 + 22 = 32</div><p class="lab3-label" data-l-step></p><p class="tree3-task" data-l-task></p>'+row+'<p class="diagram-caption">Алфавит читается справа налево: алеф — первая буква справа, тав — последняя слева.</p><div class="lab-detail" data-detail aria-live="polite"></div><button class="button secondary" type="button" data-l-next hidden>Следующее задание →</button>'+bar()
 return shell('letters','letters',d,inner)

# ---------------------------------------------------------------- step-by-step images: rose, soul, balance, river
def steps_lab(kind,labels,texts,svg,d,extra='',success=None):
 data={**d,'steps':[[a,b] for a,b in zip(labels,texts)]}
 inner=svg+'<div class="chips lab3-steps">'+''.join(f'<button type="button" data-step3="{i}" aria-pressed="false">{E(t)}</button>' for i,t in enumerate(labels))+'</div><div class="lab-detail" data-detail aria-live="polite"></div>'+extra+bar(check=None,reset=False)
 return shell(kind,kind,data,inner,success=success if success is not None else d.get('success') or 'Все шаги просмотрены. Вернитесь к любому из них, если хочется сравнить.')
def rose(d,L):
 st=d['steps'];svg=design.diagram('c-images/rose.svg').replace('<svg class="c-images-rose"','<svg class="c-images-rose" data-focus="image"',1)
 data={**d,'shapes':[x.get('shape','image') for x in st]}
 return steps_lab('rose',[x['label'] for x in st],[x['text'] for x in st],svg,data,success=d.get('success') or 'Вы прошли все слои: стих, два цвета и роза целиком. Какой из них добавил Зоар, а какой — издание?')
SOUL_INFO=[['Нефеш','В Лех леха §§ 155–158 описана как нижний уровень, связанный с телом и служащий опорой руаху.'],['Руах','Связан с нефеш и служит опорой нешаме. Важна связь уровней, а не перечень отдельных частей.'],['Нешама','В выбранном отрывке названа высшей относительно нефеш и руаха. Мы разбираем религиозную модель души.']]
def soul_svg(note):
 s=design.diagram('b-light/soul.svg')
 if not note:return s
 s=s.replace('viewBox="0 0 520 200"','viewBox="0 -64 520 264"',1)
 return s.replace('</svg>','<g class="soul-upper" aria-hidden="true"><path d="M429 -8V41" fill="none" stroke="#8aa5af" stroke-width="1.4" stroke-dasharray="5 5"/><rect x="356" y="-56" width="146" height="48" rx="4" fill="#f7fafb" stroke="#8aa5af" stroke-width="1.6" stroke-dasharray="6 5"/><text x="429" y="-26" text-anchor="middle" fill="#526c78" font-size="18">хая · йехида</text></g></svg>',1)
def soul(d,L):
 note=d.get('note','')
 names=['нефеш','руах','нешама']
 sel=lambda n:f'<label class="soul3-slot"><span class="sr-only">Место {n}</span><select data-chain="{n-1}"><option value="">…</option>'+''.join(f'<option value="{i}">{t}</option>' for i,t in enumerate(names))+'</select></label>'
 chain='<div class="soul3-chain"><p class="lab3-label">Цепочка одной фразой</p><p class="soul3-line">'+sel(1)+' <span>— престол для</span> '+sel(2)+'<span>, а</span> '+sel(3)+' <span>— престол для</span> '+sel(4)+'</p><button class="button" type="button" data-chain-check>Проверить</button></div>'
 cap=f'<p class="diagram-caption">Пунктир: {E(note)}.</p>' if note else ''
 data={**d,'chain':[0,1,1,2]}
 return steps_lab('soul',[x[0] for x in SOUL_INFO],[x[1] for x in SOUL_INFO],soul_svg(note)+cap,data,extra=chain,success=d.get('success') or 'Цепочка собрана: нижняя ступень становится престолом — опорой — для следующей.')
BALANCE_INFO=[['Щедрость','Учебная аналогия: хочется дать ученику много интересного материала. Сама по себе щедрость ещё не определяет подходящий объём.'],['Мера','Нужны границы: посильная задача, ясная последовательность, время на понимание.'],['Согласование','Преподаватель соединяет щедрость и меру так, чтобы занятие помогало учиться. Это современная аналогия, а не исчерпывающее определение сефирот.']]
def balance(d,L):
 return steps_lab('balance',[x[0] for x in BALANCE_INFO],[x[1] for x in BALANCE_INFO],design.diagram('a-tree/balance-triad.svg'),d or {},success=(d or {}).get('success') or 'Три круга прочитаны. Урок из одной щедрости перегружает, из одной меры — сковывает; согласование держит обе.')
RIVER_INFO=[['Реки','В выбранной редакции Пкудей §§ 1–2 реки и источники поясняются через сефирот Зеир Анпина.'],['Море','Малхут принимает поток. Принимающее начало одновременно становится передающим.'],['Ниже по течению','Поток направляется дальше к ступеням миров Брия, Йецира, Асия. Схема показывает отношение, а не движение физической воды.']]
def river(d,L):
 st=(d or {}).get('steps') or RIVER_INFO
 return steps_lab('river',[x[0] for x in st],[x[1] for x in st],design.diagram('b-light/rivers.svg'),d or {},success=(d or {}).get('success') or 'Путь прослежен: реки наполняют море, море поит нижние ступени. Это отношение принятия и передачи, а не движение воды.')

# ---------------------------------------------------------------- Tarot: deck, hermit, observe, pair
DECK_TYPES=['Старший аркан','Придворная','Числовая']
def deck(d,L):
 cards=''.join(f'<li><button type="button" class="deck3-card" data-card3="{n}" aria-pressed="false"><img loading="lazy" width="96" height="166" src="{E(expansion.CARDS[c["card"]]["image"],quote=True)}" alt=""><span class="deck3-name">{E(expansion.CARDS[c["card"]]["name"])}</span><span class="deck3-mark" data-card3-mark></span></button></li>' for n,c in enumerate(d['cards']))
 groups='<div class="deck3-groups" role="group" aria-label="Группа выбранной карты">'+''.join(f'<button type="button" class="button secondary" data-type3="{i}">{t}</button>' for i,t in enumerate(DECK_TYPES))+'</div>'
 inner='<div class="formula">22 + 4 × 14 = 78</div><div class="deck3-panel"><p class="lab3-label" data-deck-current>Выберите карту</p>'+groups+bar(check=None)+'</div><ul class="deck3-grid">'+cards+'</ul>'
 return shell('deck','deck',d,inner)
def hermit(d,L):
 c=d['card'];ch=d['checklist'];q=d.get('question') or {}
 p1='<section class="hermit3-pass"><h4><span>1</span> Сначала вижу</h4><p>Какие из этих деталей есть на карте? Отметьте только то, что можно показать пальцем.</p><div class="hermit3-list">'+''.join(f'<label class="self-check hermit3-item" data-h-item="{i}"><input type="checkbox" data-h-check="{i}"><span>{E(x["text"])}</span><em class="hermit3-mark" data-h-mark></em></label>' for i,x in enumerate(ch))+'</div><button class="button" type="button" data-h-verify>Проверить</button><div class="lab3-feedback" data-h-fb aria-live="polite"></div></section>'
 p2='<section class="hermit3-pass"><h4><span>2</span> Читаю Уэйта</h4><blockquote class="hermit3-waite">'+E(d.get('waite',''))+'</blockquote><p class="fine">Пересказ, а не цитата: слова автора отделены от рисунка.</p></section>'
 p3='<section class="hermit3-pass"><h4><span>3</span> Задаю свой вопрос</h4>'+paras(q.get('instruction',''))+'<label class="hermit3-q"><span class="lab3-label">Мой вопрос к карте</span><textarea rows="2" maxlength="400" data-h-question placeholder="Мой вопрос: что…? с чего…? какие сведения…?"></textarea></label><p class="lab3-warn" data-h-warn aria-live="polite"></p><button class="button" type="button" data-h-ask>Проверить вопрос</button><div class="lab3-feedback" data-h-fb3 aria-live="polite"></div></section>'
 inner='<div class="hermit3">'+card_img(c,180,'lab3-card hermit3-card')+'<div class="hermit3-passes">'+p1+p2+p3+'</div></div>'+bar(check=None)
 return shell('hermit','hermit',d,inner,instruction=d.get('instruction') or 'Три прохода по одной карте: сначала только то, что видно, потом слова автора, потом Ваш вопрос.')
def observe(d,L):
 n=int(d.get('fields') or 5);verbs=bool(d.get('verbs'))
 rows=''.join(f'<li class="observe3-row"><label><span class="sr-only">Наблюдение {i+1}</span><input type="text" maxlength="200" data-obs="{i}" placeholder="Вижу: …" autocomplete="off"></label>'+(f'<button type="button" class="observe3-verb-btn" data-obs-verb="{i}" aria-expanded="false">В глагол</button><label class="observe3-verb" hidden><span class="lab3-label">Действие</span><input type="text" maxlength="200" data-obs-verbtext="{i}" placeholder="Кто что делает: … переливает …" autocomplete="off"></label>' if verbs else '')+'</li>' for i in range(n))
 inner='<div class="observe3">'+card_img(d['card'],180)+'<div><ol class="observe3-list">'+rows+'</ol><button class="button" type="button" data-lab3-check>Проверить</button></div></div><div class="lab3-bar"><span class="lab3-count" data-lab3-count role="status"></span></div><div class="lab3-feedback" data-lab3-feedback aria-live="polite"></div>'
 return shell('observe','observe',{**d,'fields':n,'verbs':verbs},inner)
def pair(d,L):
 A,B=expansion.CARDS[d['a']],expansion.CARDS[d['b']]
 f=lambda k,x,y:f'<label class="pair3-field"><span class="lab3-label">{E(x)} → {E(y)}</span><textarea rows="3" maxlength="600" data-pair="{k}" placeholder="Сначала {E(x)}: … затем {E(y)}: …"></textarea></label>'
 inner='<div class="pair3-cards">'+card_img(d['a'],150)+'<span class="pair3-arrow" aria-hidden="true">⇄</span>'+card_img(d['b'],150)+'</div>'+f(0,A['name'],B['name'])+f(1,B['name'],A['name'])+bar()
 return shell('pair','pair',{**d,'nameA':A['name'],'nameB':B['name']},inner)

def render(kind,L,d):
 """A v3 lab, or None when the kind has no v3 form (the caller keeps the old one)."""
 d=d or {}
 if kind=='sort':return sort(d,L)
 if kind=='timeline' and d.get('events'):return timeline(d,L)
 if kind=='tree' and d.get('mode'):return tree3(d,L)
 if kind=='worlds' and d.get('tasks'):return worlds(d,L)
 if kind=='letters' and d.get('tasks'):return letters(d,L)
 if kind=='rose' and d.get('steps'):return rose(d,L)
 if kind=='luria' and d.get('mode'):return luria(d,L)
 if kind=='soul':return soul(d,L)
 if kind=='balance':return balance(d,L)
 if kind=='river':return river(d,L)
 if kind=='deck' and d.get('cards'):return deck(d,L)
 if kind=='hermit' and d.get('checklist'):return hermit(d,L)
 if kind=='observe':return observe(d,L)
 if kind=='pair':return pair(d,L)
 return None
