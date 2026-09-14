'use strict';
(()=>{
 const node=document.querySelector('#sy-data');if(!node)return;
 const DATA=JSON.parse(node.textContent),S=YetzirahState,KEY='eliora-yetzirah-v1';
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let state=S.empty(),storageOK=true;
 function load(){try{const raw=localStorage.getItem(KEY);return raw?S.normalize(JSON.parse(raw)):S.empty();}catch(e){storageOK=false;return state;}}
 function warning(){let n=$('#sy-storage-warning');if(!n){n=document.createElement('p');n.id='sy-storage-warning';n.className='sy-warning';n.setAttribute('role','alert');$('#main').prepend(n);}n.textContent='Браузер не разрешает сохранить тетрадь. Скачайте копию записей перед закрытием страницы.';}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){storageOK=false;warning();}updateProgress();}
 function edit(id,field,value){
  state=load();const r=state.lessons[id]||(state.lessons[id]={before:'',note:'',done:false,quiz:{}});
  if(field.startsWith('quiz-'))r.quiz[field.slice(5)]=value;else r[field]=value;save();
 }
 function updateProgress(){
  const n=DATA.lessons.filter(l=>state.lessons[l.id]?.done).length;
  $$('[data-sy-progress]').forEach(el=>el.textContent='Пройдено '+n+' из 12 занятий');
  $$('[data-sy-bar]').forEach(el=>el.value=n);
  $$('[data-sy-mark]').forEach(el=>el.textContent=state.lessons[el.dataset.syMark]?.done?'Пройдено ✓':'Можно начать');
  const next=DATA.lessons.find(l=>!state.lessons[l.id]?.done)||DATA.lessons[0];
  $$('[data-sy-resume]').forEach(el=>{el.href='/course/yetzirah/'+next.slug+'/';el.textContent=n?'Продолжить: занятие '+next.id+' →':'Начать первое занятие →';});
 }
 function wireNotes(root,id){
  $$('[data-sy-field]',root).forEach(el=>{
   const k=el.dataset.syField;el.value=state.lessons[id]?.[k]||'';
   el.addEventListener('input',()=>{edit(id,k,el.value);const status=$('[data-sy-saved="'+k+'"]',root);if(status)status.textContent=storageOK?'Сохранено в этом браузере':'Скачайте копию перед закрытием';});
  });
  const done=$('[data-sy-done]',root);if(done){done.checked=state.lessons[id]?.done===true;done.addEventListener('change',()=>edit(id,'done',done.checked));}
 }
 state=load();if(!storageOK)warning();
 $$('[data-sy-enhanced]').forEach(el=>el.disabled=false);
 const lesson=$('[data-sy-lesson]');
 if(lesson){
  const id=String(DATA.current),l=DATA.lessons.find(x=>x.id===DATA.current);wireNotes(lesson,id);
  $$('[data-sy-question]').forEach(el=>{const i=el.dataset.syQuestion;el.checked=state.lessons[id]?.quiz?.[i]===Number(el.value);el.addEventListener('change',()=>{edit(id,'quiz-'+i,Number(el.value));$('[data-sy-q-feedback="'+i+'"]').textContent='';$('[data-sy-quiz-result]').textContent='';});});
  $('[data-sy-quiz-check]')?.addEventListener('click',()=>{
   let count=0;l.quiz.forEach((q,i)=>{const selected=$('[name="sy-q-'+i+'"]:checked'),ok=selected&&Number(selected.value)===q.answer;count+=!!ok;const f=$('[data-sy-q-feedback="'+i+'"]');f.textContent=selected?((ok?'Верно. ':'Посмотрите ещё раз. ')+q.why):'Сначала выберите ответ.';f.className=ok?'sy-correct':'sy-retry';});
   $('[data-sy-quiz-result]').textContent='Верно '+count+' из '+l.quiz.length+'. '+(count===l.quiz.length?'Теперь объясните главную мысль своими словами.':'Пояснения помогут уточнить ответ.');
  });
 }
 $$('[data-sy-match-check]').forEach(b=>b.addEventListener('click',()=>{
  const f=b.closest('fieldset');let n=0;const fields=$$('select[data-sy-answer]',f);
  fields.forEach(el=>{const ok=el.value===el.dataset.syAnswer;n+=ok;el.setAttribute('aria-invalid',String(!ok));const hint=$('[data-sy-match-result]',el.parentElement);hint.textContent=ok?'Верно':el.value?'Сверьтесь с указанным пунктом':'Сначала выберите';hint.className=ok?'sy-correct':'sy-retry';});
  $('[data-sy-match-feedback]',f).textContent='Верно '+n+' из '+fields.length+'. '+(n===fields.length?'Поясните словами одну из связей.':'Можно изменить ответ или открыть разбор решения.');
 }));
 $$('select[data-sy-answer]').forEach(el=>el.addEventListener('change',()=>{el.removeAttribute('aria-invalid');$('[data-sy-match-result]',el.parentElement).textContent='';}));
 const flameText=['Вокруг образа говорится о связи конца и начала и о единстве Господа.','В объяснении можно выделить различимость внутри связи: уголь и пламя названы отдельно, но сопоставлены как связанные.','«Мысль и её выражение» — возможная аналогия читателя. Она не исчерпывает религиозный смысл отрывка.'];
 $$('[data-sy-flame]').forEach(b=>b.addEventListener('click',()=>{$$('[data-sy-flame]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('[data-sy-flame-output]').textContent=flameText[Number(b.dataset.syFlame)];}));
 $$('[data-sy-operation]').forEach(b=>b.addEventListener('click',()=>{const v={order:['В Б А','Те же три знака; изменён порядок.'],replace:['А Б Г','Три знака, но другой состав: В заменён на Г.'],reset:['А Б В','Три различных знака в исходном порядке.']}[b.dataset.syOperation];$('[data-sy-operation-row]').textContent=v[0];$('[data-sy-operation-output]').textContent=v[1];}));
 if($('#sy-pair-size')){
  const letters=Array.from('אבגדהוזחטיכלמנסעפצקרשת');
  const draw=()=>{const n=Number($('#sy-pair-size').value),ordered=$('#sy-pair-ordered').checked;let pairs=[];
   for(let i=0;i<n;i++)for(let j=ordered?0:i+1;j<n;j++)if(i!==j)pairs.push('<span><bdi lang="he">'+letters[i]+'</bdi> · <bdi lang="he">'+letters[j]+'</bdi></span>');
   $('[data-sy-pair-size]').textContent=n;$('[data-sy-pair-formula]').textContent=(ordered?'Пар с учётом порядка: ':'Пар без учёта порядка: ')+n+' × '+(n-1)+(ordered?'':' ÷ 2')+' = '+S.countPairs(n,ordered);$('[data-sy-pair-list]').innerHTML=pairs.join('');
  };$('#sy-pair-size').addEventListener('input',draw);$('#sy-pair-ordered').addEventListener('change',draw);draw();
 }
 if($('#sy-perm-size')){
  let n=3,row=[],found=new Set();const labels=['А','Б','В','Г'];
  const draw=()=>{$$('[data-sy-perm-letter]').forEach(b=>b.disabled=row.includes(b.dataset.syPermLetter));$('[data-sy-perm-row]').textContent=row.join(' ')||'…';$('[data-sy-perm-count]').textContent='Найдено '+found.size+' из '+S.factorial(n)+' порядков';$('[data-sy-perm-found]').innerHTML=[...found].sort().map(x=>'<span>'+x+'</span>').join('');};
  const next=()=>{row=[];$('[data-sy-perm-feedback]').textContent='Выберите первый знак.';draw();};
  const init=()=>{n=Number($('#sy-perm-size').value);found=new Set();row=[];$('[data-sy-perm-buttons]').innerHTML=labels.slice(0,n).map(x=>'<button class="button secondary" type="button" data-sy-perm-letter="'+x+'">'+x+'</button>').join('');
   $$('[data-sy-perm-letter]').forEach(b=>b.addEventListener('click',()=>{row.push(b.dataset.syPermLetter);if(row.length===n){const k=row.join(''),old=found.has(k);found.add(k);$('[data-sy-perm-feedback]').textContent=old?'Этот порядок уже есть. Начните следующий.':found.size===S.factorial(n)?'Все порядки найдены. Объясните, как Вы их перечислили.':'Новый порядок найден. Можно начать следующий.';}draw();}));next();};
  $('#sy-perm-size').addEventListener('change',init);$('[data-sy-perm-next]').addEventListener('click',next);$('[data-sy-perm-clear]').addEventListener('click',init);init();
 }
 if($('#sy-compare-letter')){
  let witness='both';const draw=()=>{const r=DATA.comparisons[Number($('#sy-compare-letter').value)];
   $('[data-sy-compare-output]').innerHTML=['T','G'].filter(x=>witness==='both'||witness===x).map(x=>'<section><h3>'+(x==='T'?'Т — основной перевод':'Г — редакция Гра')+'</h3><p><strong><bdi lang="he">'+r.letter+'</bdi> '+esc(r.name)+' — '+esc(r[x+'planet'])+'</strong></p><p>'+esc(r.day)+' · '+esc(r[x+'body'])+'</p><p class="fine">'+(x==='T'?'Т, '+r.Tref:'<a href="https://www.sefaria.org/Sefer_Yetzirah_Gra_Version.'+r.Gref.replace(':','.')+'?lang=he" target="_blank" rel="noopener noreferrer">Г, '+r.Gref+' →</a>')+'</p></section>').join('');
  };$('#sy-compare-letter').addEventListener('change',draw);$$('[data-sy-witness]').forEach(b=>b.addEventListener('click',()=>{witness=b.dataset.syWitness;$$('[data-sy-witness]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();}));draw();
 }
 $$('[data-sy-month]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.syMonth),m=DATA.months[i];$$('[data-sy-month]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$$('[data-sy-month-point]').forEach(x=>x.classList.toggle('active',Number(x.dataset.syMonthPoint)===i));$('[data-sy-month-letter]').textContent=m.letter;$('[data-sy-month-label]').textContent=m.month;$('[data-sy-month-output]').textContent=m.name+' — '+m.sign+' — '+m.month+'. Источник: Т, V:2.';}));
 function renderNotebook(){const box=$('[data-sy-notebook]');if(!box)return;
  const found=DATA.lessons.filter(l=>{const r=state.lessons[l.id];return r&&(r.before||r.note||r.done);});
  box.innerHTML=found.length?found.map(l=>{const r=state.lessons[l.id];return '<section class="sy-notebook-entry" data-sy-entry="'+l.id+'"><h2><a href="/course/yetzirah/'+l.slug+'/">'+l.id+'. '+esc(l.title)+'</a></h2><label for="sy-nb-before-'+l.id+'">Перед чтением</label><textarea id="sy-nb-before-'+l.id+'" data-sy-field="before" maxlength="100000" rows="3"></textarea><small data-sy-saved="before" role="status"></small><label for="sy-nb-note-'+l.id+'">После чтения</label><textarea id="sy-nb-note-'+l.id+'" data-sy-field="note" maxlength="100000" rows="6"></textarea><small data-sy-saved="note" role="status"></small><label class="sy-check"><input type="checkbox" data-sy-done> Отмечаю занятие как пройденное</label></section>';}).join(''):'<p class="sy-output">Здесь появятся первые мысли и записи к занятиям. <a href="../book-and-reader/">Открыть первое занятие →</a></p>';
  $$('[data-sy-entry]',box).forEach(el=>wireNotes(el,el.dataset.syEntry));
 }
 function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('[data-sy-export]')?.addEventListener('click',()=>{state=load();download(JSON.stringify(state,null,2),'eliora-yetzirah-notebook.json','application/json');});
 $('[data-sy-export-text]')?.addEventListener('click',()=>{state=load();const lines=['Сефер Йецира · Тетрадь модуля · Элиора Вейра',''];for(const l of DATA.lessons){const r=state.lessons[l.id];if(r&&(r.before||r.note||r.done))lines.push(l.id+'. '+l.title,r.done?'Занятие отмечено как пройденное':'В работе','Перед чтением:',r.before,'После чтения:',r.note,'');}download(lines.join('\n'),'eliora-yetzirah-notebook.txt','text/plain;charset=utf-8');});
 $('#sy-import')?.addEventListener('change',async()=>{const input=$('#sy-import'),f=input.files[0],msg=$('[data-sy-import-status]');if(!f)return;try{if(f.size>4000000)throw Error('Файл слишком большой.');const raw=JSON.parse(await f.text()),merged=S.merge(load(),raw);state=merged;save();renderNotebook();msg.textContent=storageOK?'Импорт завершён. Прежние записи сохранены.':'Импорт прочитан, но браузер не разрешает сохранение. Скачайте объединённую тетрадь.';}catch(e){msg.textContent='Импорт не выполнен: '+e.message;}finally{input.value='';}});
 window.addEventListener('storage',e=>{if(e.key===KEY){state=load();updateProgress();}});
 renderNotebook();updateProgress();
})();
