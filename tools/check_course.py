"""Check real content invariants and internal destinations, without network dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,collections
P=Path(__file__).resolve().parents[1]
class HTML(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.links=[];self.js=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='a' and 'href' in a:self.links.append(a['href'])
  if tag in ['script','link']:
   u=a.get('src') or a.get('href')
   if u:self.links.append(u)
parsers={};errors=[]
for p in P.rglob('*.html'):
 if '.git' in p.parts or 'content' in p.relative_to(P).parts:continue
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
assert [x['id'] for x in r['readings']]==list(range(1,89))
assert len({(x['group'],x['paragraph']) for x in r['readings']})==88
assert all(sum(x['group']==g['id'] for x in r['readings'])==8 for g in r['groups'])
assert len(t['cards'])==78 and len({c['id'] for c in t['cards']})==78
assert {c['id'] for c in t['cards'] if c['group']=='major'}=={str(i) for i in range(22)}
for s in 'wcsp':assert {c['rank'] for c in t['cards'] if c['group']==s}==set(range(1,15))
print('\n'.join(errors[:30]))
assert not errors, f'{len(errors)} link/HTML errors'
print(f'{len(parsers)} HTML files: internal links and anchors passed. 45 lessons, 135 questions, 88 readings, 78 cards verified.')


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
