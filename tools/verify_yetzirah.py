"""Check the twelve quotations against a supplied UTF-8 transcription of T."""
from pathlib import Path
import json,re,sys,hashlib
ROOT=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2:raise SystemExit('Usage: python3 tools/verify_yetzirah.py /path/to/source.txt')
source=Path(sys.argv[1]).read_text(encoding='utf-8')
normalize=lambda x:re.sub(r'\s+',' ',x).strip()
text=normalize(source)
d=json.loads((ROOT/'content/yetzirah.json').read_text())
for l in d['lessons']:
 assert normalize(l['quote']) in text, f'Quote not found: lesson {l["id"]}'
print('12 short quotations match the supplied translation text after whitespace normalization.')
print('Source transcript SHA256:',hashlib.sha256(source.encode()).hexdigest())
print('Gra parallels are cited independently: 4:8–14, 4:16, 5:7; they are not translations of this source file.')
