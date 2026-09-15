"""Generate a compact, complete triple analysis tool and readable authored examples."""
from pathlib import Path
from html import escape as E
import json

ROOT = Path(__file__).resolve().parents[1]

def build(page, crumbs):
    cards = json.loads((ROOT/'content/tarot.json').read_text())['cards']
    method = json.loads((ROOT/'content/tarot-pairs.json').read_text())
    data = json.loads((ROOT/'content/tarot-triples.json').read_text())
    ids = {c['id'] for c in cards}
    assert len(cards) == len(ids) == 78
    assert ids == set(data['cardRoles']) == set(method['profiles'])
    assert set(data['cardRoles'].values()) <= set(data['thirdRoles'])
    assert len(data['examples']) == 12
    for ex in data['examples']:
        assert len(set(ex['cards'])) == 3 and set(ex['cards']) <= ids
    by_id = {c['id']:c for c in cards}
    def options(selected):
        return ''.join('<optgroup label="'+name+'">'+''.join('<option value="'+c['id']+'"'+(' selected' if c['id']==selected else '')+'>'+E(c['name'])+'</option>' for c in cards if c['group']==group)+'</optgroup>' for group,name in [('major','Старшие арканы'),('w','Жезлы'),('c','Кубки'),('s','Мечи'),('p','Пентакли')])
    selectors = ''
    for i,letter in enumerate('АБВ'):
        selectors += '<fieldset><legend>Карта '+letter+'</legend><label class="sr-only" for="triple-card-'+str(i)+'">Выберите карту '+letter+'</label><select id="triple-card-'+str(i)+'">'+options(['p4','p5','p6'][i])+'</select><label class="triple-orientation" hidden>Положение<select id="triple-rev-'+str(i)+'"><option value="0">Прямое</option><option value="1">Перевёрнутое</option></select></label></fieldset>'
    body=(ROOT/'content/tarot-triples.html').read_text().replace('{{SELECTORS}}',selectors)
    body=body.replace('{{EXAMPLE_BUTTONS}}',''.join('<button type="button" data-triple-example="'+str(i)+'">'+E(ex['title'])+'</button>' for i,ex in enumerate(data['examples'])))
    examples=''
    for ex in data['examples']:
        examples+='<article><h3>'+E(ex['title'])+'</h3><p>'+E(' → '.join(by_id[id]['name'] for id in ex['cards']))+'</p><p>'+E(ex['question'])+'</p>'
        for key,label in [('before','До третьей карты'),('after','Что меняется'),('reading','Возможное прочтение'),('basis','Основание'),('alternative','Альтернатива')]:
            examples+='<p><strong>'+label+'.</strong> '+E(ex[key])+'</p>'
        examples+='</article>'
    body=body.replace('{{STATIC_EXAMPLES}}',examples)
    payload=json.dumps({'cards':cards,'method':method,'triples':data},ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    body=crumbs('../../','Тройки Таро')+body+'<script id="tarot-triples-data" type="application/json">'+payload+'</script>'
    page('/course/tarot-triples/','Все тройки Таро — каббалистический разбор и конструктор','76 076 троек и 456 456 последовательностей: каббалистические соответствия, влияние третьей карты, шесть порядков и тетрадь своих толкований.',body)
