"""Publish a bounded public practice catalogue from the course's editorial records."""
import json
import os
import re
from urllib.parse import urlsplit
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTE = '/course/symbols-assistant/'
ORIGIN = json.loads((ROOT / 'content/site.json').read_text())['origin'].rstrip('/')


def load(name):
    return json.loads((ROOT / 'content' / (name + '.json')).read_text(encoding='utf-8'))


def source(item, role):
    return {'label': item['title'], 'url': item['url'], 'role': role}


BOOK_ALIASES = {
    'pictorial-key': ['Уэйт', 'Уэйта', 'Уэйт–Смит', 'иллюстрированный ключ'],
    'book-of-thoth': ['Кроули', 'Тот', 'Тота', 'колода Тота', 'Алистер Кроули'],
    'book-t': ['Golden Dawn', 'Золотая Заря', 'Золотой Зари', 'Книга Т', 'Liber LXXVIII'],
    'tarot-bohemians': ['Папюс', 'Папюса'], 'mystical-qabalah': ['Форчун', 'Дион Форчун'],
    'mathers-tarot': ['Мазерс', 'Мазерса'], 'kabbalah-unveiled': ['Мазерс', 'Мазерса'],
    'levi-dogma-ritual': ['Элифас Леви'],
}
PRACTICES = {
    'spread-grammar': ['позиция расклада', 'грамматика расклада'],
    'tree-reading': ['дерево жизни', 'древо жизни', 'сефирот', 'источник и аналогия'],
    'reversal-study': ['перевёрнутая карта', 'перевёрнутые карты', 'перевертыши'],
    'mixed-reading': ['смешанный расклад', 'свет и сосуд'],
    'spread-workshop': ['как составить расклад', 'свой расклад', 'вопрос к раскладу', 'четыре мира'],
}


def records():
    out = []
    for card in load('tarot')['cards']:
        out.append(dict(id='rws-' + card['id'], kind='card', title=card['name'],
                        url=ORIGIN + '/course/tarot/#card-' + card['id'],
                        tradition='Колода Райдера–Уэйта–Смит, 1909.',
                        scope='Одна карта в колоде Уэйта–Смит.',
                        observation=card['scene'], commentary=card['reading'], question=card['question'],
                        sources=[dict(label='Иллюстрация Памелы Колман Смит', url=card['imageSource'], role='image'),
                                 dict(label=('Артур Эдвард Уэйт. The Pictorial Key to the Tarot' +
                                             (' · оглавление' if 'index.htm' in card['source'] else ' · текст о карте')),
                                      url=card['source'], role='book')],
                        terms=[card['name']]))
    for path in sorted((ROOT/'content').glob('*.json')):
        doc = json.loads(path.read_text())
        if not isinstance(doc, dict) or 'book' not in doc:
            continue
        name = doc['book']
        tradition = ('Западная эзотерическая традиция. ' if name in BOOK_ALIASES else 'Еврейская каббалистическая традиция. ')
        out.append(dict(id='study-' + name, kind='study', title=doc['title'], url=ORIGIN+'/course/'+name+'/',
                        tradition=tradition + doc['subtitle'], scope=doc['scope'], observation=doc['subtitle'],
                        commentary=doc['lead'], question=doc['lessons'][0]['question'],
                        sources=[source(doc['source'], 'edition')], terms=[doc['title'], *BOOK_ALIASES.get(name, [])]))
    sy = load('yetzirah')
    out.append(dict(id='study-yetzirah', kind='study', title='Сефер Йецира', url=ORIGIN+'/course/yetzirah/',
                    tradition='Еврейская традиция. При сравнении «Сефер Йецира» различайте редакцию и перевод.',
                    scope='Занятия по избранным фрагментам и сравнение редакций в курсе.',
                    observation=sy['lessons'][0]['title'], commentary=sy['lessons'][0]['aim'],
                    question=sy['lessons'][0]['reflection'], sources=[source(sy['sources']['G'], 'edition')],
                    terms=['Сефер Йецира', 'Книга Созидания', 'Сефер Ецира']))
    z = load('readings888')
    rose = next(r for r in z['readings'] if r['group'] == 'rose')
    edition = next(r for r in z['sources'] if r['id'] == rose['sourceId'])
    out.append(dict(id='study-zohar-rose', kind='study', title='Роза в предисловии Зоара', url=ORIGIN+rose['href'],
                    tradition='Еврейская каббалистическая традиция. Читаем указанный в курсе русский перевод.',
                    scope=f'{edition["title"]}, параграф {rose["paragraph"]}, страница {rose["page"]} указанного PDF.',
                    observation=rose['title'], commentary=rose['explanation'], question=rose['question'],
                    sources=[source(edition, 'edition')], terms=['Зоар', 'роза', 'роза в Зоаре']))
    for name, aliases in PRACTICES.items():
        doc = load(name)
        lesson = doc['lessons'][0]
        if name == 'spread-workshop':
            refs = [lesson['source']]
            commentary = lesson['source']['application']
            question = lesson['transfer']
        else:
            refs = [doc['sources'][key] for key in lesson['refs']]
            commentary = doc['lead']
            question = lesson['reflection']
        out.append(dict(id='practice-'+name, kind='practice', title=doc['title'], terms=[doc['title'], *aliases],
                        tradition='Авторская учебная практика курса. Авторы и издания перечислены в источниках.',
                        scope=lesson['title'], observation=lesson['aim'], commentary=commentary, question=question,
                        url=ORIGIN+'/course/'+name+'/'+lesson['slug']+'/',
                        sources=[source(s, 'lesson_reference') for s in refs]))
    return out


