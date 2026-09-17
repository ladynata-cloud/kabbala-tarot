"""Source classification exercises and visible card evidence for close reading."""
from html import escape as E


def interactive(lab):
    out = '<fieldset disabled data-book-enhanced data-evidence><legend>На чём основано утверждение?</legend>'
    for i, item in enumerate(lab['items']):
        out += f'<div class="book-evidence-item"><label for="evidence-{i}">{E(item["statement"])}</label>'
        out += f'<select id="evidence-{i}" data-evidence-answer="{i}" aria-describedby="evidence-feedback-{i}"><option value="">Выберите основание…</option>'
        out += ''.join('<option>'+E(c)+'</option>' for c in lab['categories'])
        out += f'</select><p id="evidence-feedback-{i}" role="status"></p></div>'
    out += '<button type="button" class="button" disabled data-book-enhanced data-evidence-check>Проверить основания</button><p data-evidence-result role="status"></p></fieldset>'
    out += '<details class="sy-solution"><summary>Все основания с пояснениями</summary><ol>'
    out += ''.join('<li><p>'+E(i['statement'])+'</p><p><strong>'+E(i['answer'])+'.</strong> '+E(i['feedback'])+'</p></li>' for i in lab['items'])
    return out+'</ol></details>'


def observations(lesson, cards):
    if not lesson.get('cards'):
        return ''
    out = '<section class="book-observation"><h2>Посмотрите на изображения</h2><p>Прежде чем читать объяснение, назовите две детали каждой карты. Нажмите на изображение, чтобы открыть оригинал.</p><div class="book-observation-grid">'
    for cid in lesson['cards']:
        c = cards[cid]
        out += '<figure><a href="'+E(c['imageSource'],quote=True)+'" target="_blank" rel="noopener noreferrer"><img loading="lazy" width="180" height="310" src="'+E(c['image'],quote=True)+'" alt="'+E(c['name']+'. '+c['scene'],quote=True)+'"></a>'
        out += '<figcaption><strong>'+E(c['name'])+'</strong><p>'+E(c['scene'])+'</p><a href="'+E(c['imageSource'],quote=True)+'" target="_blank" rel="noopener noreferrer">Изображение и сведения об источнике →</a></figcaption></figure>'
    return out+'</div><p class="fine">Памела Колман Смит, колода Уэйта–Смит. Репродукции — Wikimedia Commons; описания деталей остаются доступными, если изображения не загрузились.</p></section>'
