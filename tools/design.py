"""Visual layer of the site: self-hosted Tarot cards, fonts as files, emblems, upgraded diagrams, landing,
deck page and offline mode. Called by build_course.py on every build, so the design survives rebuilds.

Sources (all committed):
  tools/design/diagrams/<set>/manifest.json + *.svg   upgraded diagrams (replacement by aria-label)
  tools/design/landing/*                               landing fragments and landing CSS (inlined into index.html)
  tools/design/course/*                                /course/ and /course/tarot/ fragments, line emblems
  tools/design/tarot-view.template.js                  lightbox; the 78-card JSON is filled in from content/tarot.json
  tools/design/sw.template.js                          service worker; VERSION follows the content of the shell assets
  assets/course/design/*.css                           appended to course.css (visual, tarot-view, diagrams-*)
Every function here is idempotent: running the build twice leaves no diff.
"""
from pathlib import Path
from urllib.parse import unquote
import hashlib,json,re

ROOT=Path(__file__).resolve().parents[1]
DES=ROOT/'tools/design'
CFG=json.loads((ROOT/'content/site.json').read_text(encoding='utf-8'))
ORIGIN=CFG['origin'].rstrip('/')
TAROT=json.loads((ROOT/'content/tarot.json').read_text(encoding='utf-8'))['cards']
PAGES=json.loads((ROOT/'content/course.json').read_text(encoding='utf-8')).get('pages') or {}
SUITS={'major':'major','w':'wands','c':'cups','s':'swords','p':'pentacles'}
SUIT_TITLE={'major':'Старший аркан','wands':'Жезлы','cups':'Кубки','swords':'Мечи','pentacles':'Пентакли'}

def read(rel):return (DES/rel).read_text(encoding='utf-8')
def diagram(rel):return read('diagrams/'+rel).strip()
def fragment(rel):return read(rel).strip()
def prefix_of(rel):return '../'*rel.count('/')
def emblem(prefix,id,cls):return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="{prefix}assets/emblems/emblems.svg#{id}"/></svg>'

def card_slug(c):return f"{SUITS[c['group']]}-{c['rank']:02d}"
def cards():
 """The 78 cards as the lightbox and the deck page need them: majors, wands, cups, swords, pentacles by rank."""
 out=[]
 for c in TAROT:
  suit=SUITS[c['group']];file=unquote(c['imageSource'].rsplit('File:',1)[1])
  out.append({'slug':card_slug(c),'id':'card-'+c['id'],'name':c['name'],'suit':suit,'rank':c['rank'],'file':file})
 order=list(SUITS.values())
 return sorted(out,key=lambda c:(order.index(c['suit']),c['rank']))

# ---------------------------------------------------------------- page finishing (every generated page)
CARD_IMG=re.compile(r'<img\b[^>]*>')
CARD_SRC=re.compile(r'\ssrc="/assets/tarot/([a-z]+-\d\d)-240\.webp"')
CARD_WIDGETS=re.compile(r'assets/course/(?:tarot-pairs|tarot-triples|spread-grammar|court-relations|pathways)\.js')

def card_images(h,prefix):
 """<img> of a card: page-relative src, srcset 240w/480w, sizes from the declared width (default 120)."""
 def one(m):
  tag=m.group(0);s=CARD_SRC.search(tag)
  if not s or 'srcset=' in tag:return tag
  w=(re.search(r'\swidth="(\d+)"',tag) or [0,'120'])[1];base=f'{prefix}assets/tarot/{s.group(1)}'
  tag=tag.replace(s.group(0),f' src="{base}-240.webp" srcset="{base}-240.webp 240w, {base}-480.webp 480w" sizes="{w}px"',1)
  return re.sub(r'\sdecoding="[^"]*"','',tag,count=1).replace('<img','<img decoding="async"',1)
 return CARD_IMG.sub(one,h)

