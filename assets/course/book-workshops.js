'use strict';
(()=>{
 const node=document.querySelector('#book-module-data');if(!node)return;
 const d=JSON.parse(node.textContent),$=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
 const kav={none:'Без линии: свободная область обозначена, но способ поступления света к мирам не объяснён.',single:'Один связанный конец: поступление сохраняется, а выделенное начало позволяет различать верх и низ. Это условие выбранного аргумента автора.',double:'Два связанных конца: при одинаковом поступлении оба оказываются равноценными началами. Прежнее основание различать верх и низ исчезает; это контрпример самого текста.'};
 $$('[data-kav]').forEach(b=>b.addEventListener('click',()=>{
  const mode=b.dataset.kav;
  $$('[data-kav]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  $('[data-kav-line]').setAttribute('opacity',mode==='none'?'0':'1');
  $('[data-kav-bottom]').setAttribute('opacity',mode==='double'?'1':'0');
  $('[data-kav-output]').textContent=kav[mode];$('#kav-title').textContent='Модель связи: '+b.textContent;$('#kav-desc').textContent=kav[mode];
 }));
 $$('[data-five]').forEach(b=>b.addEventListener('click',()=>{
  $$('[data-five]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  const c=d.lab.cards[Number(b.dataset.five)],out=$('[data-five-output]');out.replaceChildren();
  for(const [tag,text] of [['h3',c.title],['p','Общее: пятёрка · Гвура.'],['p',c.pair+' · '+c.name],['p',c.image],['p',c.meaning]]){const el=document.createElement(tag);el.textContent=text;out.append(el);}
 }));
 const check=$('[data-dignity-check]'),out=$('[data-dignity-output]');
 if(check){check.addEventListener('click',()=>out.textContent=BookWorkshops.dignity('wands',$('[data-dignity-left]').value,$('[data-dignity-right]').value).text);
  $$('[data-dignity-left],[data-dignity-right]').forEach(s=>s.addEventListener('change',()=>out.textContent='Соседство изменено. Сначала предположите результат, затем нажмите «Разобрать соседство».'));
 }
})();
