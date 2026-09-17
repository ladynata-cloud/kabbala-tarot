"""Close reading and two source-specific comparison tools."""
from html import escape as E
SEFIROT=['Кетер','Хохма','Бина','Хесед','Гвура','Тиферет','Нецах','Ход','Йесод','Малхут']
SUITS=[('wands','Жезлы','Йод'),('cups','Кубки','первого Хе'),('swords','Мечи','Вав'),('pentacles','Круги / Пентакли','заключительного Хе')]
def close(l):
 c=l.get('closeReading')
 if not c:return ''
 r=c['ref'];direction='rtl' if c['lang']=='he' else 'ltr'
 return '<section class="book-close"><p class="eyebrow">Вглядываемся в слова</p><h2>Короткий фрагмент</h2><blockquote lang="'+c['lang']+'" dir="'+direction+'">'+E(c['original'])+'</blockquote><p><strong>Наш перевод:</strong> '+E(c['translation'])+'</p><p class="fine"><a href="'+E(r['url'],quote=True)+'" target="_blank" rel="noopener noreferrer">'+E(r['label'])+' →</a></p><p><strong>Вопрос к формулировке:</strong> '+E(c['focus'])+'</p></section>'
def button(text,attr):return '<button type="button" class="button secondary" disabled data-book-enhanced '+attr+'>'+E(text)+'</button>'
def interactive(k):
 if k['type']=='comparison':
  return '<div class="close-controls"><label for="comparison-axis">По какому основанию сравниваем?</label><select id="comparison-axis" disabled data-book-enhanced>'+''.join('<option value="'+str(i)+'">'+E(a['label'])+'</option>' for i,a in enumerate(k['axes']))+'</select>'+button('Проверить вывод','data-comparison-check')+'</div><div class="sy-output" data-comparison-output role="status">Сначала сформулируйте ответ и основание.</div><details class="sy-solution"><summary>Три основания для самостоятельной сверки</summary>'+''.join('<h3>'+E(a['label'])+'</h3><p>'+E(a['verdict']+' '+a['reason']+' '+a['limit'])+'</p>' for a in k['axes'])+'</details>'
 if k['type']=='levi-matrix':
  return '<div class="close-controls"><label for="levi-number">Достоинство: туз — 10</label><select id="levi-number" disabled data-book-enhanced>'+''.join('<option value="'+str(i)+'"'+(' selected' if i==5 else '')+'>'+('Туз' if i==1 else str(i))+'</option>' for i in range(1,11))+'</select><label for="levi-suit">Масть в таблице Леви</label><select id="levi-suit" disabled data-book-enhanced>'+''.join('<option value="'+slug+'">'+E(name)+'</option>' for slug,name,_ in SUITS)+'</select>'+button('Проверить составную формулу','data-levi-check')+'</div><div class="sy-output" data-levi-output role="status">Предскажите сефиру числа и букву масти, затем проверьте.</div><details class="sy-solution"><summary>Соответствия для чтения без тренажёра</summary><p>Число: '+E('; '.join(str(i)+(' (туз)' if i==1 else '')+' — '+s for i,s in enumerate(SEFIROT,1)))+'.</p><p>Масть: '+E('; '.join(name+' — '+letter for _,name,letter in SUITS))+'.</p><p>Примеры с. 96: 5 Жезлов — справедливость творца или гнев человека; 7 Кубков — победа милости или торжество женщины; 8 Мечей — борьба или вечное равновесие. Это исторические формулировки Леви, а не характеристики конкретных людей.</p></details>'
 raise ValueError(k['type'])