def head(h,prefix):
 add=[]
 if not re.search(r'rel="preload"[^>]+Cormorant-400-normal',h):
  add+=[f'<link rel="preload" href="{prefix}assets/fonts/Cormorant-400-normal.woff" as="font" type="font/woff" crossorigin>',f'<link rel="preload" href="{prefix}assets/fonts/Golos-400-normal.woff" as="font" type="font/woff" crossorigin>']
 if 'rel="manifest"' not in h:add.append(f'<link rel="manifest" href="{prefix}site.webmanifest">')
 if 'apple-touch-icon' not in h:add.append(f'<link rel="apple-touch-icon" href="{prefix}assets/icons/apple-touch-icon.png">')
 if 'name="theme-color"' not in h:add.append('<meta name="theme-color" content="#122e3b">')
 if add:h=re.sub(r'(<meta charset="utf-8">)',lambda m:m.group(1)+'\n'+'\n'.join(add),h,count=1,flags=re.I)
 return h

def manifests():
 out=[]
 for d in sorted(p for p in (DES/'diagrams').iterdir() if p.is_dir()):
  m=json.loads((d/'manifest.json').read_text(encoding='utf-8'));m['dir']=d.name;out.append(m)
 return out
MANIFESTS=manifests()

def diagrams(h):
 """Diagrams of the other builders (Yetzirah, Hekate, book modules) are replaced by aria-label;
 those of build_course.py are emitted upgraded by the generator itself ("inGenerator")."""
 for man in MANIFESTS:
  for r in man.get('replacements',[]):
   if r.get('inGenerator') or r['ariaLabel'] not in h:continue
   svg=diagram(man['dir']+'/'+r['file'])
   h=re.sub(r'<svg\b[^>]*aria-label="'+re.escape(r['ariaLabel'])+r'"[^>]*>[\s\S]*?</svg>',lambda m:svg,h)
  if man.get('defsHtml') and any(s in h for s in man.get('detect',[])) and f'data-defs="{man["dir"]}"' not in h:
   defs=re.sub(r'^<svg\b',f'<svg data-defs="{man["dir"]}"',diagram(man['dir']+'/'+man['defsHtml']))
   h=re.sub(r'(<body[^>]*>)',lambda m:m.group(1)+defs,h,count=1)
 return h

def _esc(v):return v.replace('&','&amp;').replace('"','&quot;').replace('<','&lt;')
CONTACT_LINK=re.compile(r'(?: · )?<a class="contact-link"[^>]*>[^<]*</a>')
def contact(rel,h,prefix):
 """«Написать автору» from content/site.json → contact:{email,telegram}; empty → nothing rendered."""
 c=CFG.get('contact') or {}
 email=str(c.get('email') or '').strip();tg=str(c.get('telegram') or '').strip().lstrip('@')
 h=re.sub(r'<p class="contact-line">[\s\S]*?</p>','',h)
 h=re.sub(r'(<footer\b[\s\S]*?</footer>)',lambda m:CONTACT_LINK.sub('',m.group(1)),h)
 h=h.replace(f'<script src="{prefix}assets/course/contact.js" defer></script>\n','')
 if not (email or tg):return h
 u,_,host=email.partition('@')
 mail=f'<a class="contact-link" href="#" aria-disabled="true" data-contact-user="{_esc(u)}" data-contact-host="{_esc(host)}">Написать автору</a>' if email else ''
 tgl=f'<a class="contact-link" href="https://t.me/{_esc(tg)}" target="_blank" rel="noopener noreferrer">Telegram</a>' if tg else ''
 if rel=='index.html':h=re.sub(r'(<footer><p>[^<]*</p><p>)([\s\S]*?)(</p></footer>)',lambda m:m.group(1)+m.group(2)+' · '+' · '.join(x for x in [mail,tgl] if x)+m.group(3),h,count=1)
 else:h=re.sub(r'(<footer class="footer">[\s\S]*?)(</div></footer>)',lambda m:m.group(1)+mail+tgl+m.group(2),h,count=1)
 if rel=='author/index.html':
  line='<p class="contact-line">Вопрос, замечание или отклик: '+(f'<a class="contact-link" href="#" aria-disabled="true" data-contact-user="{_esc(u)}" data-contact-host="{_esc(host)}" data-contact-show="address">написать автору</a>' if email else '')+(' · ' if email and tg else '')+(f'<a class="contact-link" href="https://t.me/{_esc(tg)}" target="_blank" rel="noopener noreferrer">@{_esc(tg)} в Telegram</a>' if tg else '')+'.'+(f'<noscript> Адрес: {_esc(u)} [at] {_esc(host)}</noscript>' if email else '')+'</p>'
  h=h.replace('<div class="actions">',line+'<div class="actions">',1)
 if email:h=h.replace('</body>',f'<script src="{prefix}assets/course/contact.js" defer></script>\n</body>',1)
 return h

