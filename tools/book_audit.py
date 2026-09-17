"""Source argument repair and explicit levels for written assessment."""
from html import escape as E


def interactive(lab):
    out = '<div class="book-audit" data-book-audit><h3>Проверьте ход мысли</h3><blockquote>' + E(lab['claim']) + '</blockquote>'
    for i, step in enumerate(lab['steps']):
        out += f'<fieldset disabled data-book-enhanced data-audit-step="{i}" aria-describedby="audit-feedback-{i}"><legend>{E(step["prompt"])}</legend>'
        for j, option in enumerate(step['options']):
            out += f'<label class="sy-option"><input type="radio" name="audit-{i}" value="{j}"><span>{E(option["text"])}</span></label>'
        out += f'<p id="audit-feedback-{i}" role="status"></p></fieldset>'
    out += '<button type="button" class="button" disabled data-book-enhanced data-audit-check>Проверить довод</button><p role="status" data-audit-result></p></div>'
    out += '<details class="sy-solution"><summary>Сверить все три решения и их основания</summary>'
    for step in lab['steps']:
        option = step['options'][step['answer']]
        out += '<h4>' + E(step['prompt']) + '</h4><p>' + E(option['text'] + '. ' + option['feedback']) + '</p>'
    return out + '</details>'


def assessment(lesson):
    data = lesson['assessment']
    out = '<section class="book-assessment"><h3>Оцените объяснение по признакам</h3><p>Оценивайте текст, который Вы написали, по каждому критерию отдельно. Найдите подтверждающую фразу. Если её нет, выберите уровень ниже и дополните ответ. Эти уровни не оценивают человека или его духовное состояние; открытый текст автоматически не проверяется.</p>'
    for criterion in data['criteria']:
        out += '<details><summary>' + E(criterion['criterion']) + '</summary><ol start="0">'
        out += ''.join('<li>' + E(text) + '</li>' for text in criterion['levels']) + '</ol></details>'
    out += '<p><strong>Редакция:</strong> в той же записи укажите уровни 0–2 по трём критериям, затем добавьте исправленное предложение и причину правки. Первую версию оставьте для сравнения.</p>'
    if data.get('anchors'):
        out += '<details class="book-anchor"><summary>Сравнить качество двух учебных ответов</summary>'
        for anchor in data['anchors']:
            out += '<blockquote>' + E(anchor['text']) + '</blockquote><p>' + E(anchor['comment']) + '</p>'
        out += '</details>'
    return out + '</section>'


def reading_guide(lesson):
    guide = lesson.get('readingGuide')
    if not guide:
        return ''
    out = '<section class="book-reading-guide"><h2>Три остановки в тексте</h2><p>Прочитайте короткий фрагмент выше. Для каждого вопроса сначала сформулируйте свою фразу, затем откройте ориентир. Можно записать ответы в черновике ниже. Если понадобилась опора, после объяснения закройте её и повторите ответ.</p><ol>'
    for item in guide:
        out += '<li><p>' + E(item['question']) + '</p><details><summary>Ориентир для сверки</summary><p>' + E(item['answer']) + '</p></details></li>'
    return out + '</ol></section>'
