'use strict';
(()=>{
const DATA=JSON.parse(document.querySelector('#course-data').textContent),META=DATA.lessons||[],KEY='eliora-course-v2';
const BY=Object.fromEntries(META.map(l=>[l.id,l]));
// Program (navigation) order; ids and the numbers the learner sees stay the same.
const PROG=((DATA.order||[]).length===META.length?DATA.order.map(id=>BY[id]).filter(Boolean):META.slice());
const CIRCLE=DATA.circle||[],PAGES=DATA.pages||{};
let state=CourseState.empty(),storageOK=true;
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');state=CourseState.normalize(saved,META);}catch(e){storageOK=false;}
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=l=>DATA.root+'course/'+l.slug+'/';
const abs=h=>DATA.root+String(h).replace(/^\//,'');
const plural=(n,one,few,many)=>{const a=n%10,b=n%100;return a===1&&b!==11?one:a>=2&&a<=4&&(b<12||b>14)?few:many;};
function warn(){let el=$('#storage-warning');if(!el){el=document.createElement('div');el.id='storage-warning';el.className='storage-warning';el.setAttribute('role','status');document.body.prepend(el);}el.textContent='Браузер не разрешает сохранение. Записи пока доступны в открытой вкладке — экспортируйте тетрадь перед закрытием.';}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){storageOK=false;warn();}updateProgress();updateReadings();updateCircle();}
function record(id){const qv=BY[id]?.qv;return state.lessons[id]||(state.lessons[id]={score:0,checked:false,done:false,stage:0,reflection:false,answers:{},res:{},miss:{},...(Number.isInteger(qv)?{qv}:{})});}
const isDone=id=>state.lessons[id]?.done===true;
function updateProgress(){
 const done=META.filter(l=>isDone(l.id)).length;
 $$('[data-progress-text]').forEach(el=>el.textContent=done+' из '+META.length+' '+plural(META.length,'урока','уроков','уроков')+' завершено');
 $$('[data-progress-fill]').forEach(el=>el.style.width=(100*done/META.length)+'%');
 $$('[data-lesson-status]').forEach(el=>{const ok=isDone(el.dataset.lessonStatus);el.textContent=ok?'✓':'';el.setAttribute('aria-label',ok?'пройден':'');});
 const next=PROG.find(l=>!isDone(l.id))||PROG[0];
 $$('[data-resume]').forEach(el=>{if(!next)return;el.href=link(next);el.textContent=done?'Продолжить: урок '+next.id:'Начать первый урок';});
 $$('[data-module-count]').forEach(el=>{const m=Number(el.dataset.moduleCount),ls=PROG.filter(l=>l.module===m),k=ls.filter(l=>isDone(l.id)).length;el.textContent=k?'✓ '+k+' из '+ls.length+' · ':'';});
 $$('[data-all-done]').forEach(el=>el.hidden=done!==META.length);
}
// First circle: progress derived from lesson done flags, readings[id].done and the books intro tick.
function circleDone(key){if(key==='intro')return state.intro===true;if(key[0]==='l')return isDone(Number(key.slice(1)));if(key[0]==='r')return state.readings[Number(key.slice(1))]?.done===true;return false;}
function circleState(){const done=CIRCLE.filter(x=>circleDone(x.key)).length;return {done,total:CIRCLE.length,next:CIRCLE.find(x=>!circleDone(x.key))};}
function updateCircle(){
 if(!CIRCLE.length)return;const c=circleState();
 $$('[data-circle-count]').forEach(el=>el.textContent=c.done+' из '+c.total);
 $$('[data-circle-fill]').forEach(el=>el.style.width=(100*c.done/c.total)+'%');
 $$('[data-circle-mark]').forEach(el=>{const ok=circleDone(el.dataset.circleMark);el.textContent=ok?'✓':'';el.closest('li')?.classList.toggle('is-done',ok);});
 $$('[data-circle-item]').forEach(el=>el.classList.toggle('is-next',!!c.next&&el.dataset.circleItem===c.next.key));
 $$('[data-circle-resume]').forEach(el=>{if(c.next){el.href=abs(c.next.href);el.textContent=c.done?(PAGES.circleContinue||'Продолжить круг →'):(PAGES.circleStart||'Начать первую встречу →');}else{el.href='#circle-after';el.textContent='Первый круг пройден: что дальше ↓';}});
 $$('[data-circle-after]').forEach(el=>{if(!c.next&&!el.dataset.opened){el.open=true;el.dataset.opened='1';}});
}
if(!storageOK)warn();if(state.large){document.documentElement.style.setProperty('--body-size','19px');$$('[data-font-size]').forEach(b=>b.textContent='Обычный текст');}if(window.matchMedia('(max-width:760px)').matches)$$('.toc').forEach(el=>el.open=false);
$$('[data-font-size]').forEach(b=>b.addEventListener('click',()=>{state.large=!state.large;document.documentElement.style.setProperty('--body-size',state.large?'19px':'17px');b.textContent=state.large?'Обычный текст':'Крупнее текст';save();}));
// Books introduction = the first meeting of the circle.
$$('[data-intro-done]').forEach(cb=>{cb.checked=state.intro===true;cb.addEventListener('change',()=>{state.intro=cb.checked;save();const s=$('[data-intro-status]');if(s){s.hidden=false;s.className='feedback'+(cb.checked?' good':'');s.textContent=cb.checked?'Отмечено: первая встреча круга пройдена. Дальше — урок 1.':'Отметка снята.';}});});
// Semantic, keyboard accessible diagram interactions.
function setupLab(el){const kind=el.dataset.lab;
 const detail=(title,text)=>{const d=$('[data-detail]',el);if(d)d.innerHTML='<h4>'+esc(title)+'</h4><p>'+esc(text)+'</p>';};
 const active=(buttons,index)=>buttons.forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',i===index?'true':'false');});
 if(kind==='tree'){
  const nodes=$$('.tree-node',el),d=DATA.sefirot;let target=-1;
  const select=i=>{active(nodes,i);detail(d[i][0]+' · '+d[i][2],d[i][3]+' '+d[i][4]);if(target>=0){const f=$('[data-tree-feedback]',el);f.className='feedback '+(target===i?'good':'bad');f.textContent=target===i?'Найдено. Обратите внимание на связь, затем выберите новую задачу.':'Это '+d[i][0]+'. Ищем '+d[target][0]+'. Вспомните положение и значение имени.';if(target===i)target=-1;}};
  nodes.forEach((b,i)=>{b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(i);}});});
  $$('[data-tree-group]',el).forEach(b=>b.addEventListener('click',()=>{const set=b.dataset.treeGroup.split(',').map(Number);nodes.forEach((n,i)=>n.classList.toggle('active',set.includes(i)));detail(b.textContent,set.map(i=>d[i][0]+' — '+d[i][2]).join('; ')+'. Проследите отношения между выделенными понятиями.');}));
  $('[data-tree-task]',el)?.addEventListener('click',()=>{target=[3,4,5,8,9][Math.floor(Math.random()*5)];$('[data-tree-feedback]',el).textContent='Найдите: '+d[target][0]+' — '+d[target][2]+'.';});select(0);
 }
 if(kind==='worlds'){const bs=$$('[data-world]',el);bs.forEach((b,i)=>b.addEventListener('click',()=>{active(bs,i);detail(DATA.worlds[i][0]+' · '+DATA.worlds[i][1],DATA.worlds[i][2]+' Десять точек ниже показывают, что здесь может рассматриваться весь ряд сефирот.');}));bs[0]?.click();}
 if(kind==='timeline'){const bs=$$('[data-time]',el);bs.forEach((b,i)=>b.addEventListener('click',()=>{active(bs,i);detail(DATA.timeline[i][1],DATA.timeline[i][0]+'. '+DATA.timeline[i][2]);}));bs[0]?.click();}
 if(kind==='letters'){const groups=[['Три матери','א מ ש','Алеф, мем, шин. Группа выделена внутри двадцати двух букв.'],['Семь двойных','ב ג ד כ פ ר ת','Бет, гимел, далет, каф, пе, реш, тав. Их объяснение зависит от редакции текста.'],['Двенадцать простых','ה ו ז ח ט י ל נ ס ע צ ק','Оставшиеся двенадцать букв. Вместе с первыми группами: 3 + 7 + 12 = 22.']];const bs=$$('[data-letter-group]',el);bs.forEach((b,i)=>b.addEventListener('click',()=>{active(bs,i);$('[data-letters]',el).textContent=groups[i][1];detail(groups[i][0],groups[i][2]);}));bs[0]?.click();}
 if(kind==='permutations'||kind==='permutations-alef'){let row=[],found=new Set();const bs=$$('[data-letter]',el),f=$('[data-perm-feedback]',el);const draw=()=>{$('[data-perm]',el).textContent=row.join('')||'· · ·';bs.forEach(b=>b.disabled=row.includes(b.dataset.letter));};bs.forEach(b=>b.addEventListener('click',()=>{row.push(b.dataset.letter);draw();if(row.length===3){const x=row.join('');f.textContent=found.has(x)?'Этот порядок уже встречался. Попробуйте другой.':'Новый порядок найден.';found.add(x);$('[data-found]',el).innerHTML=[...found].sort().map(s=>'<span>'+s+'</span>').join('');$('[data-perm-count]',el).textContent=found.size+' из 6';if(found.size===6)f.textContent='Все шесть порядков найдены: 3 × 2 × 1 = 6.';}}));$('[data-perm-next]',el).addEventListener('click',()=>{row=[];draw();f.textContent='Выберите первую букву нового порядка.';});draw();}
 if(['river','rose','soul','balance'].includes(kind)){
 const info={river:[['Реки','В выбранной редакции Пкудей §§ 1–2 реки и источники поясняются через сефирот Зеир Анпина.'],['Море','Малхут принимает поток. Принимающее начало одновременно становится передающим.'],['Нижние ступени','Поток направляется дальше к ступеням миров Брия, Йецира, Асия. Схема показывает отношение, а не движение физической воды.']],rose:[['Библейский образ','В начале — роза среди шипов. Сначала называем образ и детали, не добавляя собственных значений.'],['Соответствие','В § 1 выбранной редакции: роза — Кнессет Исраэль и Малхут; красное и белое — суд и милосердие.'],['Развёрнутый комментарий','«Пояснение сказанного» связывает образ с парцуфим, малым и большим состояниями. Это следующий слой чтения.']],soul:[['Нефеш','В Лех леха §§ 155–158 описана как нижний уровень, связанный с телом и служащий опорой руаху.'],['Руах','Связан с нефеш и служит опорой нешаме. Важна связь уровней, а не перечень отдельных частей.'],['Нешама','В выбранном отрывке названа высшей относительно нефеш и руаха. Мы разбираем религиозную модель души.']],balance:[['Щедрость','Учебная аналогия: хочется дать ученику много интересного материала. Сама по себе щедрость ещё не определяет подходящий объём.'],['Мера','Нужны границы: посильная задача, ясная последовательность, время на понимание.'],['Согласование','Преподаватель соединяет щедрость и меру так, чтобы занятие помогало учиться. Это современная аналогия, а не исчерпывающее определение сефирот.']]};const bs=$$('[data-symbol-step]',el);bs.forEach((b,i)=>b.addEventListener('click',()=>{active(bs,i);$$('[data-shape]',el).forEach(n=>n.style.opacity=Number(n.dataset.shape)===i?'1':'.3');detail(info[kind][i][0],info[kind][i][1]);}));bs[0]?.click();
 }
 if(kind==='luria'){const bs=$$('[data-luria]',el),shapes=$$('[data-luria-shape]',el);bs.forEach((b,i)=>b.addEventListener('click',()=>{active(bs,i);shapes.forEach((s,j)=>{if(j===i)s.removeAttribute('hidden');else s.setAttribute('hidden','');});detail(DATA.luria[i][0]+' · '+DATA.luria[i][1],DATA.luria[i][2]+' Это этап учебного рассказа, а не физическая модель Вселенной.');}));bs[0]?.click();}
 if(kind==='context'){const bs=$$('[data-context]',el),t=[['Писание','Танах включает Тору, Пророков и Писания. Каббалистическое толкование часто начинается с конкретного стиха.'],['Толкование','Мидраш и комментарии задают вопросы к тексту и связывают его места. Зоар продолжает эту культуру чтения особым символическим языком.'],['Практика','Заповеди, молитва и календарь входят в мир каббалиста. Религиозный поступок получает значение внутри учения.']];bs.forEach((b,i)=>b.addEventListener('click',()=>{active(bs,i);detail(...t[i]);}));bs[0]?.click();}
 if(kind==='layers'){const tests=[['«В начале отрывка названы реки и море».',0,'Это наблюдение: названы элементы выбранного текста.'],['«В данной редакции море поясняется через Малхут».',1,'Это установленное пояснение конкретной редакции.'],['«Мне море напоминает способность внимательно слушать».',2,'Это собственная ассоциация; её можно сохранить как личный отклик.']];let i=0;const draw=()=>{$('[data-sort-prompt]',el).textContent=tests[i][0];$('[data-sort-feedback]',el).textContent='Выберите, к какому слою относится фраза.';};$$('[data-sort]',el).forEach(b=>b.addEventListener('click',()=>{const ok=Number(b.dataset.sort)===tests[i][1],f=$('[data-sort-feedback]',el);f.className='feedback '+(ok?'good':'bad');f.textContent=(ok?'Верно. ':'Попробуйте ещё раз. ')+tests[i][2];}));$('[data-sort-next]',el).addEventListener('click',()=>{i=(i+1)%tests.length;draw();});draw();}
 if(kind==='deck'){const tests=[['Королева кубков',1,'Придворная карта масти кубков.'],['Отшельник',0,'Старший аркан.'],['Туз жезлов',2,'Числовая карта младших арканов.'],['Рыцарь мечей',1,'Придворная карта масти мечей.']];let i=0;const draw=()=>{$('[data-deck-card]',el).textContent=tests[i][0];$('[data-deck-feedback]',el).textContent='Выберите группу карты.';};$$('[data-deck-type]',el).forEach(b=>b.addEventListener('click',()=>{const ok=Number(b.dataset.deckType)===tests[i][1],f=$('[data-deck-feedback]',el);f.className='feedback '+(ok?'good':'bad');f.textContent=(ok?'Верно. ':'Посмотрите на ранг и название. ')+tests[i][2];}));$('[data-deck-next]',el).addEventListener('click',()=>{i=(i+1)%tests.length;draw();});draw();}
 if(kind==='hermit'){const t=[['Наблюдение','Фигура, фонарь и посох — детали учебной схемы. Найдите их и опишите без предсказаний.'],['Уэйт о карте','В тексте Уэйта фонарь связан в том числе со светом, указывающим путь другим. Полное объяснение — в источнике к уроку.'],['Ваш вопрос','Что я могу прояснить перед следующим шагом? Запишите свой отклик отдельно от слов Уэйта.']];const bs=$$('[data-hermit]',el);bs.forEach((b,i)=>b.addEventListener('click',()=>{active(bs,i);detail(...t[i]);}));bs[0]?.click();}
}
$$('[data-lab]:not([data-lab3])').forEach(setupLab);
// Guided lesson: quiz v3 (per-question check, addressed feedback, hint ladder), own note, completion.
if(DATA.lesson){const L=DATA.lesson,r=record(L.id),Q=L.quiz||[];document.body.classList.add('guided');const stages=$$('[data-stage]'),steps=$$('[data-go-stage]');
 r.answers=r.answers||{};r.res=r.res||{};r.miss=r.miss||{};if(Number.isInteger(L.qv))r.qv=L.qv;
 function stage(i,focus=false){i=Math.max(0,Math.min(3,i));r.stage=i;stages.forEach((s,n)=>{s.classList.toggle('active',n===i);s.setAttribute('aria-hidden',n===i?'false':'true');});steps.forEach(b=>b.setAttribute('aria-current',Number(b.dataset.goStage)===i?'step':'false'));save();if(focus)stages[i].focus({preventScroll:false});}
 steps.forEach(b=>b.addEventListener('click',()=>stage(Number(b.dataset.goStage),true)));stage(r.stage||0);
 // «↑» links from a hint back to the section of stage 1
 document.addEventListener('click',e=>{const a=e.target.closest('[data-go-section]');if(!a)return;e.preventDefault();stage(0);const t=document.getElementById('sec-'+a.dataset.goSection);if(t){t.scrollIntoView({block:'start'});t.setAttribute('tabindex','-1');t.focus({preventScroll:true});}});
 const resolvedN=()=>Q.filter((q,i)=>r.res[i]>0).length;
 function sync(){r.score=resolvedN();r.checked=r.score===Q.length;}
 function drawQ(i){
  const q=Q[i],fs=$('[data-quiz-item="'+i+'"]'),fb=$('[data-q-feedback="'+i+'"]');if(!fs||!fb)return;
  const a=r.answers[i],res=r.res[i]||0,labels=$$('[data-option]',fs);
  $$('input',fs).forEach(inp=>inp.checked=Number(inp.value)===a);
  labels.forEach((lab,n)=>{lab.classList.toggle('is-right',n===a&&n===q.answer);lab.classList.toggle('is-wrong',n===a&&n!==q.answer);lab.classList.toggle('is-revealed',res===2&&n===q.answer);});
  fs.classList.toggle('is-resolved',res>0);fs.classList.toggle('via-hint',res===2);
  let h='';
  if(a!==undefined){const text=(q.feedback&&q.feedback[a])||q.why;h+=a===q.answer?'<p class="feedback good"><b>Верно.</b> '+esc(text)+'</p>':'<p class="feedback bad"><b>Пока нет.</b> '+esc(text)+'</p>';}
  if(res===2){
   const sec=Number.isInteger(q.hintSection)?' <a href="#sec-'+(q.hintSection+1)+'" data-go-section="'+(q.hintSection+1)+'">↑ Вернуться к этому разделу</a>':'';
   h+='<div class="q-hint"><p><b>Подсказка.</b> '+esc(q.hint||'')+sec+'</p><p class="feedback good"><b>Верный ответ:</b> '+esc(q.options[q.answer])+'. '+esc(q.why)+'</p><p class="q-badge">Вопрос разобран с подсказкой — это ничего не отнимает.</p></div>';
  }else if(res===0&&(r.miss[i]||0)>=1)h+='<p class="fine">Выберите другой вариант. Если и он не подойдёт, откроется подсказка и верный ответ.</p>';
  fb.innerHTML=h;
 }
 function summary(){const f=$('#quiz-summary');if(!f)return;const n=resolvedN(),hinted=Q.filter((q,i)=>r.res[i]===2).length;
  f.className='feedback'+(n===Q.length?' good':'');
  f.textContent=n===Q.length?'Все '+Q.length+' '+plural(Q.length,'вопрос','вопроса','вопросов')+' разобраны'+(hinted?' (с подсказкой — '+hinted+')':'')+'. Можно переходить к своей записи.':n?'Разобрано '+n+' из '+Q.length+'. Остальные вопросы ждут — порядок не важен.':'Выберите ответ — он проверится сразу.';}
 $$('input[data-question]').forEach(input=>input.addEventListener('change',()=>{
  const i=Number(input.dataset.question),v=Number(input.value),q=Q[i];r.answers[i]=v;
  if(!(r.res[i]>0)){if(v===q.answer)r.res[i]=1;else{r.miss[i]=Math.min(2,(r.miss[i]||0)+1);if(r.miss[i]>=2)r.res[i]=2;}}
  sync();save();drawQ(i);summary();completionHint();
 }));
 Q.forEach((q,i)=>drawQ(i));summary();
 // Stage 4: scaffold fields ↔ one note string of labelled lines; the one-word memo is the last label.
 const scaffold=L.scaffold||[],fields=$$('[data-scaffold-field]'),note=$('#reflection'),status=$('#note-status'),check=$('#reflection-check'),oneBox=$('[data-one-word]'),one=$('#one-word');
 const labels=CourseState.scaffoldLabels([...scaffold,'Запомнилось']);
 const parsed=CourseState.parseNote(labels,state.notes[L.id]||'');
 fields.forEach((f,n)=>f.value=parsed.values[n]||'');if(one)one.value=parsed.values[labels.length-1]||'';note.value=parsed.free;check.checked=!!r.reflection;
 const composed=()=>CourseState.joinNote(labels,[...fields.map(f=>f.value),one?one.value:''],note.value);
 function sample(){const open=!!composed().trim()||check.checked;const s=$('[data-sample]'),lock=$('[data-sample-locked]');if(s)s.hidden=!open;if(lock)lock.hidden=open;if(oneBox)oneBox.hidden=!check.checked;}
 function write(){state.notes[L.id]=composed();save();status.textContent=storageOK?'Сохранено в этом браузере':'Пока хранится в открытой вкладке';sample();completionHint();}
 [...fields,note,...(one?[one]:[])].forEach(el=>el.addEventListener('input',write));
 check.addEventListener('change',()=>{r.reflection=check.checked;save();sample();completionHint();});sample();
 function completionHint(){const f=$('#completion-status');if(!f||r.done)return;const n=resolvedN();f.className='feedback';f.textContent=n<Q.length?'Осталось разобрать '+(Q.length-n)+' '+plural(Q.length-n,'вопрос','вопроса','вопросов')+' на шаге «Проверим» — с подсказкой тоже считается.':(composed().trim()||check.checked)?'Всё готово: можно завершить урок.':'Осталось записать хотя бы одну строку или отметить, что Вы обдумали вопрос без записи.';}
 function completed(focus=false){const box=$('#completion-result');box.hidden=!r.done;if(!r.done)return;
  const mod=PROG.filter(l=>l.module===L.module),k=mod.filter(l=>isDone(l.id)).length,modName=(DATA.modules||[])[L.module]||'';
  let h='<h3>'+esc(PAGES.completionTitle||'Урок завершён')+'</h3>'+(L.aim?'<p class="done-aim">✓ Теперь Вы можете: '+esc(L.aim)+'</p>':'')+(L.keyword?'<p>Главное слово урока: <b>'+esc(L.keyword)+'</b></p>':'')+'<p>Раздел '+(L.module+1)+(modName?' «'+esc(modName)+'»':'')+': '+k+' из '+mod.length+'</p>';
  const inCircle=CIRCLE.some(x=>x.key==='l'+L.id);
  if(inCircle){const c=circleState();h+='<p>Первый круг: '+c.done+' из '+c.total+(c.next?'. Следующая встреча — <a href="'+esc(abs(c.next.href))+'">'+esc(c.next.title)+'</a> ('+esc(c.next.label.toLowerCase())+', '+esc(c.next.minutes)+' мин)':'. Круг пройден — <a href="'+DATA.root+'course/#circle-after">что дальше</a>')+'.</p>';}
  const idx=PROG.findIndex(l=>l.id===L.id),nx=PROG[idx+1];
  h+=nx?'<a class="button" href="'+link(nx)+'">Дальше по программе: урок '+nx.id+' · '+esc(nx.title)+' · '+esc(nx.time||'10–20 минут')+' →</a>':'<a class="button" href="'+DATA.root+'course/notebook/">Открыть итоговую тетрадь →</a>';
  h+='<p class="fine">К записи и вопросам можно вернуться в любое время.</p>';
  box.innerHTML=h;if(focus)box.focus();}
 $('#complete-lesson').addEventListener('click',()=>{const f=$('#completion-status');
  if(!CourseState.resolved(r,Q.length)){f.className='feedback bad';f.textContent='Сначала разберите все три вопроса шага «Проверим». Ошибки ничего не стоят: после второй попытки откроется подсказка, и вопрос тоже будет считаться разобранным.';return;}
  if(!CourseState.canComplete(r,composed(),check.checked,Q.length)){f.className='feedback bad';f.textContent='Запишите хотя бы одну строку или отметьте, что обдумали вопрос без записи.';return;}
  r.done=true;r.reflection=check.checked;save();f.className='feedback good';f.textContent='Результат сохранён.';completed(true);});
 if(r.done){const f=$('#completion-status');if(f){f.className='feedback good';f.textContent='Урок уже завершён. Можно перечитать и дописать запись.';}}else completionHint();
 completed();
}
$$('[data-search]').forEach(inp=>inp.addEventListener('input',()=>{const query=inp.value.toLocaleLowerCase('ru').trim(),target=inp.dataset.search;let n=0;$$('[data-search-item="'+target+'"]').forEach(el=>{const ok=el.textContent.toLocaleLowerCase('ru').includes(query);el.hidden=!ok;if(ok)n++;});if(target==='lessons')$$('.module').forEach(m=>{m.hidden=!$$('[data-search-item]',m).some(x=>!x.hidden);if(query)m.open=true;});const msg=$('[data-search-status="'+target+'"]');if(msg)msg.textContent=n?'Найдено: '+n:'Ничего не найдено. Попробуйте другое слово.';}));
function download(text,name,type){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$$('[data-export]').forEach(b=>b.addEventListener('click',()=>{const payload={...state,course:'eliora-kabbalah-v2',exportedAt:new Date().toISOString()};download(JSON.stringify(payload,null,2),'eliora-veira-notebook.json','application/json');}));
$$('[data-export-text]').forEach(b=>b.addEventListener('click',()=>{const txt=['Каббала и Таро · Элиора Вейра','Моя учебная тетрадь','',...PROG.flatMap(l=>[l.id+'. '+l.title,isDone(l.id)?'Урок завершён':'В работе',state.notes[l.id]||'(Записи пока нет)','']), 'Мои встречи с Зоаром', ...READING_META.filter(r=>state.readings[r.id]?.note||state.readings[r.id]?.done).flatMap(r=>[r.id+'. '+r.title,state.readings[r.id]?.done?'Прочитано':'В работе',state.readings[r.id]?.note||'', ''])].join('\n');download(txt,'eliora-veira-notebook.txt','text/plain;charset=utf-8');}));
const imp=$('[data-import]');if(imp)imp.addEventListener('change',async()=>{const msg=$('#import-status'),file=imp.files[0];if(!file)return;try{if(file.size>16000000)throw Error('Файл слишком большой.');const raw=JSON.parse(await file.text());const merged=CourseState.merge(state,raw,META);state=merged;save();msg.textContent='Импорт завершён. Уже существовавшие записи сохранены; отличающиеся добавлены ниже.';renderNotebook();renderReadingNotebook();updateReadings();}catch(e){msg.textContent='Импорт не выполнен: '+e.message;}finally{imp.value='';}});
// Notebook: lessons that were started or finished come first; the rest open with «Показать все».
let showAll=false;
const started=l=>{const x=state.lessons[l.id];return !!(state.notes[l.id]||'').trim()||!!x&&(x.done||x.stage>0||Object.keys(x.answers||{}).length>0);};
function renderNotebook(){const container=$('#notebook-items');if(!container)return;
 const list=showAll?PROG:PROG.filter(started),n=PROG.filter(started).length;
 const sum=$('[data-notebook-summary]');if(sum)sum.textContent=showAll?'Показаны все '+PROG.length+' уроков в порядке программы.':n?'Начато или пройдено: '+n+' из '+PROG.length+'. Остальные уроки — по кнопке ниже.':'Пока нет начатых уроков. Первый круг начинается на странице курса; записи появятся здесь сами.';
 const btnAll=$('[data-notebook-all]');if(btnAll){btnAll.textContent=showAll?'Показать только начатые':'Показать все '+PROG.length+' уроков';btnAll.setAttribute('aria-expanded',showAll?'true':'false');}
 container.innerHTML=list.map(l=>'<section class="notebook-item"><h3><a href="'+link(l)+'">'+l.id+'. '+esc(l.title)+'</a></h3><small>'+(isDone(l.id)?'✓ Урок завершён':'Урок ещё не завершён')+'</small><label class="reflection-label" for="note-'+l.id+'">Моя запись к уроку '+l.id+'</label><textarea class="note" maxlength="20000" id="note-'+l.id+'" data-notebook-note="'+l.id+'">'+esc(state.notes[l.id]||'')+'</textarea><small data-saved-status="'+l.id+'"></small></section>').join('');
 $$('[data-notebook-note]').forEach(el=>el.addEventListener('input',()=>{state.notes[el.dataset.notebookNote]=el.value;save();$('[data-saved-status="'+el.dataset.notebookNote+'"]').textContent=storageOK?'Сохранено':'Экспортируйте запись перед закрытием';}));}
$$('[data-notebook-all]').forEach(b=>b.addEventListener('click',()=>{showAll=!showAll;renderNotebook();}));
function readingRecord(id){return state.readings[id]||(state.readings[id]={note:'',done:false});}
function updateReadings(){
 $$('[data-reading-progress]').forEach(el=>{const limit=Number(el.dataset.readingLimit||88),n=READING_META.filter(r=>r.id<=limit&&state.readings[r.id]?.done).length;el.textContent='Прочитано '+n+' из '+limit;});
 $$('[data-reading-first]').forEach(el=>{const n=[1,2,3,4,5,6,7,8].filter(i=>state.readings[i]?.done).length;el.textContent='Первые 8 встреч с Зоаром: '+n+' из 8';});
}
function wireReadingNotes(root=document){
 $$('[data-reading-note]',root).forEach(el=>{const id=el.dataset.readingNote;el.value=state.readings[id]?.note||'';el.addEventListener('input',()=>{readingRecord(id).note=el.value;save();const status=$('[data-reading-status="'+id+'"]',root);if(status)status.textContent=storageOK?'Сохранено в этом браузере':'Экспортируйте запись перед закрытием';});});
 $$('[data-reading-done]',root).forEach(el=>{const id=el.dataset.readingDone;el.checked=state.readings[id]?.done===true;el.addEventListener('change',()=>{readingRecord(id).done=el.checked;save();});});
}
function renderReadingNotebook(){const box=$('#reading-notebook');if(!box)return;
 const found=READING_META.filter(r=>state.readings[r.id]?.note||state.readings[r.id]?.done);
 box.innerHTML=found.length?found.map(r=>'<section class="notebook-item"><h3><a href="'+DATA.root+(r.href?r.href.replace(/^\//,''):'course/reading/'+r.group+'/#reading-'+String(r.id).padStart(2,'0'))+'">'+r.id+'. '+esc(r.title)+'</a></h3><label class="reflection-label" for="reading-note-'+r.id+'">Моя запись</label><textarea class="note" maxlength="20000" id="reading-note-'+r.id+'" data-reading-note="'+r.id+'"></textarea><small data-reading-status="'+r.id+'" role="status"></small><label class="self-check"><input type="checkbox" data-reading-done="'+r.id+'"> Прочитано и обдумано</label></section>').join(''):'<p>Здесь появятся фрагменты, к которым Вы оставили запись или отметили чтение.</p>';
 wireReadingNotes(box);
}
wireReadingNotes();renderReadingNotebook();updateReadings();

renderNotebook();updateProgress();updateCircle();
})();
