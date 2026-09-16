'use strict';
(function(){
 const node=document.getElementById('study-tools-data');if(!node||!window.StudyToolsState)return;
 const D=JSON.parse(node.textContent), $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
 const KEY='eliora-study-tools-v1', schema={}, titles={}, paths={comment:'reading-workshop',compare:'compare-authors',clinic:'argument-clinic'};
 const baseFields=Object.fromEntries(Object.entries(D.fieldLabels).map(([k,v])=>[k,Object.keys(v)]));
 for(const x of D.comments){schema['comment:'+x.id]=baseFields.comment;titles['comment:'+x.id]=x.title;}
 schema['comment:custom']=[...baseFields.comment,'reference','excerpt'];titles['comment:custom']='Мой фрагмент';
 for(const x of D.comparisons){schema['compare:'+x.id]=baseFields.compare;titles['compare:'+x.id]=x.title;}
 for(const x of D.errors){schema['clinic:'+x.id]=[...baseFields.clinic,'answer','checked'];titles['clinic:'+x.id]=x.title;}
 const C=StudyToolsState.create(schema);let state=C.empty(),storageOK=true,lastRaw=null,current=null;
 const status=t=>{$('#st-status').textContent=t;};
 try{lastRaw=localStorage.getItem(KEY);if(lastRaw)state=C.validate(JSON.parse(lastRaw));}
 catch(e){storageOK=false;status('Не удалось прочитать сохранённую тетрадь. Прежние данные не перезаписываются. Новую работу скачайте файлом перед закрытием страницы.');}
 function persist(message='Черновик сохранён в этом браузере.'){
  if(!storageOK){status('Запись пока хранится только на этой открытой странице. Скачайте копию перед закрытием.');return;}
  try{
   const actual=localStorage.getItem(KEY);
   if(actual!==lastRaw&&actual){state=C.merge(state,JSON.parse(actual));message='Записи объединены с изменениями другой вкладки. Проверьте их в тетради.';}
   const raw=JSON.stringify(state);localStorage.setItem(KEY,raw);lastRaw=raw;status(message);
  }catch(e){storageOK=false;status('Не удалось сохранить в браузере: '+e.message+' Скачайте копию перед закрытием страницы.');}
 }
 function label(f){return Object.values(D.fieldLabels).map(x=>x[f]).find(Boolean)||({reference:'Источник',excerpt:'Мой фрагмент',answer:'Выбранный ответ',checked:'Результат проверки'})[f]||f;}
 function textFields(f,key=current){return Object.entries(f).filter(([,v])=>v.trim()).map(([k,v])=>{
  const question=key?.startsWith('clinic:')?D.errors.find(x=>x.id===key.split(':')[1]):null;
  if(question&&['answer','checked'].includes(k)){
   const choices=[...new Set(v.split('\n').map(x=>x.trim()).filter(x=>/^[0-2]$/.test(x)))];
   v=choices.map(x=>k==='answer'?(question.options?.[Number(x)]||'Вариант '+(Number(x)+1)):(Number(x)===question.answer?'Ответ верный.':'Стоит вернуться к пояснению и попробовать ещё раз.')).join('\n')||'Откройте упражнение и выберите ответ заново.';
  }
  return label(k)+'\n'+v;
 }).join('\n\n');}
 function addText(parent,tag,t,cls){const el=document.createElement(tag);el.textContent=t;if(cls)el.className=cls;parent.append(el);return el;}
 function revisions(){
  const host=$('[data-st-revisions]');if(!host||!current)return;host.replaceChildren();const r=C.record(state,current);
  if(!r.revisions.length){addText(host,'p','Сохранённых редакций пока нет. Черновик сохраняется автоматически; редакцию фиксирует кнопка выше.');return;}
  r.revisions.forEach((v,i)=>{const item=document.createElement('details');item.className='st-revision';addText(item,'summary',(i===0?'Первая сохранённая попытка':'Редакция '+(i+1))+' · '+new Date(v.at).toLocaleString('ru-RU'));addText(item,'pre',textFields(v.fields));host.append(item);});
 }
 function snapshot(message){try{const changed=C.snapshot(state,current);persist(changed?message:'Изменений для новой редакции нет.');revisions();}catch(e){status(e.message);}}
 function activeFields(){return $$('[data-st-field]').filter(x=>!x.closest('[data-st-item]')||x.closest('[data-st-item]').dataset.stItem==='custom'&&current==='comment:custom');}
 function select(id){
  const key=D.mode+':'+id;if(!schema[key])return;current=key;
  $$('[data-st-item]').forEach(x=>{x.hidden=x.dataset.stItem!==id;});
  const r=C.record(state,current);activeFields().forEach(x=>{x.value=r.fields[x.dataset.stField]||'';});
  const feedback=$('[data-st-feedback]');if(feedback)feedback.textContent='';
  if(D.mode==='clinic'){
   const section=$('[data-st-item="'+id+'"]');section.querySelectorAll('input[type=radio]').forEach(x=>{x.checked=x.value===r.fields.answer;});
   if(r.fields.checked===r.fields.answer&&r.fields.checked!==undefined)showAnswer(id,false);else $('[data-st-result="'+id+'"]').textContent='';
  }
  revisions();
 }
 function showAnswer(id,save){
  const x=D.errors.find(x=>x.id===id),r=C.record(state,'clinic:'+id),out=$('[data-st-result="'+id+'"]');
  if(!/^[0-2]$/.test(r.fields.answer||'')){out.textContent='Сначала выберите ответ.';return;}
  const correct=Number(r.fields.answer)===x.answer;
  out.textContent=(correct?'Верно: ':'Пока нет. ')+x.why+(correct?' Теперь запишите собственное исправление.':' Вернитесь к подсказке и попробуйте ещё раз.');
  if(save){r.fields.checked=r.fields.answer;persist('Выбор сохранён. Исправленная формулировка остаётся Вашей работой.');}
 }
 const selector=$('#st-select');
 if(selector){const wanted=new URLSearchParams(location.search).get('source');if(wanted&&schema[D.mode+':'+wanted])selector.value=wanted;select(selector.value);selector.addEventListener('change',()=>select(selector.value));}
 $$('[data-st-field]').forEach(x=>x.addEventListener('input',()=>{
  if(!current||!schema[current].includes(x.dataset.stField))return;C.record(state,current).fields[x.dataset.stField]=x.value;persist();
 }));
 $('[data-st-snapshot]')?.addEventListener('click',()=>snapshot('Редакция сохранена. Можно продолжить работу; этот вариант останется в тетради.'));
 $('[data-st-review]')?.addEventListener('click',()=>{
  const fields=baseFields[D.mode],r=C.record(state,current),missing=fields.filter(f=>!(r.fields[f]||'').trim());
  $('[data-st-feedback]').textContent=missing.length?'Заполнено '+(fields.length-missing.length)+' из '+fields.length+'. Ещё стоит обдумать: '+missing.map(f=>label(f)).join(' · '):'Все части заполнены. Теперь сверьте основание с источником: следует ли из него Ваш вывод? Обозначена ли граница аналогии? Это проверка полноты, а не оценка истинности.';
 });
 $$('.st-model').forEach(x=>x.addEventListener('toggle',()=>{if(x.open&&current&&!x.closest('[data-st-item]').hidden)snapshot('Черновик перед открытием образца сохранён как редакция.');}));
 $$('[data-st-check]').forEach(x=>x.addEventListener('click',()=>showAnswer(x.dataset.stCheck,true)));
 $$('[data-st-item] input[type=radio]').forEach(x=>x.addEventListener('change',()=>{const id=x.closest('[data-st-item]').dataset.stItem;C.record(state,'clinic:'+id).fields.answer=x.value;$('[data-st-result="'+id+'"]').textContent='';persist();}));
 function download(content,type,name){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function exportText(){return 'Элиора Вейра · Тетрадь мастерских\n\n'+Object.entries(state.records).filter(([,r])=>Object.values(r.fields).some(v=>v.trim())||r.revisions.length).map(([k,r])=>titles[k]+'\nТекущий черновик\n'+textFields(r.fields,k)+'\n\n'+r.revisions.map((v,i)=>'Редакция '+(i+1)+' · '+v.at+'\n'+textFields(v.fields,k)).join('\n\n')).join('\n\n────────────────\n\n');}
 function exportJSON(){download(JSON.stringify(state,null,2),'application/json','Eliora_Study_Workshops.json');}
 // A local download is available on every tool, including when browser storage fails.
 if(current){const actions=$('.st-actions');const b=addText(actions,'button','Скачать копию','button secondary');b.type='button';b.addEventListener('click',exportJSON);}
 $('[data-st-export]')?.addEventListener('click',exportJSON);
 $('[data-st-text]')?.addEventListener('click',()=>download(exportText(),'text/plain;charset=utf-8','Eliora_Study_Workshops.txt'));
 function notebook(){
  const host=$('#st-notebook');if(!host)return;host.replaceChildren();let count=0;
  for(const [key,r] of Object.entries(state.records)){
   if(!Object.values(r.fields).some(v=>v.trim())&&!r.revisions.length)continue;count++;
   const section=document.createElement('section');section.className='st-panel';addText(section,'h2',titles[key]);
   const [kind,id]=key.split(':'),a=addText(section,'a','Продолжить эту работу →');a.href='/course/'+paths[kind]+'/?source='+id;
   addText(section,'h3','Текущий черновик');addText(section,'pre',textFields(r.fields,key)||'Пустой черновик');
   r.revisions.forEach((v,i)=>{const details=document.createElement('details');addText(details,'summary',(i===0?'Первая сохранённая попытка':'Редакция '+(i+1))+' · '+new Date(v.at).toLocaleString('ru-RU'));addText(details,'pre',textFields(v.fields,key));section.append(details);});host.append(section);
  }
  if(!count)addText(host,'p','Записей пока нет. Откройте любую мастерскую и начните с небольшого фрагмента.');
 }
 $('#st-import')?.addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>8*1024*1024)throw Error('Файл больше 8 МБ.');const incoming=JSON.parse(await file.text()),next=C.merge(state,incoming);state=next;persist('Тетрадь загружена. Прежние записи и сохранённые редакции объединены.');notebook();}
  catch(err){status('Файл не загружен: '+err.message+' Текущие записи сохранены.');}finally{e.target.value='';}
 });
 notebook();
})();