def transport_script():
    base = os.environ.get('SITE_ASSISTANT_ORIGIN', '').strip()
    if not base:
        return ''
    u = urlsplit(base)
    if (not u.hostname or u.scheme not in ('https', 'http') or u.username is not None
            or u.password is not None or u.query or u.fragment or u.path not in ('', '/')
            or not re.fullmatch(r'(?:[A-Za-z0-9.-]+|\[[0-9A-Fa-f:]+\])(?::[0-9]+)?', u.netloc)
            or (u.scheme == 'http' and u.hostname not in ('localhost', '127.0.0.1', '::1'))):
        raise ValueError('SITE_ASSISTANT_ORIGIN must be an HTTPS origin or local HTTP origin')
    _ = u.port
    return f'<script data-symbols-transport async defer src="{escape(base.rstrip("/"), quote=True)}/client.js"></script>'


def build(page, crumbs):
    entries = records()
    dest = ROOT / 'assistant/v1/symbols.json'
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps({'version': 1, 'site': 'tarot', 'records': entries}, ensure_ascii=False,
                               separators=(',', ':')) + '\n', encoding='utf-8')
    sections = [('card', 'Карты Уэйта–Смит'), ('study', 'Книги и традиции'), ('practice', 'Упражнения курса')]
    groups = ''.join('<optgroup label="' + title + '">' + ''.join(
        f'<option value="{e["id"]}">{escape(e["title"])}</option>' for e in entries if e['kind'] == kind
    ) + '</optgroup>' for kind, title in sections)
    body = crumbs('../../', 'Помощник по книгам и картам') + f'''<header class="hero-small"><h1>Помощник по книгам и картам</h1>
<p class="lead">Выберите карту, книгу или практику. Можно рассмотреть деталь, сверить её с источником и подобрать вопрос для себя.</p></header>
<section class="section" aria-labelledby="symbols-start"><h2 id="symbols-start">С чего начнём?</h2>
<p><a href="../tarot/#card-9">Рассмотреть Отшельника</a> · <a href="../book-of-thoth/">Открыть «Книгу Тота»</a> · <a href="../reading/rose/">Прочитать о розе в Зоаре</a></p>
<p id="symbols-status" role="status"></p><form id="symbols-form" hidden>
<label for="symbols-topic">Карта или тема</label> <select id="symbols-topic"><option value="">Найти по вопросу</option>{groups}</select>
<p><label for="symbols-query">Ваш вопрос</label><input class="search" id="symbols-query" maxlength="400" placeholder="Например, что видно на карте Отшельник?"></p>
<p id="symbols-server-choice" hidden><label><input type="checkbox" id="symbols-server"> Отправлять набранные здесь вопросы общему серверу помощников</label></p>
<div class="actions"><button class="button" type="submit">Спросить</button><button class="button secondary" type="reset">Начать заново</button></div></form>
<div id="symbols-log" role="log" aria-live="polite" aria-label="Ваш разговор"></div>
<div id="symbols-aspects" class="actions" hidden><button class="button secondary" data-aspect="observation">Что можно заметить?</button>
<button class="button secondary" data-aspect="source">Где источник?</button><button class="button secondary" data-aspect="practice">Вопрос для себя</button>
<button class="button secondary" data-aspect="tradition">Какая это традиция?</button></div></section>
{transport_script()}<script defer src="../../assets/course/symbols-assistant.js"></script>'''
    page(ROUTE, 'Помощник по книгам и картам', 'Разговор о деталях карты, источниках и собственном наблюдении.', body)
