"""Check real content invariants and internal destinations, without network dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,collections
P=Path(__file__).resolve().parents[1]
class HTML(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.links=[];self.js=[];self.uses=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  # images (src and every srcset candidate) must resolve; <use href="file.svg#id"> must name an existing symbol
  if tag=='img' and a.get('src'):self.links.append(a['src'])
  if tag in ['img','source'] and a.get('srcset'):self.links+=[c.strip().split()[0] for c in a['srcset'].split(',') if c.strip()]
  if tag=='use' and (a.get('href') or a.get('xlink:href')):self.uses.append(a.get('href') or a.get('xlink:href'))
  if tag=='a' and 'href' in a:self.links.append(a['href'])
  if tag in ['script','link']:
   u=a.get('src') or a.get('href')
   if u:self.links.append(u)
parsers={};errors=[]
for p in P.rglob('*.html'):
 if '.git' in p.parts or {'content','tools'}&set(p.relative_to(P).parts):continue
 h=HTML();h.feed(p.read_text());parsers[p.resolve()]=h
 duplicate=[k for k,v in collections.Counter(h.ids).items() if v>1]
 if duplicate:errors.append(f'{p.relative_to(P)} duplicate ids {duplicate}')
for p,h in parsers.items():
 for link in h.links:
  u=urlsplit(link)
  if u.scheme or u.netloc or not u.path and not u.fragment:continue
  dest=((P/u.path.lstrip('/')) if u.path.startswith('/') else p.parent/u.path) if u.path else p
  dest=dest.resolve()
  if dest.is_dir():dest=dest/'index.html'
  if not dest.exists():errors.append(f'{p.relative_to(P)} -> missing {link}')
  elif u.fragment and dest in parsers and unquote(u.fragment) not in parsers[dest].ids:errors.append(f'{p.relative_to(P)} -> missing anchor {link}')
d=json.loads((P/'content/course.json').read_text());r=json.loads((P/'content/readings88.json').read_text());t=json.loads((P/'content/tarot.json').read_text())
assert [l['id'] for l in d['lessons']]==list(range(1,46))
assert len({l['slug'] for l in d['lessons']})==45
for l in d['lessons']:
 assert len(l['quiz'])==3
 assert all(len(q['options'])==3 and q['answer'] in range(3) and q['why'] for q in l['quiz'])
 assert all(k in d['sources'] for k in l['sourceIds'])
# Course v3 (SPEC §2–§5): addressed feedback per option, a hint, the header and stage-4 fields, lab data per kind.
LAB_DATA={'sort':['instruction','shelves','items'],'timeline':['events'],'tree':['mode'],'worlds':['tasks'],'letters':['tasks'],'rose':['steps'],'luria':['mode'],'soul':[],'deck':['cards'],'hermit':['card','checklist'],'observe':['card'],'pair':['a','b'],'gematria':['example']}
def check_lab(kind,data,where):
 assert kind in LAB_DATA or kind in ('study','permutations','permutations-alef','river','balance'), f'{where}: unknown lab kind {kind}'
 for k in LAB_DATA.get(kind,[]):assert isinstance(data,dict) and data.get(k) not in (None,'',[]), f'{where}: labData.{k} missing for {kind}'
 if kind=='sort':assert 2<=len(data['shelves'])<=4 and all(0<=it['shelf']<len(data['shelves']) and it.get('text') and it.get('hint') and it.get('explain') for it in data['items']), where
 if kind=='timeline':assert 4<=len(data['events'])<=6 and all(e.get('what') for e in data['events']), where
 if kind=='deck':assert len(data['cards'])==12 and all(c['card'] in {x['id'] for x in t['cards']} and c['type'] in (0,1,2) for c in data['cards']), where
 if kind=='hermit':assert len(data['checklist'])==6 and sum(not x['present'] for x in data['checklist'])==2, where
 if kind=='pair':assert {data['a'],data['b']}<={x['id'] for x in t['cards']}, where
 if kind=='tree':assert data['mode'] in ('explore','find','place') and all(1<=len(x['answer'])<=2 and all(0<=n<=9 for n in x['answer']) for x in data.get('tasks',[])), where
V3=[l for l in d['lessons'] if l.get('quizVersion')==3]
for l in V3:
 w=f"lesson {l['id']}"
 for q in l['quiz']:
  assert isinstance(q.get('feedback'),list) and len(q['feedback'])==3 and all(isinstance(f,str) and f.strip() for f in q['feedback']), w+': feedback ×3'
  assert isinstance(q.get('hint'),str) and q['hint'].strip(), w+': hint'
  assert q.get('hintSection') is None or q['hintSection'] in range(len(l['sections'])), w+': hintSection'
 for k in ['aim','keyword','prompt','sample']:assert isinstance(l.get(k),str) and l[k].strip(), f'{w}: {k}'
 assert ' ' not in l['keyword'].strip(), w+': keyword is one word'
 assert l['module'] in range(len(d['modules'])), w+': module'
 assert not l.get('scaffold') or (isinstance(l['scaffold'],list) and 2<=len(l['scaffold'])<=4), w+': scaffold 2–4'
 check_lab(l['lab'],l.get('labData'),w)
 for x in l.get('extraLabs',[]):check_lab(x['lab'],x.get('labData') or {},w+' extra')
if V3:
 assert all(l.get('quizVersion')==3 for l in d['lessons']), 'mixed quiz versions'
 order=d.get('programOrder')
 assert isinstance(order,list) and sorted(order)==list(range(1,46)), 'programOrder must be a permutation of 1..45'
 if d.get('firstCircle'):
  fc=d['firstCircle']['items'];assert all(x['kind'] in ('intro','lesson','reading') for x in fc)
  assert all(x['ref'] in range(1,46) for x in fc if x['kind']=='lesson') and all(x['ref'] in range(1,89) for x in fc if x['kind']=='reading')
assert [x['id'] for x in r['readings']]==list(range(1,89))
assert len({(x['group'],x['paragraph']) for x in r['readings']})==88
assert all(sum(x['group']==g['id'] for x in r['readings'])==8 for g in r['groups'])
assert len(t['cards'])==78 and len({c['id'] for c in t['cards']})==78
assert {c['id'] for c in t['cards'] if c['group']=='major'}=={str(i) for i in range(22)}
for s in 'wcsp':assert {c['rank'] for c in t['cards'] if c['group']==s}==set(range(1,15))
import re
symbols={}
for p,h in parsers.items():
 for ref in h.uses:
  u=urlsplit(ref)
  if u.scheme or u.netloc:errors.append(f'{p.relative_to(P)} -> external <use> {ref}');continue
  dest=(((P/u.path.lstrip('/')) if u.path.startswith('/') else p.parent/u.path) if u.path else p).resolve()
  if not dest.exists():errors.append(f'{p.relative_to(P)} -> missing <use> file {ref}');continue
  if dest not in symbols:symbols[dest]=set(re.findall(r'<(?:symbol|svg|g|path)\b[^>]*\bid="([^"]+)"',dest.read_text()))|set(parsers[dest].ids if dest in parsers else [])
  if u.fragment and u.fragment not in symbols[dest]:errors.append(f'{p.relative_to(P)} -> missing symbol {ref}')
print('\n'.join(errors[:30]))
assert not errors, f'{len(errors)} link/HTML errors'
print(f'{len(parsers)} HTML files: internal links and anchors passed. 45 lessons, 135 questions, 88 readings, 78 cards verified.')
if V3:print(f'Course v3: {len(V3)} lessons with 3×3 addressed feedback and hints, program order a permutation of 1..45, lab data valid per kind.')


full=json.loads((P/'content/readings888.json').read_text())
assert [x['id'] for x in full['readings']]==list(range(1,889))
assert len({x['quote'] for x in full['readings']})==888
source_ids={x['id'] for x in full['sources']};topic_ids={x['id'] for x in full['topics']}
assert len(source_ids)==13 and len(topic_ids)==12
assert all(x['sourceId'] in source_ids and set(x['topics'])<=topic_ids for x in full['readings'])
assert sum(x['kind']=='guided' for x in full['readings'])==88
for old,new in zip(r['readings'],full['readings']):
 assert all(old[k]==new[k] for k in old)
print('888 unique catalogue fragments, 13 sources, 12 topics and unchanged legacy readings verified.')

sy=json.loads((P/'content/yetzirah.json').read_text())
assert [l['id'] for l in sy['lessons']]==list(range(1,13))
assert len({l['slug'] for l in sy['lessons']})==12
assert all(l['quote'] and l['read'] and l['question'] and l['reflection'] and l['sample'] and l['returnTask'] for l in sy['lessons'])
for l in sy['lessons']:
 assert len(l['sections'])>=2 and sum(len(' '.join(s['text']).split()) for s in l['sections'])>=150
 assert len(l['quiz'])==2 and all(len(q['options'])==3 and q['answer'] in range(3) and q['why'] for q in l['quiz'])
 html=(P/'course/yetzirah'/l['slug']/'index.html').read_text()
 assert all('id="'+a+'"' in html for a in ['before','reading','practice','check','reflection','sources'])
 assert 'data-sy-field="before"' in html and 'data-sy-field="note"' in html and 'data-sy-done' in html
 assert 'yetzirah.css' in html and 'yetzirah-state.js' in html and 'yetzirah.js' in html
assert len(sy['comparisons'])==7 and len({x['letter'] for x in sy['comparisons']})==7
assert len(sy['months'])==12 and len({x['month'] for x in sy['months']})==12
assert sy['comparisons'][0]['Tplanet']=='Сатурн' and sy['comparisons'][0]['Gplanet']=='Луна'
sitemap=(P/'sitemap.xml').read_text()
assert '/course/yetzirah/notebook/' not in sitemap
assert all('/course/yetzirah/'+l['slug']+'/' in sitemap for l in sy['lessons'])
print('Yetzirah: 12 complete lessons, 24 questions, 7 comparison rows, 12 months, notes, sources and public routes verified.')

for book in ['tomer-devorah','bahir']:
 mod=json.loads((P/'content'/(book+'.json')).read_text())
 assert [l['id'] for l in mod['lessons']]==list(range(1,13))
 assert len({l['slug'] for l in mod['lessons']})==12
 assert len({l['reflection'] for l in mod['lessons']})==12
 for l in mod['lessons']:
  assert len(l['sections'])>=2 and sum(len(' '.join(s['text']).split()) for s in l['sections'])>=150
  assert len(l['quiz'])==2 and all(len(q['options'])==3 and q['answer'] in range(3) and q['why'] for q in l['quiz'])
  assert l['quote']['ref']==l['refs'][0]['ref'] and l['quote']['he'] and l['quote']['ru']
  assert l['refs'] and all(r['url'].startswith('https://www.sefaria.org/') for r in l['refs'])
  html=(P/'course'/book/l['slug']/'index.html').read_text()
  assert all('id="'+a+'"' in html for a in ['before','reading','practice','check','reflection','sources'])
  assert all('data-book-field="'+a+'"' in html for a in ['before','working','note'])
  assert 'book-state.js' in html and 'book-modules.js' in html and 'book-modules.css' in html
  assert '/course/'+book+'/'+l['slug']+'/' in sitemap
  assert all(q in html for q in ['Рабочий перевод строки','учебный пересказ','data-book-done'])
 assert '/course/'+book+'/notebook/' not in sitemap
 assert 'noindex,follow' in (P/'course'/book/'notebook/index.html').read_text()
print('Book modules: 24 lessons, 48 questions, three note fields, independent routes, sources and private notebooks verified.')

# The book laboratory must not trigger the existing general gematria initializer.
gem=(P/'course/bahir/letters-and-number/index.html').read_text()
assert 'data-book-gematria' in gem and ' data-gematria>' not in gem

# Design layer: self-hosted cards and fonts, emblems, deck page, offline mode (tools/design.py).
out=[q for q in P.rglob('*') if q.is_file() and q.suffix in ('.html','.css','.js','.json','.xml','.webmanifest','.svg') and not {'.git','tools','tests'}&set(q.relative_to(P).parts)]
wm=[str(q.relative_to(P)) for q in out if 'thumb.wikimedia.org' in q.read_text(errors='ignore')]
assert not wm, f'Wikimedia thumbnails still referenced: {wm[:10]}'
fonts=[str(q.relative_to(P)) for q in out if 'data:font' in q.read_text(errors='ignore')]
assert not fonts, f'embedded fonts (data:font) in {fonts[:10]}'
for c in t['cards']:
 slug={'major':'major','w':'wands','c':'cups','s':'swords','p':'pentacles'}[c['group']]+'-%02d'%c['rank']
 assert c['image']=='/assets/tarot/'+slug+'-240.webp', c['id']
 assert c['imageSource'].startswith('https://commons.wikimedia.org/wiki/File:'), c['id']
 for w in (240,480,960):assert (P/'assets/tarot'/f'{slug}-{w}.webp').exists(), f'{slug}-{w}.webp'
tv=(P/'assets/course/tarot-view.js').read_text()
assert '/*__CARDS_JSON__*/' not in tv and tv.count('"slug":')==78
html_out=[q for q in out if q.suffix=='.html' and q.relative_to(P).parts[0]!='content']
assert (P/'sw.js').exists() and all('sw-register.js' in q.read_text() for q in html_out), 'offline mode is not wired on every page'
assert 'data:image/jpeg;base64' not in (P/'index.html').read_text(), 'landing still embeds the hero image'
assert '/course/tarot/deck/' in sitemap and len(re.findall('class="deck-card"',(P/'course/tarot/deck/index.html').read_text()))==78
course_css=(P/'assets/course/course.css').read_text()
assert all('/* === upgrade: '+f.name+' === */' in course_css for f in (P/'assets/course/design').glob('*.css'))
print(f'Design: {len(html_out)} pages with offline mode, 78 cards × 3 sizes, no Wikimedia thumbnails or embedded fonts, images and emblem symbols resolve.')