def scripts(h,prefix):
 triggers='commons.wikimedia.org/wiki/File:' in h or 'class="deck-card"' in h or CARD_WIDGETS.search(h)
 if triggers and 'tarot-view.js' not in h:h=h.replace('</body>',f'<script src="{prefix}assets/course/tarot-view.js" defer></script>\n</body>',1)
 if 'sw-register.js' not in h:h=re.sub(r'</body>',f'<script src="{prefix}assets/course/sw-register.js" defer></script>\n</body>',h,count=1,flags=re.I)
 return h

LINE_EMBLEMS=json.loads(read('course/line-emblems.json'))
def line_emblems(h,prefix):
 def one(m):
  attrs,pre,title=m.group(1),m.group(2),m.group(3)
  plain=re.sub(r'<[^>]+>','',title).strip()
  hit=next((p for p in LINE_EMBLEMS if plain.startswith(p['h2'])),None)
  return f'<section class="books-start has-emblem"{attrs}>{emblem(prefix,hit["emblem"],"line-emblem")}{pre}{title}</h2>' if hit else m.group(0)
 return re.sub(r'<section class="books-start"([^>]*)>([\s\S]*?<h2[^>]*>)([\s\S]*?)</h2>',one,h)

def finish(rel,h):
 """rel = output path relative to the site root, e.g. 'course/tarot/index.html'."""
 prefix=prefix_of(rel)
 h=card_images(h,prefix)
 h=head(h,prefix)
 if rel=='course/index.html':h=line_emblems(h,prefix)
 h=diagrams(h)
 h=contact(rel,h,prefix)
 return scripts(h,prefix)

# ---------------------------------------------------------------- landing (index.html is edited in place)
FONT_FILES={('Cormorant','normal'):'Cormorant-400-normal.woff',('Cormorant','italic'):'Cormorant-400-italic.woff',('Golos','normal'):'Golos-400-normal.woff'}
def externalize_fonts(text,font_dir):
 def face(m):
  body=m.group(1)
  fam=(re.search(r'font-family\s*:\s*[\'"]?([^;\'"]+)',body) or [0,''])[1].strip();st=(re.search(r'font-style\s*:\s*([a-z]+)',body) or [0,'normal'])[1]
  f=FONT_FILES.get((fam,st))
  if not f or 'data:font' not in body:return m.group(0)
  return re.sub(r'url\(\s*["\']?data:font[^)]*\)\s*format\(\s*[\'"]?woff[\'"]?\s*\)',lambda _:f"url({font_dir}{f}) format('woff')",m.group(0),count=1)
 return re.sub(r'@font-face\s*\{([^}]*)\}',face,text)

