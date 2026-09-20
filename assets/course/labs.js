'use strict';
/* Stage-2 labs v3 (SPEC §4). One pattern everywhere: task → action → check → an addressed hint that does not
   name the answer → the answer after the second error on the same item → «N из M» → a short success text.
   Markup comes from tools/build_labs.py; each [data-lab3] block carries its data in an inline JSON script.
   Nothing here is saved: labs are practice. Old explorers without data (the atlas) stay in app.js. */
(function(root){
const norm=s=>String(s||'').toLocaleLowerCase('ru').replace(/ё/g,'е');
const reEsc=w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const hasWord=(v,w)=>new RegExp('(^|[^а-яa-z])'+reEsc(w),'i').test(v);
/* Hermit, pass 3: a question the card can answer is about the asker's own next action. Questions about the future,
   about fate or about another person's head are turned back — whatever the lesson data lists, these always are. */
const Q_FUTURE=['когда','точно','обязательно','ждет','ждут','будет','будут','случится','произойдет','суждено','судьба','стоит ли','получится ли','выйдет ли','удастся ли','скоро','ждать','предстоит'];
const Q_MIND=['сможет ли','думает','думают','чувствует','чувствуют','на самом деле','любит ли','полюбит','вернется','хочет ли','скрывает','задумал'];
const Q_START=/^(что|чем|с чего|как|какие|какой|какую|каким|какое|где|на что|о чем|куда|кому|в чем)(?=[^а-яa-z]|$)/;
const Q_ME=/(^|[^а-яa-z])(я|мне|меня|мой|моя|мое|мои|моих|моим|мною|нам|мы|нас|себе|себя)(?=[^а-яa-z]|$)/;
function questionVerdict(text,extraBad){
 const v=norm(text).replace(/^\s*(мой\s+)?вопрос\s*[:：-]?\s*/,'').replace(/^[\s«"„“]+/,'').trim();
 if(!v)return {ok:false,kind:'empty',words:[]};
 const future=[...new Set([...(extraBad||[]).map(norm),...Q_FUTURE])].filter(w=>hasWord(v,w)),mind=Q_MIND.filter(w=>hasWord(v,w));
 if(future.length||mind.length)return {ok:false,kind:mind.length&&!future.length?'mind':'future',words:[...future,...mind]};
 if(!Q_START.test(v)||!Q_ME.test(v))return {ok:false,kind:'start',words:[]};
 return {ok:true,kind:'ok',words:[]};
}
/* Observe: a label («гармония») is not an observation; an action line needs a verb. */
const LABELS=['гармони','терпени','баланс','спокойстви','равновеси','умеренност','покой','умиротвор','мудрост','любов','надежд','счасть','успока','гармониз'];
function obsVerdict(text,labels){
 const v=norm(text).replace(/^\s*вижу\s*[:：-]?\s*/,'').replace(/[«»"„“.!?,;:]/g,' ').trim();
 if(!v)return {ok:false,kind:'empty'};
 const lab=[...(labels||[]).map(norm),...LABELS].find(w=>hasWord(v,w));
 if(lab)return {ok:false,kind:'label',word:v.split(/\s+/).find(x=>x.startsWith(lab))||lab};
 if(/(^|[^а-яa-z])(будет|будут|скоро)(?=[^а-яa-z]|$)/.test(v))return {ok:false,kind:'future',word:v};
 if(v.split(/\s+/).length<2)return {ok:false,kind:'one',word:v};
 return {ok:true,kind:'ok'};
}
const VERB=/[а-я](ть|ться|ти|чь|ет|ит|ут|ют|ат|ят|тся|ется|ится)(?=[^а-яa-z]|$)/;
function verbVerdict(text,labels){
 const v=norm(text).trim();if(!v)return {ok:false,kind:'empty'};
 const lab=[...(labels||[]).map(norm),...LABELS].find(w=>hasWord(v,w));if(lab)return {ok:false,kind:'label',word:lab};
 return VERB.test(v)?{ok:true,kind:'ok'}:{ok:false,kind:'noverb'};
}
/* Pair: a detail word matches its own forms, not the start of a longer word («город» ≠ «городской»). */
const stem=w=>{w=norm(w);return w.length>5?w.slice(0,-2):w.length>3?w.slice(0,-1):w;};
function hasDetail(text,list){const v=norm(text);return (list||[]).some(w=>{const n=norm(w).trim();if(!n)return false;const st=reEsc(stem(n));return new RegExp('(^|[^а-яa-z])'+(n.length<=5?st+'[а-я]{0,3}(?=[^а-яa-z]|$)':st)).test(v);});}
root.CourseLabs={questionVerdict,obsVerdict,verbVerdict,hasDetail};
if(typeof document==='undefined')return;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plural=(n,one,few,many)=>{const a=n%10,b=n%100;return a===1&&b!==11?one:a>=2&&a<=4&&(b<12||b>14)?few:many;};
let COURSE={};try{COURSE=JSON.parse($('#course-data').textContent);}catch(e){}
const SEF=COURSE.sefirot||[],WORLDS=COURSE.worlds||[],LURIA=COURSE.luria||[];
const press=(b,on)=>{b.setAttribute('aria-pressed',on?'true':'false');b.classList.toggle('active',!!on);};
const BADGE=' <span class="lab3-badge">Разобрано с подсказкой — это ничего не отнимает.</span>';
const short=t=>{t=String(t).replace(/^[«"]|[»"]$/g,'');return t.length>60?t.slice(0,57).replace(/\s+\S*$/,'')+'…':t;};

function ui(el,d){
 const fb=$('[data-lab3-feedback]',el),cnt=$('[data-lab3-count]',el);
 return {
  check:$('[data-lab3-check]',el),
  say(html,cls){if(!fb)return;fb.className='lab3-feedback'+(html?' feedback'+(cls?' '+cls:''):'');fb.innerHTML=html||'';},
  count(t){if(cnt)cnt.textContent=t;},
  win(prefix){el.classList.add('is-solved');this.say((prefix?prefix+' ':'')+'<span class="lab3-done"><b>Готово.</b> '+esc(d.success)+'</span>','good');}
 };
}

const KINDS={};

/* ---------------------------------------------------------------- sort: items onto 2–4 shelves */
KINDS.sort=(el,d,u)=>{
 const items=$$('.sort3-item',el),shelves=$$('[data-shelf]',el),M=items.length,miss={},shown=new Set();
 let sel=null,solved=false;
 const where=li=>{const s=li.closest('[data-shelf]');return s?Number(s.dataset.shelf):-1;};
 const k=li=>Number(li.dataset.item),text=li=>$('[data-sort-pick]',li).textContent;
 const left=()=>items.filter(li=>where(li)<0);
 const select=li=>{sel=li;items.forEach(x=>press($('[data-sort-pick]',x),x===li));};
 const status=()=>{const n=left().length;u.count(n?'Осталось разложить: '+n+' из '+M:'Все '+M+' разложены — можно проверить');};
 function explain(li,prefix){const p=$('[data-sort-explain]',li);p.textContent=(prefix||'')+d.items[k(li)].explain;p.hidden=false;}
 items.forEach(li=>{
  $('[data-sort-pick]',li).addEventListener('click',()=>{if(solved||shown.has(k(li)))return;select(li);u.say('');});
  const hb=$('[data-sort-hint]',li),ht=$('[data-sort-hint-text]',li);
  hb.addEventListener('click',()=>{const open=ht.hidden;ht.hidden=!open;hb.setAttribute('aria-expanded',String(open));});
 });
 shelves.forEach(sh=>$('[data-sort-put]',sh).addEventListener('click',()=>{
  if(solved)return;
  if(!sel){u.say('Сначала выберите фразу, затем полку.');return;}
  const li=sel;$('[data-shelf-list]',sh).append(li);
  u.say('«'+esc(short(text(li)))+'» — на полке «'+esc(d.shelves[Number(sh.dataset.shelf)])+'».');
  const next=left()[0]||null;select(next);status();
  (next?$('[data-sort-pick]',next):u.check)?.focus();
 }));
 u.check.addEventListener('click',()=>{
  if(solved)return;
  const n=left().length;if(n){u.say('Сначала разложите все фразы: '+(n===1?'осталась одна':'осталось '+n)+'.','bad');return;}
  const revealed=[];
  items.forEach(li=>{const i=k(li);if(where(li)===d.items[i].shelf||shown.has(i))return;miss[i]=(miss[i]||0)+1;
   if(miss[i]>=2){shown.add(i);li.classList.add('is-shown');$('[data-shelf-list]',shelves[d.items[i].shelf]).append(li);explain(li,'Верная полка — «'+d.shelves[d.items[i].shelf]+'». ');revealed.push(li);}});
  select(null);
  const right=items.filter(li=>where(li)===d.items[k(li)].shelf).length;
  u.count('На своих местах: '+right+' из '+M);
  if(right===M){solved=true;items.forEach(li=>{li.classList.add('is-right');if(!shown.has(k(li)))explain(li);});u.win(shown.size===M?'Раскладка показана.'+BADGE:shown.size?'Часть фраз разобрана с подсказкой — это ничего не отнимает.':'');return;}
  let h='<b>На своих местах: '+right+' из '+M+'.</b> Какие именно — не скажем: откройте «Подсказку» у фраз, в которых сомневаетесь, и переложите их.';
  if(revealed.length)h+=' '+(revealed.length===1?'Одна фраза после второй проверки стоит на своей полке — с пояснением.':'Фразы, не попавшие на место и после второй проверки, стоят на своих полках — с пояснением.');
  u.say(h,'bad');
 });
 status();
};

/* ---------------------------------------------------------------- ordered list: timeline, luria order */
function orderLab(el,d,u,isTimeline){
 const list=$('[data-order]',el),all=()=>$$('.order3-item',list),fixed=li=>li.classList.contains('is-fixed');
 const M=all().filter(li=>!fixed(li)).length,given=new Set();let checks=0,solved=false;
 const title=li=>$('.order3-what',li).textContent;
 const neighbour=(li,dir)=>{let x=dir<0?li.previousElementSibling:li.nextElementSibling;while(x&&fixed(x))x=dir<0?x.previousElementSibling:x.nextElementSibling;return x;};
 function swap(a,b){const m=document.createComment('');list.replaceChild(m,a);list.replaceChild(a,b);list.replaceChild(b,m);}
 function label(){all().forEach(li=>$$('[data-move]',li).forEach(b=>{const dir=Number(b.dataset.move);b.setAttribute('aria-label',(dir<0?'Выше: ':'Ниже: ')+title(li));b.disabled=solved||!neighbour(li,dir);}));}
 list.addEventListener('click',e=>{
  const b=e.target.closest('[data-move]');if(!b||b.disabled)return;
  const li=b.closest('.order3-item'),dir=Number(b.dataset.move),t=neighbour(li,dir);if(!t)return;
  swap(li,t);label();
  const same=$('[data-move="'+dir+'"]',li);(same&&!same.disabled?same:$('[data-move]:not(:disabled)',li))?.focus();
  u.count('«'+short(title(li))+'» — '+(all().indexOf(li)+1)+'-е место из '+all().length);
 });
 const right=()=>all().filter((li,pos)=>!fixed(li)&&Number(li.dataset.i)===pos).length;
 function finish(viaHint){
  solved=true;label();
  all().forEach(li=>$$('.order3-when,.order3-note',li).forEach(x=>{if(x.textContent.trim())x.hidden=false;}));
  u.count('На своих местах: '+M+' из '+M);
  u.win(viaHint?'Верный порядок показан.'+BADGE:'');
 }
 function pairHint(){
  const pos=new Map(all().map((li,p)=>[Number(li.dataset.i),li])),n=all().length;
  for(let i=0;i<n-1;i++){
   const a=pos.get(i),b=pos.get(i+1);if(!a||!b||fixed(a)&&fixed(b)||given.has(i))continue;
   if(all().indexOf(b)!==all().indexOf(a)+1){given.add(i);return [title(a),title(b)];}
  }
  return null;
 }
 u.check.addEventListener('click',()=>{
  if(solved)return;checks++;const n=right();
  if(n===M){finish(false);return;}
  u.count('На своих местах: '+n+' из '+M);
  let h='<b>На своих местах: '+n+' из '+M+'.</b> Какие именно — не скажем. '+(isTimeline?'Рассуждайте по смыслу: что должно было случиться раньше, чтобы следующее стало возможным?':'Прочитайте вопрос под каждым шагом: следующий шаг отвечает на вопрос, который оставил предыдущий.');
  if(checks>=2){const p=pairHint();if(p)h+='<br>Подсказка: «'+esc(p[0])+'» идёт сразу перед «'+esc(p[1])+'».';h+=' <button type="button" class="lab3-inline" data-order-reveal>Показать верный порядок</button>';}
  u.say(h,'bad');
 });
 el.addEventListener('click',e=>{if(!e.target.closest('[data-order-reveal]')||solved)return;all().sort((a,b)=>a.dataset.i-b.dataset.i).forEach(li=>list.append(li));finish(true);list.focus?.();});
 label();u.count('Переставляйте кнопками «выше» и «ниже» справа от строки');
}
KINDS.timeline=(el,d,u)=>orderLab(el,d,u,true);
KINDS['luria-order']=(el,d,u)=>orderLab(el,d,u,false);

/* ---------------------------------------------------------------- Древо: find, place, explore */
function treeBase(el){
 const svg=$('svg.tree3-svg',el),nodes=$$('.tree-node',svg);
 nodes.forEach(n=>{n.dataset.place=n.getAttribute('aria-label');n.setAttribute('aria-pressed','false');});
 const on=(fn)=>nodes.forEach((n,i)=>{n.addEventListener('click',()=>fn(i));n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn(i);}});});
 const name=i=>SEF[i]?SEF[i][0]:'';
 const reveal=(i,cls)=>{nodes[i].classList.add(cls);nodes[i].setAttribute('aria-label',name(i)+', '+(SEF[i]?SEF[i][2]:''));};
 return {svg,nodes,on,name,reveal};
}
KINDS['tree-find']=(el,d,u)=>{
 const {nodes,on,name,reveal}=treeBase(el),tasks=d.tasks||[],M=tasks.length,hide=!!d.hideLabels;
 const stepEl=$('[data-tree-step]',el),taskEl=$('[data-tree-task]',el),det=$('[data-detail]',el),next=$('[data-tree-next]',el);
 taskEl.setAttribute('tabindex','-1');
 let t=0,sel=new Set(),miss=0,solved=0,hinted=0,busy=false;
 const clearSel=()=>{sel.clear();nodes.forEach(n=>{n.classList.remove('active');n.setAttribute('aria-pressed','false');});};
 const counter=()=>u.count('Решено: '+solved+' из '+M+(hinted?' (с подсказкой — '+hinted+')':''));
 function draw(){clearSel();miss=0;busy=false;next.hidden=true;det.innerHTML='';u.say('');
  stepEl.textContent='Задание '+(t+1)+' из '+M;const T=tasks[t];taskEl.textContent=T.prompt+(T.answer.length>1&&!/два круга|оба/i.test(T.prompt)?' Выберите два круга.':'');counter();}
 function done(html){busy=true;clearSel();counter();
  if(t<M-1){u.say(html,'good');next.hidden=false;next.focus();}
  else{t=M;stepEl.textContent='Все задания пройдены';u.win(html);}}
 on(i=>{
  if(busy||t>=M)return;const T=tasks[t],need=T.answer.length,n=nodes[i];
  if(sel.has(i)){sel.delete(i);n.classList.remove('active');n.setAttribute('aria-pressed','false');return;}
  sel.add(i);n.classList.add('active');n.setAttribute('aria-pressed','true');
  if(sel.size<need){u.say('Один круг выбран. Выберите второй.');return;}
  const ok=T.answer.every(a=>sel.has(a));
  if(ok){T.answer.forEach(a=>reveal(a,'is-found'));solved++;done('<b>Верно.</b> '+esc(T.explain));return;}
  miss++;const got=[...sel],part=need>1?got.filter(g=>T.answer.includes(g)).length:0;
  if(miss>=2){T.answer.forEach(a=>reveal(a,'is-shown'));solved++;hinted++;done('<b>Ответ: '+esc(T.answer.map(name).join(' и '))+'.</b> '+esc(T.explain)+BADGE);return;}
  clearSel();
  u.say('<b>Пока нет.</b> '+(hide?'':'Вы выбрали: '+esc(got.map(name).join(' и '))+'. ')+(part?'Один круг из пары выбран верно, второй — нет. ':'')+'<br>Подсказка: '+esc(T.hint)+' <span class="fine">Если и следующий выбор не подойдёт, схема покажет ответ.</span>','bad');
 });
 next.addEventListener('click',()=>{t++;draw();taskEl.focus();});
 draw();
};
KINDS['tree-place']=(el,d,u)=>{
 const {svg,nodes,on,reveal}=treeBase(el),names=$$('[data-name]',el),at=new Array(10).fill(-1),slot=i=>$('.tree-slot',nodes[i]);
 let selName=-1,selNode=-1,checks=0,solved=false;
 function paint(){
  nodes.forEach((n,i)=>{const k=at[i];slot(i).textContent=k>=0?SEF[k][0]:'';n.classList.toggle('is-filled',k>=0);n.classList.toggle('active',i===selNode);n.setAttribute('aria-pressed',i===selNode?'true':'false');
   if(!solved)n.setAttribute('aria-label',n.dataset.place+(k>=0?', стоит имя '+SEF[k][0]:', пусто'));});
  names.forEach(b=>{const k=Number(b.dataset.name);b.hidden=at.includes(k);press(b,k===selName);});
  const left=at.filter(x=>x<0).length;u.count(left?'Расставлено: '+(10-left)+' из 10':'Все десять расставлены — можно проверить');
 }
 function place(i,k){at[i]=k;selName=-1;selNode=-1;nodes.forEach(n=>n.classList.remove('is-wrong'));paint();const nx=names.find(b=>!b.hidden);(nx||u.check).focus();}
 names.forEach(b=>b.addEventListener('click',()=>{if(solved)return;const k=Number(b.dataset.name);if(selNode>=0){place(selNode,k);return;}selName=selName===k?-1:k;paint();u.say(selName>=0?'Имя «'+esc(SEF[k][0])+'» выбрано. Теперь нажмите пустой круг.':'');}));
 on(i=>{
  if(solved)return;
  if(selName>=0){place(i,selName);return;}
  if(at[i]>=0){const k=at[i];at[i]=-1;selName=k;paint();u.say('Имя «'+esc(SEF[k][0])+'» снято с круга. Нажмите другой круг или верните имя в ряд.');return;}
  selNode=selNode===i?-1:i;paint();if(selNode>=0)u.say('Круг выбран. Теперь выберите имя.');
 });
 function finish(viaHint){solved=true;at.forEach((k,i)=>{slot(i).textContent='';reveal(i,viaHint&&k!==i?'is-shown':'is-found');});svg.classList.remove('is-hidden-labels');nodes.forEach(n=>n.classList.remove('active','is-filled'));names.forEach(b=>b.hidden=true);u.count('На своих местах: 10 из 10');u.win(viaHint?'Верная расстановка показана.'+BADGE:'');}
 u.check.addEventListener('click',()=>{
  if(solved)return;const left=at.filter(x=>x<0).length;
  if(left){u.say('Сначала расставьте все десять имён: '+(left===1?'осталось одно':'осталось '+left)+'.','bad');return;}
  checks++;const n=at.filter((k,i)=>k===i).length;
  if(n===10){finish(false);return;}
  u.count('На своих местах: '+n+' из 10');
  let h='<b>На своих местах: '+n+' из 10.</b> Какие именно — не скажем. Подсказка: какие четыре имени стоят на средней линии сверху вниз? Какие три пары стоят на одной высоте — и где щедрость, а где мера?';
  if(checks>=2)h+=' <button type="button" class="lab3-inline" data-tree-reveal>Показать верную расстановку</button>';
  u.say(h,'bad');
 });
 el.addEventListener('click',e=>{if(!e.target.closest('[data-tree-reveal]')||solved)return;const wrong=at.map((k,i)=>k!==i);at.forEach((k,i)=>at[i]=i);solved=true;paint();nodes.forEach((n,i)=>{slot(i).textContent='';reveal(i,wrong[i]?'is-shown':'is-found');});svg.classList.remove('is-hidden-labels');names.forEach(b=>b.hidden=true);u.count('На своих местах: 10 из 10');u.win('Верная расстановка показана.'+BADGE);});
 paint();
};
KINDS['tree-explore']=(el,d,u)=>{
 const {nodes,on}=treeBase(el),det=$('[data-detail]',el),seen=new Set(),groups={top:[0,1,2],mercy:[3,4,5],malkhut:[6,7,8,9]};
 const select=i=>{nodes.forEach((n,j)=>{n.classList.toggle('active',j===i);n.setAttribute('aria-pressed',j===i?'true':'false');});const s=SEF[i];det.innerHTML='<h4>'+esc(s[0]+' · '+s[2])+'</h4><p>'+esc(s[3]+' '+s[4])+'</p>';seen.add(i);u.count('Просмотрено: '+seen.size+' из 10');if(seen.size===10&&!el.classList.contains('is-solved'))u.win('');};
 on(select);
 if(groups[d.group])groups[d.group].forEach(i=>nodes[i].classList.add('is-group'));
 select(Number.isInteger(d.start)?d.start:0);
};

/* ---------------------------------------------------------------- worlds: 4 × 10 grid */
KINDS.worlds=(el,d,u)=>{
 const cells=$$('.w3-cell',el),tasks=d.tasks||[],M=tasks.length,stepEl=$('[data-w-step]',el),taskEl=$('[data-w-task]',el),next=$('[data-w-next]',el),det=$('[data-detail]',el);
 taskEl.setAttribute('tabindex','-1');
 let t=0,miss=0,solved=0,hinted=0,busy=false;
 const cell=(w,s)=>cells.find(c=>Number(c.dataset.w)===w&&Number(c.dataset.s)===s);
 const counter=()=>u.count('Найдено: '+solved+' из '+M+(hinted?' (с подсказкой — '+hinted+')':''));
 function draw(){miss=0;busy=false;next.hidden=true;det.innerHTML='';u.say('');cells.forEach(c=>c.classList.remove('is-wrong','active'));stepEl.textContent='Задание '+(t+1)+' из '+M;taskEl.textContent=tasks[t].prompt;counter();}
 function done(html){busy=true;counter();if(t<M-1){u.say(html,'good');next.hidden=false;next.focus();}else{t=M;stepEl.textContent='Все задания пройдены';u.win(html);}}
 cells.forEach(c=>c.addEventListener('click',()=>{
  if(busy||t>=M)return;const T=tasks[t],w=Number(c.dataset.w),s=Number(c.dataset.s);
  cells.forEach(x=>x.classList.remove('is-wrong','active'));
  if(w===T.world&&s===T.sefira){c.classList.add('is-found');solved++;done('<b>Верно.</b> '+esc(T.explain));return;}
  miss++;c.classList.add('is-wrong');
  const m=w===T.world?'Строку выбрали верно ('+WORLDS[w][0]+'), столбец — нет.':s===T.sefira?'Столбец выбрали верно ('+SEF[s][0]+'), строка — нет.':'Не та строка ('+WORLDS[w][0]+') и не тот столбец ('+SEF[s][0]+').';
  if(miss>=2){cell(T.world,T.sefira).classList.add('is-shown');solved++;hinted++;done('<b>'+esc(m)+'</b> Верная клетка: '+esc(WORLDS[T.world][0])+', '+esc(SEF[T.sefira][0])+'. '+esc(T.explain)+BADGE);return;}
  u.say('<b>'+esc(m)+'</b><br>Подсказка: '+esc(T.hint),'bad');
 }));
 next.addEventListener('click',()=>{t++;draw();taskEl.focus();});
 if(M)draw();
};

/* ---------------------------------------------------------------- letters: 22 in a row, multi-select */
KINDS.letters=(el,d,u)=>{
 const bs=$$('[data-letter3]',el),tasks=d.tasks||[],M=tasks.length,stepEl=$('[data-l-step]',el),taskEl=$('[data-l-task]',el),next=$('[data-l-next]',el);
 const nameOf=c=>{const b=bs.find(x=>x.dataset.letter3===c);return b?b.getAttribute('aria-label'):'';};
 taskEl.setAttribute('tabindex','-1');
 let t=0,miss=0,solved=0,hinted=0,busy=false;
 const counter=()=>u.count('Решено: '+solved+' из '+M+(hinted?' (с подсказкой — '+hinted+')':''));
 function draw(){miss=0;busy=false;next.hidden=true;u.say('');bs.forEach(b=>{press(b,false);b.classList.remove('is-shown');});stepEl.textContent='Задание '+(t+1)+' из '+M;taskEl.textContent=tasks[t].prompt;u.check.disabled=false;counter();}
 function done(html,ans){busy=true;u.check.disabled=true;bs.forEach(b=>{press(b,false);if(ans.includes(b.dataset.letter3))b.classList.add('is-g'+Math.min(t,2));});counter();
  if(t<M-1){u.say(html,'good');next.hidden=false;next.focus();}else{t=M;stepEl.textContent='Все задания пройдены';u.win(html);}}
 bs.forEach(b=>b.addEventListener('click',()=>{if(busy)return;press(b,b.getAttribute('aria-pressed')!=='true');}));
 u.check.addEventListener('click',()=>{
  if(busy||t>=M)return;const T=tasks[t],chosen=bs.filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.letter3);
  if(!chosen.length){u.say('Отметьте буквы, затем нажмите «Проверить».');return;}
  const extra=chosen.filter(c=>!T.answer.includes(c)).length,missing=T.answer.filter(c=>!chosen.includes(c)).length;
  if(!extra&&!missing){solved++;done('<b>Верно.</b> '+esc(T.explain),T.answer);return;}
  miss++;
  if(miss>=2){solved++;hinted++;bs.forEach(b=>{if(T.answer.includes(b.dataset.letter3))b.classList.add('is-shown');});done('<b>Ответ: '+esc(T.answer.map(c=>c+' '+nameOf(c)).join(', '))+'.</b> '+esc(T.explain)+BADGE,T.answer);return;}
  const parts=[];if(extra)parts.push('есть лишнее — '+extra+' '+plural(extra,'буква','буквы','букв'));if(missing)parts.push('не хватает — '+missing+' '+plural(missing,'буквы','букв','букв'));
  u.say('<b>Пока нет: '+esc(parts.join('; '))+'.</b> Каких именно — не скажем.<br>Подсказка: '+esc(T.hint),'bad');
 });
 next.addEventListener('click',()=>{t++;draw();taskEl.focus();});
 if(M)draw();
};

/* ---------------------------------------------------------------- step-by-step images: rose, soul, balance, river */
function stepsLab(el,d,u,onSelect,winOnAll=true){
 const bs=$$('[data-step3]',el),det=$('[data-detail]',el),seen=new Set(),M=bs.length;
 const select=i=>{bs.forEach((b,j)=>press(b,j===i));det.innerHTML='<h4>'+esc(d.steps[i][0])+'</h4><p>'+esc(d.steps[i][1])+'</p>';if(onSelect)onSelect(i);seen.add(i);
  if(winOnAll){u.count('Просмотрено: '+seen.size+' из '+M);if(seen.size===M&&!el.classList.contains('is-solved'))u.win('');}};
 bs.forEach((b,i)=>b.addEventListener('click',()=>select(i)));
 if(M)select(0);
}
// The chosen shape gets .is-on, the others .is-dim: the CSS mutes them by colour, so their names keep 4:1 contrast.
const shapeFocus=el=>i=>$$('svg [data-shape]',el).forEach(n=>{const on=Number(n.dataset.shape)===i;n.classList.toggle('is-on',on);n.classList.toggle('is-dim',!on);});
KINDS.rose=(el,d,u)=>{const svg=$('svg.c-images-rose',el);stepsLab(el,d,u,i=>{if(svg)svg.dataset.focus=(d.shapes||[])[i]||'image';});};
KINDS.balance=(el,d,u)=>stepsLab(el,d,u,shapeFocus(el));
KINDS.river=(el,d,u)=>stepsLab(el,d,u,shapeFocus(el));
KINDS.soul=(el,d,u)=>{
 stepsLab(el,d,u,shapeFocus(el),false);
 const sels=$$('[data-chain]',el),btn=$('[data-chain-check]',el),want=(d.chain||[0,1,1,2]).map(String),names=['нефеш','руах','нешама'];let miss=0,solved=false;
 u.count('Цепочка: пока не собрана');
 btn.addEventListener('click',()=>{
  if(solved)return;const v=sels.map(s=>s.value);
  if(v.some(x=>x==='')){u.say('Заполните все четыре места во фразе.');return;}
  if(v.every((x,i)=>x===want[i])){solved=true;u.count('Цепочка собрана');u.win('');return;}
  miss++;const a=v.map(Number),msgs=[];
  [[a[0],a[1]],[a[2],a[3]]].forEach(([x,y])=>{if(x===y)msgs.push('Ступень не может быть престолом для самой себя.');else if(x>y)msgs.push('Престол — опора снизу: нижняя ступень держит верхнюю, а не наоборот.');else if(y-x===2)msgs.push('Между нефеш и нешамой есть средняя ступень: каждая опирается на соседнюю.');});
  if(!msgs.length&&a[1]!==a[2])msgs.push('Вторая половина фразы продолжает первую: она начинается с той ступени, которой закончилась первая.');
  const text=[...new Set(msgs)].join(' ')||'Проверьте порядок ступеней снизу вверх.';
  if(miss>=2){sels.forEach((s,i)=>s.value=want[i]);solved=true;u.count('Цепочка собрана с подсказкой');u.win('<b>'+esc(text)+'</b> Цепочка: '+names[0]+' — престол для руаха, а руах — престол для нешамы.'+BADGE);return;}
  u.say('<b>Пока нет.</b> '+esc(text)+' <span class="fine">Если и следующая попытка не подойдёт, откроется верная цепочка.</span>','bad');
 });
};

/* ---------------------------------------------------------------- Luria: explore */
KINDS['luria-explore']=(el,d,u)=>{
 const bs=$$('[data-luria]',el),shapes=$$('[data-luria-shape]',el),note=$('[data-luria-note]',el),det=$('[data-detail]',el),seen=new Set();
 // The parts of the drawing are wired in app.js — the atlas carries the same markup. Without it the labels and
 // the legend still stand; only the selection stops working.
 const fig=(globalThis.CourseLuriaFigure||(()=>({step(){}})))(el);
 const select=i=>{bs.forEach((b,j)=>press(b,j===i));shapes.forEach((s,j)=>{if(j===i)s.removeAttribute('hidden');else s.setAttribute('hidden','');});
  fig.step(i);
  const n=(d.notes||[])[i]||'';note.textContent=n;note.hidden=!n;
  const L=LURIA[i]||['','',''];det.innerHTML='<h4>'+esc('Шаг '+(i+1)+'. '+L[0])+'</h4><p><b>'+esc(L[1])+'</b> '+esc(L[2])+'</p>';
  seen.add(i);u.count('Просмотрено: '+seen.size+' из '+bs.length);if(seen.size===bs.length&&!el.classList.contains('is-solved'))u.win('');};
 bs.forEach((b,i)=>b.addEventListener('click',()=>select(i)));
 select(Math.max(0,Math.min(bs.length-1,Number(d.start)||0)));
};

/* ---------------------------------------------------------------- deck: 12 cards into three groups */
const TYPES=['Старший аркан','Придворная','Числовая'];
// Only the ace of a suit carries a caption at the bottom («Ace of Cups»); 2–10 have none — just the
// roman numeral on top — so the reply about «the suit is in the caption» must not be sent for them.
const isAce=c=>/^[wcsp]1$/.test(c||'');
const WHY=[[ '', 'В подписи есть звание и масть, а у старших арканов масти нет.',
  c=>isAce(c)?'У старших арканов нет масти, а здесь внизу стоит «Ace» и масть.'
   :'У старшего аркана внизу стоит имя. Здесь подписи внизу нет — только римская цифра, а масть видна по ряду одинаковых предметов на рисунке.'],
 ['Звания — паж, рыцарь, королева, король — в подписи нет, и масти тоже нет.','','Масть есть, но звания нет: число и туз — не звания.'],
 ['Римская цифра вверху ещё не делает карту числовой: у числовой карты видна масть — ряд одинаковых предметов на рисунке, а внизу либо ничего не написано, либо стоит «Ace» и масть. Здесь внизу стоит имя, и масти в нём нет.','Посмотрите на подпись: паж, рыцарь, королева и король — это звания, а не числа.','']];
const why=(got,want,card)=>{const w=WHY[got][want];return typeof w==='function'?w(card):w;};
KINDS.deck=(el,d,u)=>{
 const cards=$$('[data-card3]',el),groups=$$('[data-type3]',el),cur=$('[data-deck-current]',el),M=cards.length,miss=new Array(M).fill(0),done=new Array(M).fill(0);
 let sel=-1;const name=i=>cards[i].dataset.name||$('.deck3-name',cards[i]).textContent,label=i=>$('.deck3-name',cards[i]).textContent;
 // Russian names would give the group away: until a card is placed it is «Карта N», the name comes after.
 const named=i=>{const n=$('.deck3-name',cards[i]);if(cards[i].dataset.name)n.textContent=cards[i].dataset.name;cards[i].setAttribute('aria-label',name(i));};
 function select(i){sel=i;cards.forEach((c,j)=>press(c,j===i));cur.textContent=i<0?'Выберите карту':'Выбрана '+label(i).replace(/^Карта/,'карта')+'. К какой группе она относится?';}
 const counter=()=>{const n=done.filter(Boolean).length,h=done.filter(x=>x===2).length;u.count('Разложено: '+n+' из '+M+(h?' (с подсказкой — '+h+')':''));return n;};
 cards.forEach((c,i)=>c.addEventListener('click',()=>{if(done[i]){u.say('«'+esc(name(i))+'» уже разложена: '+TYPES[d.cards[i].type].toLowerCase()+'.');return;}select(i);u.say('');}));
 groups.forEach(g=>g.addEventListener('click',()=>{
  if(sel<0){u.say('Сначала выберите карту, затем группу.');return;}
  const i=sel,want=d.cards[i].type,got=Number(g.dataset.type3),mark=$('[data-card3-mark]',cards[i]);
  if(got===want){done[i]=miss[i]?2:1;cards[i].classList.add('is-done');named(i);mark.textContent='✓ '+TYPES[want];u.say('<b>Верно:</b> «'+esc(name(i))+'» — '+esc(TYPES[want].toLowerCase())+'.','good');}
  else{miss[i]++;
   if(miss[i]>=2){done[i]=2;cards[i].classList.add('is-done','is-shown');named(i);mark.textContent=TYPES[want];u.say('<b>Это '+esc(TYPES[want].toLowerCase())+'.</b> '+esc(why(got,want,d.cards[i].card))+BADGE,'good');}
   else{u.say('<b>Пока нет.</b> '+esc(why(got,want,d.cards[i].card))+'<br>Подсказка: '+esc(d.hint||'')+' <span class="fine">Если и вторая попытка не подойдёт, группа откроется.</span>','bad');return;}}
  const n=counter();
  if(n===M){select(-1);cur.textContent='Все карты разложены';u.win('');return;}
  const nx=cards.findIndex((c,j)=>j>i&&!done[j]),to=nx>=0?nx:done.findIndex(x=>!x);select(to);cards[to].focus();
 }));
 select(-1);counter();
};

/* ---------------------------------------------------------------- hermit: three passes over the real card */
KINDS.hermit=(el,d,u)=>{
 const boxes=$$('[data-h-check]',el),verify=$('[data-h-verify]',el),qf=$('[data-h-question]',el),warn=$('[data-h-warn]',el),ask=$('[data-h-ask]',el),bad=((d.question||{}).bad||[]).map(norm);
 let miss=0,seenOK=false,askOK=false;
 const fbEl=[$('[data-h-fb]',el),$('[data-h-fb3]',el)],say=(n,html,cls)=>{const f=fbEl[n];f.className='lab3-feedback'+(html?' feedback'+(cls?' '+cls:''):'');f.innerHTML=html||'';};
 const counter=()=>u.count('Проверено: '+((seenOK?1:0)+(askOK?1:0))+' из 2 — детали и вопрос');
 const marks=()=>boxes.forEach((b,i)=>{const it=d.checklist[i],row=b.closest('[data-h-item]');$('[data-h-mark]',row).textContent=it.present?'есть на карте':'на карте этого нет';row.classList.add(it.present?'is-present':'is-absent');b.disabled=true;});
 const finish=()=>{counter();if(seenOK&&askOK)u.win('');else u.say('');};
 verify.addEventListener('click',()=>{
  if(seenOK)return;const wrong=boxes.filter((b,i)=>b.checked&&!d.checklist[i].present).length,missing=boxes.filter((b,i)=>!b.checked&&d.checklist[i].present).length;
  if(!wrong&&!missing){seenOK=true;marks();say(0,'<b>Верно.</b> Вы отметили только то, что нарисовано. Две строки — из других колод или из воображения: их на этой карте нет.','good');finish();return;}
  miss++;
  const NUM=['','одна','две','три','четыре','пять','шесть'],DET=n=>plural(n,'деталь','детали','деталей'),parts=[];
  if(wrong)parts.push(wrong===1?'одна отмеченная деталь на карте отсутствует':(NUM[wrong]||wrong)+' отмеченные '+DET(wrong)+' на карте отсутствуют');
  if(missing)parts.push(missing===1?'одна деталь, которая на карте есть, не отмечена':(NUM[missing]||missing)+' '+DET(missing)+', которые на карте есть, не отмечены');
  const text=parts.join(', а ');
  if(miss>=2){seenOK=true;marks();say(0,'<b>'+esc(text[0].toUpperCase()+text.slice(1))+'.</b> Теперь у каждой строки отмечено, есть ли она на карте.'+BADGE,'good');finish();return;}
  say(0,'<b>Пока нет: '+esc(text)+'.</b> Каких именно — не скажем. Подсказка: откройте карту крупнее (нажмите на неё) и проверьте каждую строку — можно ли показать эту деталь пальцем?','bad');
 });
 const TRY=' Попробуйте начать с «Что я могу…», «С чего мне начать…» или «Какие сведения мне собрать…».';
 qf.addEventListener('input',()=>{const r=questionVerdict(qf.value,bad);warn.textContent=r.words.length?'В вопросе есть «'+r.words.join('», «')+'»: '+(r.kind==='mind'?'так спрашивают о чужих мыслях и чувствах':'так спрашивают о будущем')+', а карта на это не отвечает.':'';});
 ask.addEventListener('click',()=>{
  const v=qf.value.trim();if(!v){say(1,'Сначала запишите свой вопрос.');qf.focus();return;}
  const r=questionVerdict(v,bad);
  if(!r.ok){askOK=false;const head=r.kind==='start'?'<b>Вопрос пока не о Вашем действии.</b> Карта не объясняет причин и не отвечает за других людей; она помогает выбрать, что сделать Вам.':'<b>Похоже, это вопрос '+(r.kind==='mind'?'о чужих мыслях или чувствах':'о будущем')+'</b> (в нём есть «'+esc(r.words.join('», «'))+'») — карта на него не отвечает.';say(1,head+esc(TRY),'bad');counter();return;}
  askOK=true;say(1,'<b>Вопрос годится:</b> на него можно ответить действием.'+(seenOK?'':' Осталось проверить детали в первом проходе.'),'good');finish();
 });
 counter();
};

/* ---------------------------------------------------------------- observe: «Вижу: …» fields and «В глагол» */
KINDS.observe=(el,d,u)=>{
 const fields=$$('[data-obs]',el),verbBtns=$$('[data-obs-verb]',el),verbs=$$('[data-obs-verbtext]',el),n=fields.length,needVerbs=d.verbs?Math.min(2,n):0;
 const strip=v=>String(v||'').replace(/^\s*вижу\s*[:：-]?\s*/i,'').trim();
 const labels=d.labels||[],open=i=>!verbs[i].closest('.observe3-verb').hidden;
 // «В глагол» opens an empty action field next to the observation: the learner writes the verb, nothing is copied.
 verbBtns.forEach((b,i)=>b.addEventListener('click',()=>{const box=verbs[i].closest('.observe3-verb'),o=box.hidden;box.hidden=!o;b.setAttribute('aria-expanded',String(o));if(o)verbs[i].focus();}));
 const flag=(x,on)=>{x.classList.toggle('is-flagged',!!on);if(on)x.setAttribute('aria-invalid','true');else x.removeAttribute('aria-invalid');};
 const count=()=>{const f=fields.filter(x=>strip(x.value)).length,v=verbs.filter((x,i)=>open(i)&&verbVerdict(x.value,labels).ok&&norm(x.value.trim())!==norm(strip(fields[i].value))).length;u.count('Наблюдений: '+f+' из '+n+(needVerbs?' · глаголов: '+Math.min(v,needVerbs)+' из '+needVerbs:''));return [f,v];};
 [...fields,...verbs].forEach(x=>x.addEventListener('input',()=>{flag(x,false);count();}));
 u.check.addEventListener('click',()=>{
  const [f,v]=count();[...fields,...verbs].forEach(x=>flag(x,false));
  if(f<n){u.say('<b>Пока записано '+f+' из '+n+'.</b> Подсказка: пройдите по рисунку сверху вниз — голова, руки, предметы, ноги, земля и фон. Только то, на что можно указать пальцем.','bad');return;}
  for(const x of fields){const r=obsVerdict(x.value,labels);if(r.ok)continue;flag(x,true);x.focus();
   const w='«'+esc(strip(x.value))+'»';
   u.say(r.kind==='label'?'<b>'+w+' — это ярлык:</b> на него нельзя указать пальцем. Отложите его и запишите, что именно нарисовано: руки, вода, ноги, свет?':r.kind==='future'?'<b>'+w+' — это не наблюдение, а ожидание.</b> Карта ничего не обещает; запишите, что на ней видно.':'<b>'+w+' — пока одно слово.</b> Допишите, что именно видно: где это, что делает, что держит?','bad');return;}
  for(let i=0;i<verbs.length;i++){if(!open(i)||!verbs[i].value.trim())continue;const r=verbVerdict(verbs[i].value,labels);if(r.ok)continue;flag(verbs[i],true);verbs[i].focus();
   u.say(r.kind==='label'?'<b>В действии снова ярлык.</b> Глагол должен описывать то, что делают на рисунке: «переливать», «стоять», «держать».':'<b>Здесь пока нет глагола.</b> Запишите действие: кто что делает — «переливает», «стоит одной ногой в воде».','bad');return;}
  if(v<needVerbs){u.say('<b>Наблюдений достаточно.</b> Теперь выберите '+(needVerbs-v===1?'ещё одно':'два')+' и нажмите «В глагол»: запишите в новом поле действие — кто что делает.','bad');return;}
  u.win('');
 });
 count();
};

/* ---------------------------------------------------------------- pair: two orders, details of both cards */
KINDS.pair=(el,d,u)=>{
 const fields=$$('[data-pair]',el),miss=[0,0];let solved=false;
 const has=hasDetail;
 const names=[[d.nameA,d.nameB],[d.nameB,d.nameA]];
 u.check.addEventListener('click',()=>{
  if(solved)return;const msgs=[];let ok=0;
  fields.forEach((f,k)=>{const v=f.value.trim(),A=has(v,d.detailsA),B=has(v,d.detailsB),head='«'+names[k][0]+' → '+names[k][1]+'»: ';
   if(!v){msgs.push(head+'фраза пока пустая.');return;}
   if(A&&B){ok++;return;}
   miss[k]++;const lack=[!A?'«'+d.nameA+'»':'',!B?'«'+d.nameB+'»':''].filter(Boolean).join(' и ');
   msgs.push(head+'не видно детали с карты '+lack+'.'+(miss[k]>=2?' Например, на карте «'+d.nameA+'»: '+(d.detailsA||[]).slice(0,3).join(', ')+'; на карте «'+d.nameB+'»: '+(d.detailsB||[]).slice(0,3).join(', ')+'.':' Назовите то, что нарисовано, а не только имя карты.'));});
  u.count('Фраз с деталями обеих карт: '+ok+' из 2');
  if(ok===2){solved=true;u.win('');return;}
  u.say(msgs.map(esc).join('<br>'),'bad');
 });
 u.count('Фраз с деталями обеих карт: 0 из 2');
};

function setup(el){
 let d;try{d=JSON.parse($('[data-lab3-data]',el).textContent);}catch(e){return;}
 const pristine=el.cloneNode(true),fn=KINDS[el.dataset.lab3];if(!fn)return;
 $('[data-lab3-reset]',el)?.addEventListener('click',()=>{const fresh=pristine.cloneNode(true);el.replaceWith(fresh);setup(fresh);$('button:not([hidden]):not(:disabled),[tabindex="0"]',fresh)?.focus();});
 fn(el,d,ui(el,d));
}
$$('[data-lab3]').forEach(setup);
})(typeof module==='object'?module.exports:globalThis);
