(function(){
 'use strict';
 const source=document.getElementById('spread-grammar-data');if(!source||!window.SpreadDynamics||!window.SpreadGrammarAtlas)return;
 const data=JSON.parse(source.textContent);if(!data.spreadDynamics)return;
 const $=id=>document.getElementById(id),G=window.SpreadGrammar,M=window.SpreadDynamics.create(window.SpreadGrammarAtlas.cards,data.lessons,{title:data.title,layoutIds:data.layoutIds}),lesson=data.lessons.find(l=>l.id===data.current);
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 let getState,items=[],selectedA='',selectedB='';
 const time=at=>at?new Date(at).toLocaleString('ru-RU'):'не задано';
 function entries(){
  const state=getState();const list=[];
  if(lesson){list.push({id:'demo-a',label:'Учебный пример А',note:lesson.demoA,kind:'demo',returns:[]},{id:'demo-b',label:'Учебный пример Б',note:lesson.comparison.note,kind:'demo',returns:[]});}
  for(const s of [...state.snapshots].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)))list.push({id:'snapshot:'+s.id,label:'Снимок · занятие '+s.note.lesson+' · '+time(s.at),note:s.note,at:s.at,kind:'snapshot',returns:state.observations.filter(o=>o.snapshot===s.id)});
  if(state.note)list.push({id:'current',label:'Текущая запись · ещё не снимок',note:state.note,kind:'current',returns:[]});
  return list;
 }
 function describeCard(c){return c?c.name+' · '+(c.reversed?'перевёрнута':'прямо')+'\nВопрос: '+c.role:'Места нет в этой записи';}
 function notePanel(item){
  const box=el('article');box.append(el('h4',item.label));
  if(item.kind==='demo')box.append(el('p','Авторский учебный пример. Он не является событием из Вашей тетради.'));
  if(item.at)box.append(el('p','Время фиксации: '+time(item.at)+'. Это не дата события.'));
  const detail=el('details');detail.append(el('summary','Вопрос и полный текст записи'));
  for(const f of G.FIELDS){detail.append(el('h5',G.LABELS[f]),el('p',item.note[f]||'Не заполнено'));}
  box.append(detail);
  if(item.returns.length){box.append(el('h5','Добавленные наблюдения'));for(const o of item.returns){const block=el('div');block.className='dy-return';block.append(el('strong','Дата наблюдения: '+o.date),el('p','Записанные факты: '+o.facts),el('p','Новое понимание: '+(o.revision||'Не заполнено')));box.append(block);}}
  else box.append(el('p',item.kind==='snapshot'?'К этому снимку ещё не добавлены наблюдения.':'Наблюдения можно добавить к сохранённому снимку в тетради.'));
  return box;
 }
 function render(){
  const a=items.find(x=>x.id===selectedA),b=items.find(x=>x.id===selectedB);$('dy-results').hidden=!a||!b;
  if(!a||!b){$('dy-status').textContent='Сохраните два разбора в лаборатории занятия, затем выберите их здесь. С одним снимком можно сравнить текущую запись на странице занятия.';return;}
  const result=M.compare(a.note,b.note),warnings=[...result.warnings];
  if(a.id===b.id)warnings.unshift('Выбрана одна и та же запись с обеих сторон.');
  if(a.kind==='demo'||b.kind==='demo')warnings.unshift('В сравнении есть учебный пример. Его нельзя считать Вашим наблюдением.');
  if(a.at&&b.at&&Date.parse(a.at)>Date.parse(b.at))warnings.push('Запись А сохранена позже Б. Порядок выбора не задаёт хронологию событий.');
  if(a.kind==='current'||b.kind==='current')warnings.push('Текущая запись может меняться. Для неизменной версии сохраните снимок.');
  $('dy-warnings').replaceChildren(...warnings.map(t=>el('p',t)));
  $('dy-status').textContent=result.sameConfiguration?'Конфигурация та же. Проверьте вопрос, объяснение и добавленные наблюдения.':'Конфигурации различаются. Таблица показывает изменения, не оценивая их как улучшение или ухудшение.';
  const changes=[];
  for(const c of result.retained){if(c.moved)changes.push(c.name+': место '+c.from+' → '+c.to+'.');if(c.turned)changes.push(c.name+': изменилась ориентация у сохранённой карты.');if(c.detailChanged)changes.push(c.name+': изменилось описание детали изображения.');}
  if(result.added.length)changes.push('Добавлены: '+result.added.map(c=>c.name).join(', ')+'.');if(result.removed.length)changes.push('Убраны: '+result.removed.map(c=>c.name).join(', ')+'.');
  if(result.focusChanged)changes.push('Изменилась карта, выбранная для временного исключения.');if(result.partitionChanged)changes.push('Изменилось разбиение четвёрки на пары.');
  $('dy-changes').replaceChildren(...(changes.length?changes:['Состав, порядок и ориентации карт совпадают; выбранная для исключения карта и разбиение также прежние.']).map(t=>el('li',t)));
  $('dy-positions').replaceChildren(...result.positions.map(p=>{const row=el('tr'),th=el('th',String(p.position));th.scope='row';row.append(th,el('td',describeCard(p.before)),el('td',describeCard(p.after)));return row;}));
  const textRows=[...result.textChanges,...result.retained.filter(c=>c.detailChanged).map(c=>({label:'Деталь: '+c.name,before:result.a.observations[c.id],after:result.b.observations[c.id]}))];
  $('dy-text').replaceChildren(...textRows.map(c=>{const row=el('tr'),th=el('th',c.label);th.scope='row';row.append(th,el('td',c.before||'Не заполнено'),el('td',c.after||'Не заполнено'));return row;}));$('dy-no-text').hidden=textRows.length>0;
  $('dy-notes').replaceChildren(notePanel(a),notePanel(b));
 }
 function refresh(){
  if(!getState||!$('dy-panel'))return;items=entries();
  if(!items.some(x=>x.id===selectedA))selectedA=items[0]?.id||'';
  if(!items.some(x=>x.id===selectedB))selectedB=(items.find(x=>x.id==='demo-b')||items[1]||items[0])?.id||'';
  for(const [id,value]of [['dy-a',selectedA],['dy-b',selectedB]]){$(id).replaceChildren(...items.map(item=>{const option=el('option',item.label);option.value=item.id;return option;}));$(id).value=value;$(id).disabled=!items.length;}
  render();
 }
 if($('dy-panel')){
  $('dy-a').addEventListener('change',()=>{selectedA=$('dy-a').value;render();});$('dy-b').addEventListener('change',()=>{selectedB=$('dy-b').value;render();});$('dy-refresh').addEventListener('click',refresh);
  $('dy-own').addEventListener('click',()=>{refresh();const own=items.filter(x=>x.kind==='snapshot'&&(!lesson||String(x.note.lesson)===String(lesson.id)));if(!own.length){$('dy-status').textContent='Сначала заполните вопрос и толкование и нажмите «Зафиксировать этот разбор». Учебные примеры в Вашу тетрадь не записываются.';return;}selectedA=own.at(-2)?.id||own[0].id;selectedB=own.length>1?own.at(-1).id:(items.find(x=>x.kind==='current')?.id||own[0].id);refresh();});
 }
 window.SpreadDynamicsUI={connect(read){getState=read;refresh();},refresh};
})();