HERO='<picture><source type="image/webp" srcset="assets/img/beginning-640.webp 640w, assets/img/beginning-960.webp 960w, assets/img/beginning-1280.webp 1280w, assets/img/beginning-1536.webp 1536w" sizes="(max-width: 760px) calc(100vw - 48px), 52vw"><img src="assets/beginning.jpg" width="1536" height="1024" fetchpriority="high" decoding="async" alt="{alt}"></picture>'
CSS_START='\n/* === upgrade: landing components === */\n';CSS_END='\n/* === end: landing components === */'
def routes_html():return fragment('landing/routes.html')
def landing(s):
 def hero(m):
  alt=(re.search(r'alt="([^"]*)"',m.group(0)) or [0,''])[1]
  return HERO.format(alt=alt)
 s=re.sub(r'<img src="data:image/jpeg;base64,[^"]+"[^>]*>|<picture><source type="image/webp" srcset="assets/img/beginning-[\s\S]*?</picture>',hero,s,count=1)
 s=s.replace('text-align:justify;hyphens:auto','text-align:left;hyphens:manual')
 if 'data:font/' in s:s=externalize_fonts(s,'assets/fonts/')
 css=CSS_START+read('landing/landing.css')+CSS_END
 if CSS_START in s:s=re.sub(re.escape(CSS_START)+r'[\s\S]*?'+re.escape(CSS_END),lambda m:css,s,count=1)
 else:s=re.sub(r'(\s*)</style>',lambda m:css+'\n'+m.group(1)+'</style>',s,count=1)
 band=fragment('landing/deck-band.html')
 if 'class="deck-band"' in s:s=re.sub(r'<section class="deck-band"[\s\S]*?</section>',lambda m:band,s,count=1)
 else:s=re.sub(r'(</section>\s*)(<footer>)',lambda m:m.group(1)+band+'\n'+m.group(2),s,count=1)
 # second equal entrance next to «Открыть курс» (review, priority 1): straight to a card
 label=PAGES.get('landingSecondLink','Начать с карты →').rstrip(' →')
 second=f'<a class="read read-second" href="course/reading-the-hermit/">{label} <span aria-hidden="true">→</span></a>'
 s=re.sub(r'(<a class="read" href="course/">[^<]*<span aria-hidden="true">→</span></a>)(<a class="read read-second"[^>]*>[\s\S]*?</a>)?',lambda m:m.group(1)+second,s,count=1)
 return finish('index.html',s)

# ---------------------------------------------------------------- shared assets
def _slim(s):return re.sub(r'\n{2,}','\n',re.sub(r'^[ \t]+','',re.sub(r'/\*[\s\S]*?\*/','',s),flags=re.M)).strip()
DESIGN_CSS=['visual.css','tarot-view.css']
def course_css(fonts,style):
 parts=DESIGN_CSS+sorted(p.name for p in (ROOT/'assets/course/design').glob('diagrams-*.css'))
 c=externalize_fonts(fonts,'../fonts/')+'\n'+style
 for p in parts:c+=f'\n/* === upgrade: {p} === */\n{_slim((ROOT/"assets/course/design"/p).read_text(encoding="utf-8"))}\n'
 return c

def write_assets():
 """tarot-view.js (lightbox with the 78 cards) and sw.js (offline mode). Call after course.css is written."""
 tv=read('tarot-view.template.js');assert '/*__CARDS_JSON__*/[]' in tv
 tv=tv.replace('/*__CARDS_JSON__*/[]',json.dumps(cards(),ensure_ascii=False,separators=(',',':')))
 (ROOT/'assets/course/tarot-view.js').write_text(tv,encoding='utf-8')
 sw=read('sw.template.js');shell=hashlib.sha1()
 precache=re.search(r'const PRECACHE = \[([\s\S]*?)\];',sw).group(1)
 for rel in re.findall(r"'/((?:assets/[^']+\.[a-z0-9]+)|site\.webmanifest)'",precache):shell.update((ROOT/rel).read_bytes().replace(b'\r\n',b'\n'))
 sw=re.sub(r"const VERSION = '[^']*';",f"const VERSION = 'kt-{shell.hexdigest()[:10]}';",sw,count=1)
 (ROOT/'sw.js').write_text(sw,encoding='utf-8')

# ---------------------------------------------------------------- deck page /course/tarot/deck/
NB=' '
def _nb(s):
 s=re.sub(r'(?:^|(?<=[\s(« ]))([А-Яа-яЁёA-Za-z0-9]{1,2}) ',lambda m:m.group(1)+NB,s)
 return re.sub(r'(\d{4}) год',r'\1'+NB+'год',s.replace(' —',NB+'—'))
def _plural(n,one,few,many):
 a,b=n%10,n%100
 return one if a==1 and b!=11 else few if 2<=a<=4 and (b<12 or b>14) else many
def _e(s):return str(s).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')
DECK_SECTIONS=[('major','Старшие арканы','em-major'),('wands','Жезлы','em-wands'),('cups','Кубки','em-cups'),('swords','Мечи','em-swords'),('pentacles','Пентакли','em-pentacles')]

