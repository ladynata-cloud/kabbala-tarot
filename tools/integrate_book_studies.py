"""Idempotently connect the three additional book workshops to the course builder."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'tools/build_course.py'
s=p.read_text()
if 'import build_book_studies as book_studies' not in s:
 s=s.replace('import build_yetzirah as yetzirah','import build_yetzirah as yetzirah\nimport build_book_studies as book_studies')
 marker=" out=ROOT/path.strip('/')/'index.html'"
 assert marker in s
 s=s.replace(marker,""" if path.startswith(('/course/shaarei-orah/','/course/mystical-qabalah/','/course/book-of-thoth/','/course/book-studies/')):
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/course/yetzirah.css"><link rel="stylesheet" href="{prefix}assets/course/book-studies.css"></head>')
  if path!='/course/book-studies/':html=html.replace('</body>',f'<script defer src="{prefix}assets/course/study-state.js"></script><script defer src="{prefix}assets/course/book-studies.js"></script></body>')
"""+marker)
 s=s.replace('yetzirah.build(page,crumbs)','yetzirah.build(page,crumbs)\nbook_studies.build(page,crumbs)')
 card='<section class="books-start" id="new-book-studies"><div><p class="eyebrow">Три книги · 24 занятия</p><h2>От имён и сефирот к языку Таро</h2><p>«Шаарей Ора» Йосефа Гикатилы, «Мистическая Каббала» Дион Форчун и «Книга Тота» Алистера Кроули. Подробные пояснения, сравнение систем, 48 вопросов и три личные тетради.</p><p><a href="/course/shaarei-orah/">Врата света →</a> · <a href="/course/mystical-qabalah/">Мистическая Каббала →</a> · <a href="/course/book-of-thoth/">Книга Тота →</a></p></div><a class="button" href="/course/book-studies/">Выбрать книгу →</a></section>'
 for marker in ["page('/course/books/',","page('/course/','Курс каббалы"]:
  assert marker in s
  s=s.replace(marker,'body+='+repr(card)+'\n'+marker,1)
 marker="page('/course/notebook/',"
 note='<section class="section"><h2>Тетради новых книг</h2><p>В каждой сохраняются первый вопрос, работа с текстом и итоговый комментарий. Можно скачать JSON для переноса или текст для чтения.</p><p><a href="/course/shaarei-orah/notebook/">Врата света →</a> · <a href="/course/mystical-qabalah/notebook/">Мистическая Каббала →</a> · <a href="/course/book-of-thoth/notebook/">Книга Тота →</a></p></section>'
 assert marker in s
 s=s.replace(marker,'body+='+repr(note)+'\n'+marker,1)
 marker='<div class="signature">Элиора Вейра<span>Автор проекта</span></div>'
 assert marker in s
 s=s.replace(marker,'<p><a href="course/book-studies/">Новые модули: Гикатила, Форчун и Кроули →</a></p>'+marker,1)
 p.write_text(s)
p=ROOT/'tools/build_expansion.py';s=p.read_text()
if 'id="tarot-book-studies"' not in s:
 marker=" page('/course/tarot/',"
 assert marker in s
 card='<section class="section" id="tarot-book-studies"><h2>Разбираем книги о каббалистическом Таро</h2><p>У Форчун учимся читать Древо и различать сефирот, пути и масти. У Кроули разбираем устройство Тота, сравниваем соответствия и пишем собственный комментарий к трём картам.</p><p><a href="/course/mystical-qabalah/">Мистическая Каббала →</a> · <a href="/course/book-of-thoth/">Книга Тота →</a> · <a href="/course/book-studies/">Все три новых модуля →</a></p></section>'
 s=s.replace(marker,' b+='+repr(card)+'\n'+marker,1);p.write_text(s)
print('Book studies connected to course, books, Tarot, and notebook.')
