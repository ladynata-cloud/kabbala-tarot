(function(){
 'use strict';
 const source=document.getElementById('spread-grammar-data');if(!source||!window.MixedReading||!window.SpreadGrammarAtlas)return;
 const data=JSON.parse(source.textContent);if(!data.mixedReading)return;
 const atlas=window.SpreadGrammarAtlas,M=window.MixedReading.create(atlas.cards,atlas.method,data.paths),$=id=>document.getElementById(id);
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const names=rows=>rows.map(c=>c.name+' · '+c.world).join('; ');
 function render({config,covered}){
  if(!$('mr-diagnostics'))return;const visible=config.ids.filter(id=>!covered||id!==config.focus),info=M.inspect(visible);
  $('mr-counts').textContent='Состав: числовые — '+info.counts.number+'; придворные — '+info.counts.court+'; Старшие — '+info.counts.major+'. Количество не устанавливает важность или силу карты.';
  $('mr-families').replaceChildren(...info.rows.map(c=>{const i=config.ids.indexOf(c.id),tr=el('tr'),th=el('th',(i+1)+'. '+c.name+(config.reversed[i]?' · перевёрнута':''));th.scope='row';tr.append(th,el('td',c.kindName),el('td',c.correspondence),el('td',config.roles[i]));return tr;}));
  $('mr-repeats').replaceChildren(...info.repeats.map(row=>el('p',row.rank+' · '+row.sefira+': '+names(row.cards)+'. Что меняется вместе с мастью при сохранении ранга?')));
  if(!info.repeats.length)$('mr-repeats').append(el('p','Повторяющихся числовых рангов в рассматриваемой части нет.'));
  $('mr-path-links').replaceChildren(...info.links.map(row=>{const box=el('article',undefined,'mr-path-link'),a=el('a',row.card.name+' · открыть путь '+row.card.path.number);a.href='/course/pathways/#path-'+row.card.path.number;box.append(el('h4',row.card.correspondence),a);
   for(const end of row.endpoints)box.append(el('p',end.rank+' · '+end.sefira+': '+(end.cards.length?names(end.cards):'нет числовой карты этого ранга в рассматриваемой части')+'.'));
   const present=row.endpoints.filter(e=>e.cards.length).length;box.append(el('p',present===2?'Числовые соответствия обоих концов представлены. Объясните, какое отношение между их темами важно в Вашем вопросе.':present===1?'Представлено числовое соответствие одного конца. Другой конец остаётся справочной темой пути; дополнительную карту из этого автоматически не выводим.':'Концы пути не представлены числовыми картами. Аркан можно читать через изображение и вопрос позиции; формального совпадения для этого не требуется.','mr-help'));return box;}));
  if(!info.links.length)$('mr-path-links').append(el('p','В рассматриваемой части нет Старших арканов.'));
 }
 window.MixedReadingUI={render};
})();
