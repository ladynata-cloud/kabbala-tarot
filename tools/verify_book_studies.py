"""Validate published workshop content, answer keys, routes, and private notebooks."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
slugs=['shaarei-orah','mystical-qabalah','book-of-thoth']
sitemap=(ROOT/'sitemap.xml').read_text()
types=set();answers=[]
for slug in slugs:
 d=json.loads((ROOT/'content'/(slug+'.json')).read_text())
 assert d['book']==slug and len(d['lessons'])==8
 assert [l['id'] for l in d['lessons']]==list(range(1,9))
 assert len({l['slug'] for l in d['lessons']})==8
 for l in d['lessons']:
  assert l['refs'] and all(r['url'].startswith('https://') for r in l['refs'])
  assert len(l['sections'])>=2 and sum(len(t.split()) for s in l['sections'] for t in s['text'])>=130
  assert len(l['quiz'])==2
  for q in l['quiz']:
   assert len(q['options'])==3 and len(set(q['options']))==3 and q['answer'] in range(3) and q['why']
   answers.append(q['answer'])
  k=l['lab'];types.add(k['type']);assert k['task'] and k['solution']
  if k['type']=='match':
   for row in k['items']:assert row['options'].count(row['answer'])==1
  route=f'/course/{slug}/{l["slug"]}/'
  html=(ROOT/route.strip('/')/'index.html').read_text()
  assert route in sitemap and 'book-module-data' in html and 'study-state.js' in html
  assert 'После занятия Вы сможете' in html and 'noindex,follow' not in html
  assert all('id="'+x+'"' in html for x in ['before','reading','practice','check','reflection','sources'])
 nb=f'/course/{slug}/notebook/'
 assert nb not in sitemap and 'noindex,follow' in (ROOT/nb.strip('/')/'index.html').read_text()
assert set(answers)=={0,1,2}
assert types=={'layers','match','order','case','criteria'}
print('Book studies: 3 modules, 24 complete lessons, 48 answer keys, 5 exercise formats, 3 private notebooks verified.')
