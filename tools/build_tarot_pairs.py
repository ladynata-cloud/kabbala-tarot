"""Build the complete pair workshop from the shared 78-card atlas and authored data."""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parents[1]

def build(page, crumbs):
    cards = json.loads((ROOT / 'content/tarot.json').read_text())['cards']
    data = json.loads((ROOT / 'content/tarot-pairs.json').read_text())
    ids = [c['id'] for c in cards]
    assert len(ids) == len(set(ids)) == 78
    assert set(ids) == set(data['profiles'])
    assert len(data['majors']) == 22 and len(data['sefirot']) == 10
    assert all(len(p) == len(data['profileFields']) for p in data['profiles'].values())
    for example in data['examples']:
        assert example['a'] in ids and example['b'] in ids and example['a'] != example['b']
    def options(selected):
        groups = [('major','Старшие арканы'),('w','Жезлы'),('c','Кубки'),('s','Мечи'),('p','Пентакли')]
        return ''.join('<optgroup label="'+label+'">'+''.join('<option value="'+c['id']+'"'+(' selected' if c['id']==selected else '')+'>'+escape(c['name'])+'</option>' for c in cards if c['group']==g)+'</optgroup>' for g,label in groups)
    conditions = [('open','Пока не определено'),('balanced','Соразмерное проявление'),('lack','Недостаток'),('excess','Избыток'),('distortion','Искажение')]
    body = (ROOT / 'content/tarot-pairs.html').read_text()
    body = body.replace('{{OPTIONS_A}}',options('1')).replace('{{OPTIONS_B}}',options('p8'))
    body = body.replace('{{CONDITIONS}}',''.join('<option value="'+v+'">'+t+'</option>' for v,t in conditions))
    body = body.replace('{{EXAMPLE_BUTTONS}}',''.join('<button type="button" data-pair-example="'+str(i)+'">'+escape(ex['title'])+'</button>' for i,ex in enumerate(data['examples'])))
    by_id = {c['id']:c for c in cards}
    body = body.replace('{{STATIC_EXAMPLES}}',''.join('<article><h3>'+escape(ex['title'])+'</h3><p>'+escape(ex['question'])+'</p><p><strong>'+escape(by_id[ex['a']]['name']+' → '+by_id[ex['b']]['name'])+'.</strong> '+escape(ex['forward'])+'</p><p><strong>Обратный порядок.</strong> '+escape(ex['reverse'])+'</p><p>'+escape(ex['reason'])+'</p><p><strong>Проверьте себя.</strong> '+escape(ex['trap'])+'</p></article>' for ex in data['examples']))
    payload = json.dumps({'cards':cards,'method':data},ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    body = crumbs('../../','Конструктор пар Таро') + body + '<script id="tarot-pairs-data" type="application/json">'+payload+'</script>'
    page('/course/tarot-pairs/','Конструктор пар Таро — 3 003 пары и 6 006 последовательностей','Все пары Таро: каббалистические соответствия, порядок, перевёрнутые карты, пошаговое самостоятельное толкование и тетрадь.',body)
