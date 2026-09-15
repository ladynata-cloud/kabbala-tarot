(function () {
  'use strict';
  const payload = document.getElementById('tarot-pairs-data');
  if (!payload || !window.TarotPairs) return;
  const {cards,method} = JSON.parse(payload.textContent), P = window.TarotPairs;
  const $ = id => document.getElementById(id), $$ = q => [...document.querySelectorAll(q)];
  const STORAGE = 'eliora-tarot-pairs-v1', SELECTION = 'eliora-tarot-pairs-selection-v1';
  const byId = Object.fromEntries(cards.map(c=>[c.id,c]));
  let notes = Object.create(null), storageOK = true, state, note, analysis, step = 0, example = null, shown = 12;
  function el(tag, text, className) { const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node; }
  function group(title,text) { const box=el('div');box.append(el('h3',title),el('p',text));return box; }
  function labelState(s) { return byId[s.a].name+(s.ra?' (перев.)':'')+(s.order==='pair'?' + ':' → ')+byId[s.b].name+(s.rb?' (перев.)':''); }
  function format(n) { return n.toLocaleString('ru-RU'); }
  function pack() { return {app:'eliora-tarot-pairs',version:1,notes:Object.values(notes)}; }
  try { const saved=localStorage.getItem(STORAGE);if(saved) notes=P.readNotebook(JSON.parse(saved),cards); }
  catch {storageOK=false;$('pair-save-status').textContent='Сохранение в браузере недоступно или прежний файл повреждён. Работайте здесь и скачайте тетрадь перед закрытием страницы.';}
  function stateFromURL() {
    const p=new URLSearchParams(location.search);
    if(!p.has('a')&&!p.has('b'))return null;
    const candidate={a:p.get('a'),b:p.get('b'),order:p.get('order'),reversals:p.get('rev')==='1',ra:p.get('ra')==='1',rb:p.get('rb')==='1',lens:p.get('lens')};
    if(!byId[candidate.a]||!byId[candidate.b]||candidate.a===candidate.b) $('pair-message').textContent='В ссылке была недоступная или повторяющаяся карта. Выбрана допустимая пара.';
    return candidate;
  }
  let initial=stateFromURL();
  if(!initial)try {initial=JSON.parse(localStorage.getItem(SELECTION)||'null');}catch{}
  state=P.normalize(initial||{},cards);
  function updateURL() {
    const p=new URLSearchParams({a:state.a,b:state.b,order:state.order,lens:state.lens});
    if(state.reversals){p.set('rev','1');p.set('ra',state.ra?'1':'0');p.set('rb',state.rb?'1':'0');}
    try{history.replaceState(null,'',location.pathname+'?'+p.toString()+location.hash);}catch{}
    try{localStorage.setItem(SELECTION,JSON.stringify(state));}catch{}
  }
  function persist() {
    if(storageOK)try {localStorage.setItem(STORAGE,JSON.stringify(pack()));$('pair-save-status').textContent='Запись сохранена в этом браузере. Автор курса её не получает.';}
    catch {storageOK=false;}
    if(!storageOK)$('pair-save-status').textContent='Запись сейчас хранится только на открытой странице. Скачайте тетрадь перед закрытием: сохранение в браузере недоступно.';
    $('pair-notebook-count').textContent='('+Object.keys(notes).length+')';
  }
  function saveCurrent() {
    if(!note)return;
    note.state={...state};note.updated=new Date().toISOString();
    const k=P.key(state,cards);
    if(P.hasWork(note))notes[k]=structuredClone(note);else delete notes[k];
    persist();
  }
  function selectStep(index,focus=false) {
    step=index;
    $$('[data-pair-tab]').forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;$('pair-step-'+i).hidden=i!==index;});
    if(focus)$('pair-tab-'+index).focus();
  }
  function renderCard(meta,reversed,role) {
    const card=meta.card,article=el('article',undefined,'pair-card');
    const figure=el('div',undefined,'pair-card-image');
    const link=el('a');link.href=card.imageSource;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Открыть изображение: '+card.name);
    const img=el('img');img.src=card.image;img.alt=card.name+(reversed?' — перевёрнутая':'');img.width=120;img.height=208;img.decoding='async';if(reversed)img.classList.add('is-reversed');
    const fallback=el('span','Изображение не загрузилось. Открыть оригинал','pair-image-fallback');fallback.hidden=true;
    img.addEventListener('error',()=>{img.hidden=true;fallback.hidden=false;});link.append(img,fallback);figure.append(link);
    const text=el('div',undefined,'pair-card-text');text.append(el('p',role,'pair-role'),el('h2',card.name),el('p',meta.profile.principle,'pair-principle'));
    if(state.reversals)text.append(el('p',reversed?'Перевёрнутое положение':'Прямое положение','pair-orientation'));
    const atlas=el('a','Описание в атласе');atlas.href='../tarot/#card-'+card.id;text.append(atlas);article.append(figure,text);return article;
  }
  function renderMeta(meta) {
    const block=el('article',undefined,'pair-meta');block.append(el('p',meta.title,'pair-role'),el('h3',meta.card.name));
    const table=el('table');const caption=el('caption','Соответствия карты '+meta.card.name,'sr-only');table.append(caption);
    for(const [label,value] of meta.rows){const tr=el('tr'),th=el('th',label),td=el('td',value);th.scope='row';tr.append(th,td);table.append(tr);}
    block.append(table,el('p',meta.question,'pair-meta-question'));return block;
  }
  function renderStates(meta) {
    const block=el('article');block.append(el('h3',meta.card.name));
    const dl=el('dl');
    for(const [label,phrase] of [['Соразмерно','Возможная задача: '+meta.profile.action],['Недостаток',meta.profile.lack],['Избыток',meta.profile.excess],['Искажение',meta.profile.distortion]])dl.append(el('dt',label),el('dd',phrase));
    block.append(dl);return block;
  }
  function conditionFeedback() {
    const phrases=[];
    for(const [side,m] of [['A',analysis.a],['B',analysis.b]]) {
      const choice=note['condition'+side];
      if(choice==='open')continue;
      phrases.push(m.card.name+': '+(choice==='balanced'?'возможное действие — '+m.profile.action:m.profile[choice])+'.');
    }
    $('pair-condition-feedback').textContent=phrases.length?phrases.join(' ')+' Какие обстоятельства поддерживают эту гипотезу?':'';
  }
  function loadInputs() {
    $$('[data-note]').forEach(input=>{input.value=note[input.dataset.note]||'';});
    $$('[data-self-check]').forEach(input=>{input.checked=note.checks.includes(input.dataset.selfCheck);});
    conditionFeedback();
  }
  function render() {
    analysis=P.analyze(state,cards,method);state=analysis.state;
    const third=['p6',...cards.map(c=>c.id)].find(id=>id!==state.a&&id!==state.b);
    $('pair-to-triples').href='../tarot-triples/?'+new URLSearchParams({a:state.a,b:state.b,c:third,order:state.order==='pair'?'group':'sequence',lens:state.order==='pair'?'system':'mediation',rev:state.reversals?'1':'0',ra:state.ra?'1':'0',rb:state.rb?'1':'0',rc:'0'});
    note=structuredClone(notes[P.key(state,cards)]||P.emptyNote({...state}));
    $('pair-a').value=state.a;$('pair-b').value=state.b;
    for(const option of $('pair-a').options)option.disabled=option.value===state.b;
    for(const option of $('pair-b').options)option.disabled=option.value===state.a;
    $('pair-order').value=state.order;$('pair-lens').value=state.lens==='aspects'?'development':state.lens;
    $('pair-lens-label').hidden=state.order==='pair';$('pair-reversals').checked=state.reversals;
    $$('.orientation').forEach(label=>{label.hidden=!state.reversals;});$('pair-ra').value=state.ra?'1':'0';$('pair-rb').value=state.rb?'1':'0';
    $('pair-swap').disabled=state.order==='pair';$('pair-swap').title=state.order==='pair'?'В паре без порядка перестановка ничего не меняет':'';
    const total=P.count(state.order,state.reversals,cards.length);
    $('pair-count').textContent='78 карт · '+format(total)+(state.reversals?' вариантов с положениями карт':state.order==='pair'?' пар без порядка':' последовательностей')+' · без повторения одной карты';
    $('pair-index').max=String(total);$('pair-index').value=String(P.indexOf(state,cards)+1);$('pair-total').textContent='из '+format(total);
    $('pair-tableau').replaceChildren(renderCard(analysis.a,state.ra,analysis.roles[0]),renderCard(analysis.b,state.rb,analysis.roles[1]));
    $('pair-order-help').textContent=state.order==='pair'?'Пара без порядка: А + Б и Б + А — одно упражнение и одна запись. Для чтения перехода включите последовательность.':'Читаем слева направо. '+analysis.roles[0]+' → '+analysis.roles[1]+'. Это выбранное правило упражнения.';
    $('pair-observation-hints').replaceChildren(...[analysis.a,analysis.b].map(m=>{const n=group(m.card.name,m.card.scene);n.append(el('p',m.card.reading),el('p',m.card.question));return n;}));
    $('pair-correspondences').replaceChildren(renderMeta(analysis.a),renderMeta(analysis.b));
    $('pair-structure').replaceChildren(el('h3',analysis.structure.title),el('p',analysis.structure.text),el('p',analysis.structure.question,'pair-prompt'));
    $('pair-elements').replaceChildren(el('h3',analysis.suits.title),el('p',analysis.suits.text));
    $('pair-states').replaceChildren(renderStates(analysis.a),renderStates(analysis.b));
    $('pair-orientation-help').textContent=state.reversals?'Перевёрнутость — условный сигнал проверить способ проявления. Она не выбирает автоматически недостаток, избыток или искажение. Буква, сефира и мир карты сохраняются.':'Сейчас положение карт не учитывается. Способ проявления всё равно можно рассмотреть через вопрос, позиции и взаимодействие.';
    $('pair-frame').textContent=analysis.frame;
    $('pair-reverse-block').hidden=state.order==='pair';
    $('pair-reverse-reading').replaceChildren(group(analysis.a.card.name+' → '+analysis.b.card.name,analysis.frame),group(analysis.b.card.name+' → '+analysis.a.card.name,analysis.reverseFrame));
    $('pair-review-result').textContent='';$('pair-share-status').textContent='';
    loadInputs();updateURL();renderNotebook();renderExample();
  }
  function transition(next,keepExample=false) {
    saveCurrent();if(!keepExample)example=null;
    state=P.normalize(next,cards);render();$('pair-message').textContent='Выбрано: '+labelState(state)+'.';
    if(storageOK)$('pair-save-status').textContent=notes[P.key(state,cards)]?'Сохранённая запись этого сочетания открыта.':'Для этого сочетания можно начать новую запись. Она сохранится в этом браузере.';
  }
  function renderExample() {
    const box=$('pair-example-answer');box.hidden=example===null;box.open=false;
    if(example===null)return;
    const ex=method.examples[example];
    $('pair-example-content').replaceChildren(el('p',ex.question),group(byId[ex.a].name+' → '+byId[ex.b].name,ex.forward),group(byId[ex.b].name+' → '+byId[ex.a].name,ex.reverse),el('p',ex.reason),el('p','Проверьте себя: '+ex.trap,'pair-prompt'));
  }
  function renderNotebook() {
    const q=$('pair-note-search').value.toLocaleLowerCase('ru');
    const list=Object.values(notes).sort((a,b)=>b.updated.localeCompare(a.updated)).filter(n=>(labelState(n.state)+' '+P.TEXT_FIELDS.map(f=>n[f]).join(' ')).toLocaleLowerCase('ru').includes(q));
    $('pair-notebook-count').textContent='('+Object.keys(notes).length+')';
    const box=$('pair-note-list');box.replaceChildren();
    for(const n of list.slice(0,shown)) {
      const item=el('article'),button=el('button',labelState(n.state),'pair-note-open');button.type='button';
      button.addEventListener('click',()=>{transition(n.state);selectStep(0);$('pair-a').focus();});
      item.append(button,el('p',P.LENSES[n.state.lens].label+' · '+(n.question||'Вопрос пока не записан')));box.append(item);
    }
    if(!list.length)box.append(el('p',q?'Записей по этому запросу нет.':'Разборы появятся здесь, когда Вы начнёте записывать свои наблюдения.'));
    $('pair-note-more').hidden=list.length<=shown;
  }
  function download(name,text,type) {
    const url=URL.createObjectURL(new Blob([text],{type}));const a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $$('[data-note]').forEach(input=>input.addEventListener('input',()=>{note[input.dataset.note]=input.value;saveCurrent();conditionFeedback();$('pair-review-result').textContent='';}));
  $$('[data-self-check]').forEach(input=>input.addEventListener('change',()=>{note.checks=$$('[data-self-check]:checked').map(c=>c.dataset.selfCheck);saveCurrent();$('pair-review-result').textContent='';}));
  $$('[data-pair-tab]').forEach((tab,index)=>{tab.addEventListener('click',()=>selectStep(index));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(step+1)%4;if(event.key==='ArrowLeft')next=(step+3)%4;if(event.key==='Home')next=0;if(event.key==='End')next=3;if(next!==undefined){event.preventDefault();selectStep(next,true);}});});
  $$('[data-pair-next]').forEach(button=>button.addEventListener('click',()=>selectStep(Number(button.dataset.pairNext),true)));
  $('pair-a').addEventListener('change',()=>transition({...state,a:$('pair-a').value}));$('pair-b').addEventListener('change',()=>transition({...state,b:$('pair-b').value}));
  $('pair-order').addEventListener('change',()=>transition({...state,order:$('pair-order').value}));$('pair-lens').addEventListener('change',()=>transition({...state,lens:$('pair-lens').value}));
  $('pair-reversals').addEventListener('change',()=>transition({...state,reversals:$('pair-reversals').checked}));
  $('pair-ra').addEventListener('change',()=>transition({...state,ra:$('pair-ra').value==='1'}));$('pair-rb').addEventListener('change',()=>transition({...state,rb:$('pair-rb').value==='1'}));
  $('pair-swap').addEventListener('click',()=>transition(P.reverse(state,cards)));
  $('pair-random').addEventListener('click',()=>transition(P.pairAt(Math.floor(Math.random()*P.count(state.order,state.reversals,cards.length)),state,cards)));
  $('pair-prev').addEventListener('click',()=>transition(P.pairAt(P.indexOf(state,cards)-1,state,cards)));$('pair-next').addEventListener('click',()=>transition(P.pairAt(P.indexOf(state,cards)+1,state,cards)));
  function goIndex(){const value=Number($('pair-index').value),total=P.count(state.order,state.reversals,cards.length);if(!Number.isInteger(value)||value<1||value>total){$('pair-message').textContent='Введите целый номер от 1 до '+format(total)+'.';return;}transition(P.pairAt(value-1,state,cards));}
  $('pair-go').addEventListener('click',goIndex);$('pair-index').addEventListener('keydown',event=>{if(event.key==='Enter')goIndex();});
  $$('[data-pair-example]').forEach(button=>button.addEventListener('click',()=>{example=Number(button.dataset.pairExample);const ex=method.examples[example];transition({a:ex.a,b:ex.b,order:'sequence',lens:ex.lens,reversals:false},true);if(!note.question){note.question=ex.question;loadInputs();saveCurrent();}selectStep(0);$('pair-message').textContent='Открыто упражнение «'+ex.title+'». Сначала попробуйте свой разбор; объяснение доступно под списком примеров.';$('pair-a').focus();}));
  $('pair-review').addEventListener('click',()=>{
    const needed=[['question','вопрос'],['observationA','наблюдение по карте А'],['observationB','наблюдение по карте Б'],['connection','связь между картами'],['evidence','основание связи'],['alternative','другое возможное прочтение'],['conclusion','итог']].filter(([k])=>!note[k].trim()).map(([,label])=>label);
    const unchecked=P.CHECKS.length-note.checks.length;
    $('pair-review-result').textContent=needed.length?'Ещё можно добавить: '+needed.join(', ')+'.':unchecked?'Все текстовые опоры заполнены. Вернитесь к '+unchecked+' пунктам самооценки и решите, можете ли их подтвердить.':'Все опоры заполнены, четыре пункта самооценки отмечены. Теперь перечитайте итог: отвечает ли он на поставленный вопрос?';
    saveCurrent();
  });
  $('pair-share').addEventListener('click',async()=>{updateURL();try{await navigator.clipboard.writeText(location.href);$('pair-share-status').textContent='Ссылка скопирована. В ней только карты и режим; личные записи не включены.';}catch{$('pair-share-status').replaceChildren(el('span','Скопируйте ссылку: '));const input=el('input');input.value=location.href;input.readOnly=true;input.setAttribute('aria-label','Ссылка на сочетание');$('pair-share-status').append(input);input.focus();input.select();}});
  $('pair-note-search').addEventListener('input',()=>{shown=12;renderNotebook();});$('pair-note-more').addEventListener('click',()=>{shown+=12;renderNotebook();});
  document.querySelector('#pair-notebook details').addEventListener('toggle',renderNotebook);
  $('pair-export').addEventListener('click',()=>{saveCurrent();download('tarot-pairs-notebook.json',JSON.stringify(pack(),null,2),'application/json;charset=utf-8');});
  $('pair-export-text').addEventListener('click',()=>{saveCurrent();const labels=['Вопрос','Наблюдение А','Наблюдение Б','Связь','Основание','Альтернатива','Итог'];const text=Object.values(notes).map(n=>labelState(n.state)+'\n'+P.LENSES[n.state.lens].label+'\n\n'+P.TEXT_FIELDS.map((k,i)=>labels[i]+':\n'+(n[k]||'—')).join('\n\n')+'\n\nПроявление А: '+P.CONDITION_LABELS[n.conditionA]+'\nПроявление Б: '+P.CONDITION_LABELS[n.conditionB]).join('\n\n────────────────────\n\n');download('tarot-pairs-notebook.txt','Мои разборы пар Таро\n\n'+(text||'Записей пока нет.'),'text/plain;charset=utf-8');});
  $('pair-import').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try {if(file.size>20*1024*1024)throw Error('Файл больше 20 МБ. Выберите тетрадь конструктора меньшего размера.');const incoming=P.readNotebook(JSON.parse(await file.text()),cards);saveCurrent();const merged=P.mergeNotes(notes,incoming);notes=merged;persist();render();$('pair-import-status').textContent='Импортировано записей: '+Object.keys(incoming).length+'. Существовавшие тексты сохранены; отличающиеся варианты добавлены к ним.';}
    catch(error){$('pair-import-status').textContent=error instanceof SyntaxError?'Файл не удалось прочитать как JSON. Тетрадь не изменена.':error.message;}
    event.target.value='';
  });
  window.addEventListener('storage',event=>{
    if(event.key!==STORAGE||!event.newValue)return;
    try{notes=P.mergeNotes(notes,P.readNotebook(JSON.parse(event.newValue),cards));note=structuredClone(notes[P.key(state,cards)]||note);loadInputs();renderNotebook();$('pair-save-status').textContent='Учтены записи из другой вкладки. Отличающиеся тексты сохранены вместе.';}catch{$('pair-save-status').textContent='Не удалось объединить запись другой вкладки. Скачайте текущую тетрадь перед закрытием.';}
  });
  window.addEventListener('popstate',()=>{const parsed=stateFromURL();if(parsed)transition(parsed);});
  window.addEventListener('pagehide',saveCurrent);
  render();selectStep(0);$('pair-app').hidden=false;
})();
