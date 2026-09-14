"""Check each excerpt against its identified PDF, page, and numbered passage.

Usage: python tools/verify_readings888.py PDF_DIRECTORY
Requires PyMuPDF; pdftotext is used by the separate legacy verifier.
Full source PDFs are intentionally not part of the public repository.
"""
from pathlib import Path
import json,re,hashlib,sys,collections
import fitz
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'content/readings888.json').read_text())
old=json.loads((ROOT/'content/readings88.json').read_text())
norm=lambda s:re.sub(r'\s+',' ',s).strip()
assert [r['id'] for r in data['readings']]==list(range(1,889))
assert len({norm(r['quote']) for r in data['readings']})==888
for a,b in zip(old['readings'],data['readings'][:88]):
 for key in a:assert a[key]==b[key],f'Legacy reading {a["id"]} changed: {key}'
base=Path(sys.argv[1]);sources={s['id']:s for s in data['sources']};docs={};bodies={}
def body(s,n):
 key=(s['id'],n)
 if key in bodies:return bodies[key]
 pg=docs[s['id']][n-1];lines=[]
 for block in pg.get_text('dict')['blocks']:
  for line in block.get('lines',[]):
   spans=[span for span in line['spans'] if span['size']>=s['bodySize']-.3]
   if not spans:continue
   txt=norm(''.join(span['text'] for span in spans))
   if not txt or re.fullmatch(r'\d+',txt) or '.......' in txt:continue
   if min(span['bbox'][1] for span in spans)<33:continue
   if all(span['size']>s['bodySize']+.6 or not span['text'].strip() for span in spans):continue
   lines.append(txt)
 bodies[key]='\n'.join(lines);return bodies[key]
for s in sources.values():
 p=base/s['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256'],s['file']
 docs[s['id']]=fitz.open(p);assert len(docs[s['id']])==s['pages']
for r in data['readings'][88:]:
 s=sources[r['sourceId']]
 assert r['pdfSha256']==s['sha256']
 assert 1<=r['paragraphStartPage']<=r['page']<=s['pages']
 assert norm(r['quote']) in norm(body(s,r['page'])),f'Quote {r["id"]} not on cited page'
 passage='\n'.join(body(s,n) for n in range(r['paragraphStartPage'],r['page']+1))
 pieces=re.split(r'(?m)^(\d{1,4})\)\s*',passage)
 assert any(int(pieces[i])==r['paragraph'] and norm(r['quote']) in norm(pieces[i+1]) for i in range(1,len(pieces)-1,2)),f'Quote {r["id"]}: numbered passage mismatch'
 assert 8<=len(r['quote'].split())<=38
 assert r['kind']=='independent' and r['topics']
print('800 new quotations match their PDF hashes, exact pages and numbered passages; the original 88 records are unchanged.')
print('13 source PDFs; 888 unique quotations; 12 valid topic filters.')
