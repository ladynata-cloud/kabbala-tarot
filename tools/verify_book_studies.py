"""Validate published workshop content, answer keys, routes, and private notebooks."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
slugs=['shaarei-orah','mystical-qabalah','book-of-thoth','pardes-rimmonim','tanya','etz-chaim','book-t','daat-tevunot','tarot-bohemians','nefesh-hachaim','levi-dogma-ritual','shaarei-kedusha','pictorial-key']
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
  if slug in ('etz-chaim','book-t','daat-tevunot','tarot-bohemians','nefesh-hachaim','levi-dogma-ritual','shaarei-kedusha','pictorial-key'):
   assert len(l['sections'])>=3
   assert sum(len(t.split()) for section in l['sections'] for t in section['text'])>=230
   assert len(l['pedagogy']['worked']['steps'])==3 and len(l['pedagogy']['hints'])==2
   assert len(l['pedagogy']['rubric'])==3
  assert len(l['quiz'])==2
  for q in l['quiz']:
   assert len(q['options'])==3 and len(set(q['options']))==3 and q['answer'] in range(3) and q['why']
   answers.append(q['answer'])
  k=l['lab'];types.add(k['type']);assert k['task'] and k['solution']
  if k['type']=='argument':
   assert len(k['stages'])==3
   for stage in k['stages']:
    assert len(stage['options'])==3 and sum(o['correct'] for o in stage['options'])==1
    assert all(o['feedback'] for o in stage['options'])
  if slug in ('daat-tevunot','tarot-bohemians','nefesh-hachaim','levi-dogma-ritual','shaarei-kedusha','pictorial-key'):
   assert l['pedagogy']['fade']==('model' if l['id']<=2 else 'complete' if l['id']<=5 else 'independent')
  if k['type']=='evidence':
   assert len(k['items'])==4 and len(k['categories'])>=3
   assert len(set(k['categories']))==len(k['categories'])
   assert all(i['answer'] in k['categories'] and i['feedback'] for i in k['items'])
  if slug in ('shaarei-kedusha','pictorial-key'):
   assert all(l['closeReading'][key] for key in ('original','translation','focus','lang','ref'))
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
assert types=={'layers','match','order','case','criteria','kav','fives','dignities','argument','arithmetic','frames','comparison','levi-matrix','evidence'}
print(f'Book studies: {len(slugs)} modules, {len(slugs)*8} lessons, {len(answers)} answer keys, {len(types)} exercise formats and private notebooks verified.')
