"""Verify short quotes against the exact source PDFs. Usage: python tools/verify_readings.py PDF_DIRECTORY"""
from pathlib import Path
import json,hashlib,subprocess,re,sys
P=Path(__file__).resolve().parents[1];d=json.loads((P/'content/readings88.json').read_text());base=Path(sys.argv[1]);cache={}
norm=lambda s:re.sub(r'\s+',' ',s).strip()
for r in d['readings']:
 g=next(g for g in d['groups'] if g['id']==r['group']);p=base/g['file']
 if p not in cache:cache[p]=(hashlib.sha256(p.read_bytes()).hexdigest(),subprocess.check_output(['pdftotext','-layout',str(p),'-'],text=True).split('\f'))
 sha,pages=cache[p];assert sha==r['pdfSha256'],f'Source changed: {p.name}'
 text=norm(' '.join(pages[max(0,r['page']-1):r['page']+2]))
 assert norm(r['quote']) in text,f'Quote {r["id"]} does not match its PDF page'
print('88 quotations match the identified source PDFs and cited pages.')