def build_deck():
 """Full-deck gallery. Head conventions, header and footer come from the built /course/tarot/ page."""
 src=(ROOT/'course/tarot/index.html').read_text(encoding='utf-8')
 P='../../../';URL=ORIGIN+'/course/tarot/deck/'
 def pick(rx):
  m=re.search(rx,src)
  if not m:raise SystemExit('deck page: '+rx+' not found in course/tarot/index.html')
  return m.group(0)
 rebase=lambda x:re.sub(r'(\s(?:href|src))=(["\']?)\.\./\.\./',lambda m:m.group(1)+'='+m.group(2)+P,x)
 meta_author=pick(r'<meta name="author"[^>]*>');og_site=pick(r'<meta property="og:site_name"[^>]*>');og_locale=pick(r'<meta property="og:locale"[^>]*>');twitter=pick(r'<meta name="twitter:card"[^>]*>')
 icon=rebase(pick(r'<link rel="icon"[^>]*>'));course_css=rebase(pick(r'<link rel="stylesheet" href="\.\./\.\./assets/course/course\.css"[^>]*>'))
 header=rebase(pick(r'<a class="skip"[\s\S]*?</header>'))
 header=re.sub(r'\saria-current=(["\']?)page\1','',header)
 header=re.sub(r'(<a href="\.\./\.\./\.\./course/tarot/")\s*>',r'\1 aria-current="page">',header,count=1)
 assert 'aria-current="page">Таро<' in header
 footer=CONTACT_LINK.sub('',rebase(pick(r'<footer class="footer">[\s\S]*?</footer>')))
 cs=cards();by={s[0]:[] for s in DECK_SECTIONS}
 for c in cs:by[c['suit']].append(c)
 for l in by.values():l.sort(key=lambda c:c['rank'])
 total=len(cs);major=len(by['major']);assert total==78 and major==22
 title='Колода Таро: все 78 карт Райдера–Уэйта–Смит'
 description='Все 78 карт колоды Райдера–Уэйта–Смит (1909) с рисунками Памелы Колман Смит: старшие арканы и четыре масти. Каждую карту можно рассмотреть крупно.'
 ordered=[c for s in DECK_SECTIONS for c in by[s[0]]]
 ld={'@context':'https://schema.org','@graph':[
  {'@type':'CollectionPage','@id':URL+'#page','url':URL,'name':title,'description':description,'inLanguage':'ru','isPartOf':{'@id':ORIGIN+'/#website'},'breadcrumb':{'@id':URL+'#breadcrumb'},'primaryImageOfPage':{'@type':'ImageObject','url':ORIGIN+'/assets/og/deck.jpg'},
   'mainEntity':{'@type':'ItemList','numberOfItems':total,'itemListOrder':'https://schema.org/ItemListOrderAscending','itemListElement':[{'@type':'ListItem','position':i+1,'name':c['name'],'url':ORIGIN+'/course/tarot/#'+c['id']} for i,c in enumerate(ordered)]}},
  {'@type':'BreadcrumbList','@id':URL+'#breadcrumb','itemListElement':[{'@type':'ListItem','position':i+1,'name':n,'item':u} for i,(n,u) in enumerate([('Главная',ORIGIN+'/'),('Курс',ORIGIN+'/course/'),('Таро',ORIGIN+'/course/tarot/'),('Колода',URL)])]},
  {'@type':'WebSite','@id':ORIGIN+'/#website','name':'Каббала и Таро','url':ORIGIN+'/','inLanguage':'ru'}]}
 ldj=json.dumps(ld,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
 def tile(c):
  base=f'{P}assets/tarot/{c["slug"]}';num=f'<span class="deck-card-num">{c["rank"]}</span>' if c['suit']=='major' else ''
  return (f'<li><a class="deck-card" href="../#{c["id"]}" data-slug="{c["slug"]}">'
   f'<span class="deck-card-frame"><img src="{base}-240.webp" srcset="{base}-240.webp 240w, {base}-480.webp 480w" sizes="(max-width:600px) 30vw, 150px" width="240" height="413" loading="lazy" decoding="async" alt="{_e(c["name"])}"></span>'
   f'<span class="deck-card-cap" aria-hidden="true">{num}<span class="deck-card-name">{_e(c["name"])}</span></span></a></li>')
 def section(sid,stitle,em):
  l=by[sid];n=len(l)
  return (f'<section class="deck-section" id="{sid}" data-deck-suit="{sid}" aria-labelledby="deck-h-{sid}">'
   f'<div class="deck-head"><h2 id="deck-h-{sid}"><svg class="emblem" aria-hidden="true" focusable="false"><use href="{P}assets/emblems/emblems.svg#{em}"/></svg><span>{_e(stitle)}</span></h2>'
   f'<p class="deck-head-count">{n}{NB}{_plural(n,"карта","карты","карт")}</p></div>\n'
   f'<ol class="deck-list">\n'+'\n'.join(tile(c) for c in l)+'\n</ol></section>')
 chips=''.join(f'<button type="button" data-filter="{f}" aria-pressed="{"true" if f=="all" else "false"}">{_e(t)}</button>' for f,t in [('all','Все')]+[(s[0],s[1]) for s in DECK_SECTIONS])
 html=(f'<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#122e3b">\n'
  f'<title>{_e(title)} | Элиора Вейра</title>\n'
  f'<meta name="description" content="{_e(description)}">{meta_author}<meta name="robots" content="index,follow,max-image-preview:large">\n'
  f'<link rel="canonical" href="{URL}">\n'
  f'<meta property="og:type" content="website">{og_locale}{og_site}<meta property="og:title" content="{_e(title)}"><meta property="og:description" content="{_e(description)}"><meta property="og:url" content="{URL}"><meta property="og:image" content="{ORIGIN}/assets/og/deck.jpg">{twitter}\n'
  f'{course_css}{icon}\n'
  f'<script type="application/ld+json">{ldj}</script>\n'
  f'</head>\n'
  f'<body>{header}<main class="wrap" id="main"><nav class="crumb" aria-label="Путь к странице"><span><a href="{P}">Главная</a></span><span><a href="{P}course/">Курс</a></span><span><a href="../">Таро</a></span><span>Колода</span></nav>\n'
  f'<header class="hero-small deck-hero"><p class="eyebrow">Таро · вся колода</p><h1>Семьдесят восемь <em>карт</em></h1>\n'
  f'<p class="lead">{_nb("Колода Райдера–Уэйта–Смит, 1909 год. Рисунки Памелы Колман Смит. Нажмите на карту, чтобы рассмотреть её крупно. Подробный разбор каждой карты — в разделе")} <a href="../#cards">«Все 78{NB}карт»</a>.</p>\n'
  f'<ul class="deck-meta"><li>{major}{NB}старших аркана</li><li>{total-major}{NB}младших</li><li>4{NB}масти</li></ul></header>\n'
  f'<div class="deck-toolbar"><div class="chips deck-filter" role="group" aria-label="Показать карты" data-deck-filter hidden>{chips}</div><p class="deck-status" role="status" aria-live="polite" data-deck-count>Показано: {total}{NB}{_plural(total,"карта","карты","карт")}</p></div>\n'
  f'<div id="deck-grid" class="deck">\n'+'\n'.join(section(*s) for s in DECK_SECTIONS)+'\n</div>\n'
  f'<section class="section deck-credits" aria-labelledby="deck-credits-h"><h2 id="deck-credits-h">Об изображениях</h2>\n'
  f'<p>{_nb("Колода Райдера–Уэйта–Смит, 1909 год. Рисунки Памелы Колман Смит; изображения находятся в общественном достоянии. Сканы — из собрания")} <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener">Wikimedia Commons&nbsp;↗</a>{_nb(": в крупном просмотре у каждой карты есть ссылка на страницу её файла. Цвета могут различаться между изданиями.")}</p>\n'
  f'<p class="deck-back"><a class="button secondary" href="../">Все занятия Таро и 78 карт →</a></p></section>\n'
  f'</main>{footer}\n'
  f'<script src="{P}assets/course/tarot-view.js" defer></script>\n'
  f'</body></html>\n')
 out=ROOT/'course/tarot/deck/index.html';out.parent.mkdir(parents=True,exist_ok=True)
 out.write_text(finish('course/tarot/deck/index.html',html),encoding='utf-8')
 return '/course/tarot/deck/'
