(function(){
 'use strict';
 const source=document.getElementById('spread-grammar-data');if(!source||!window.ReversalStudy||!window.SpreadGrammarAtlas)return;
 const data=JSON.parse(source.textContent);if(!data.reversalStudy)return;
 const R=window.ReversalStudy,model=R.create(window.SpreadGrammarAtlas.cards,window.SpreadGrammarAtlas.method),$=id=>document.getElementById(id);
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 let config,change,covered=false;
 function apply(value){if(change)change(R.apply(config,value));}
 if($('rv-pattern')){
  $('rv-pattern').addEventListener('change',()=>apply(Number($('rv-pattern').value)));
  $('rv-target').addEventListener('change',()=>{if(change)change({...config,focus:$('rv-target').value});});
  $('rv-upright').addEventListener('click',()=>apply(0));
  $('rv-flip').addEventListener('click',()=>{if(change&&!covered)change(R.flip(config,config.focus));});
  $('rv-previous').addEventListener('click',()=>apply(R.mask(config.reversed)-1));
  $('rv-next').addEventListener('click',()=>apply(R.mask(config.reversed)+1));
 }
 function render(input){
  if(!$('rv-panel'))return;config=input.config;change=input.change;covered=input.covered;
  const current=R.mask(config.reversed),total=R.count(config.ids.length);
  $('rv-count').textContent=config.ids.length+' карт · '+total+' вариантов ориентации при фиксированном порядке. Это варианты изображения; объяснение каждого Вы составляете самостоятельно.';
  $('rv-pattern').replaceChildren(...R.patterns(config.ids.length).map(p=>{const n=el('option',(p.value+1)+'. '+p.label);n.value=String(p.value);return n;}));$('rv-pattern').value=String(current);
  $('rv-previous').disabled=current===0;$('rv-next').disabled=current===total-1;$('rv-upright').disabled=current===0;$('rv-flip').disabled=covered;
  $('rv-order').textContent='Порядок позиций: '+config.ids.map((id,i)=>(i+1)+'. '+(covered&&id===config.focus?'временно исключена':model.describe(id).name)).join(' → ');
  $('rv-target').replaceChildren(...config.ids.map((id,i)=>{const n=el('option',(i+1)+'. '+model.describe(id).name);n.value=id;return n;}));$('rv-target').value=config.focus;
  const card=model.describe(config.focus),i=config.ids.indexOf(config.focus);
  $('rv-focus-title').textContent=covered?'Выбранная карта временно исключена':card.name+' · '+(config.reversed[i]?'перевёрнута':'прямо');
  $('rv-role').textContent=covered?'Верните карту, чтобы сравнить гипотезы.':'Вопрос позиции: '+config.roles[i]+'. Тема карты: '+card.principle+'.';
  $('rv-hypotheses').replaceChildren();$('rv-reference').replaceChildren();$('rv-compare').hidden=covered;
  if(!covered){
   for(const h of card.hypotheses){const row=el('tr'),th=el('th',h.title);th.scope='row';row.append(th,el('td',h.text),el('td',h.question));$('rv-hypotheses').append(row);}
   for(const [name,value] of card.rows)$('rv-reference').append(el('p',name+': '+value));
  }
 }
 window.ReversalStudyUI={render};
})();
