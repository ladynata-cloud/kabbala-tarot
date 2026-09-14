'use strict';
(() => {
 const controls=document.querySelector('[data-catalog-controls]');if(!controls)return;
 const $=s=>document.querySelector(s),all=Array.from(document.querySelectorAll('[data-quote-id]'));
 const search=$('#quote-search'),topic=$('#quote-topic'),source=$('#quote-source'),status=$('#quote-status'),pageSelect=$('#quote-page');
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('ru').replaceAll('ё','е');
 const entries=all.map(el=>({el,id:el.dataset.quoteId,topics:el.dataset.quoteTopics.split(' '),source:el.dataset.quoteSource,kind:el.dataset.quoteKind,text:normalize(el.querySelector('blockquote').textContent+' '+el.querySelector('header').textContent)}));
 let page=1,filtered=[];const perPage=16;
 const isDone=e=>e.el.querySelector('[data-reading-done]').checked;
 const hasNote=e=>e.el.querySelector('[data-reading-note]').value.trim().length>0;
 function draw(scroll=false){
  const words=normalize(search.value.trim()).split(/\s+/).filter(Boolean),exact=/^\d+$/.test(search.value.trim())?Number(search.value.trim()):null;
  filtered=entries.filter(e=>(exact!==null?Number(e.id)===exact:words.every(w=>e.text.includes(w)))&&(topic.value==='all'||e.topics.includes(topic.value))&&(source.value==='all'||e.source===source.value)&&(status.value==='all'||status.value==='read'&&isDone(e)||status.value==='unread'&&!isDone(e)||status.value==='notes'&&hasNote(e)||status.value==='guided'&&e.kind==='guided'));
  const pages=Math.ceil(filtered.length/perPage);page=Math.max(1,Math.min(page,pages||1));all.forEach(el=>el.hidden=true);
  filtered.slice((page-1)*perPage,page*perPage).forEach(e=>e.el.hidden=false);
  $('[data-quote-count]').textContent=filtered.length?'Найдено '+filtered.length+' из 888. Показаны '+((page-1)*perPage+1)+'–'+Math.min(page*perPage,filtered.length)+'.':'Найдено 0 из 888.';
  $('[data-quote-empty]').hidden=filtered.length>0;$('[data-quote-pagination]').hidden=pages<2;
  pageSelect.replaceChildren(...Array.from({length:pages},(_,i)=>new Option(String(i+1),String(i+1),false,i+1===page)));
  $('[data-quote-pages]').textContent='из '+pages;$('[data-quote-prev]').disabled=page<=1;$('[data-quote-forward]').disabled=page>=pages;
  if(scroll){$('#catalog-results').focus({preventScroll:true});$('#catalog-results').scrollIntoView({block:'start'});}
 }
 function updateURL(){const u=new URL(location.href);for(const [k,v] of [['q',search.value.trim()],['topic',topic.value],['book',source.value],['status',status.value]]){if(v&&v!=='all')u.searchParams.set(k,v);else u.searchParams.delete(k);}u.hash='';history.replaceState(null,'',u);}
 function reset(){search.value='';topic.value='all';source.value='all';status.value='all';page=1;}
 function filtersChanged(){page=1;updateURL();draw();}
 search.addEventListener('input',filtersChanged);[topic,source,status].forEach(el=>el.addEventListener('change',filtersChanged));
 $('[data-quote-reset]').addEventListener('click',()=>{reset();updateURL();draw();search.focus();});
 $('[data-quote-prev]').addEventListener('click',()=>{page--;draw(true);});$('[data-quote-forward]').addEventListener('click',()=>{page++;draw(true);});
 pageSelect.addEventListener('change',()=>{page=Number(pageSelect.value);draw(true);});
 function reveal(){const m=location.hash.match(/^#reading-(\d+)$/);if(!m)return;const e=entries.find(e=>Number(e.id)===Number(m[1]));if(!e)return;reset();draw();page=Math.floor(entries.indexOf(e)/perPage)+1;draw();e.el.scrollIntoView({block:'start'});e.el.classList.add('quote-highlight');setTimeout(()=>e.el.classList.remove('quote-highlight'),2500);}
 $('[data-quote-next]').addEventListener('click',()=>{const e=filtered.find(e=>!isDone(e));if(e){page=Math.floor(filtered.indexOf(e)/perPage)+1;draw();const u=new URL(location.href);u.hash='reading-'+String(e.id).padStart(2,'0');history.replaceState(null,'',u);e.el.scrollIntoView({block:'start'});}else $('[data-quote-count]').textContent='В выбранной подборке всё прочитано. Можно выбрать другую тему.';});
 document.addEventListener('change',e=>{if(e.target.matches('[data-reading-done]')&&['read','unread'].includes(status.value))draw();});
 document.addEventListener('focusout',e=>{if(e.target.matches('[data-reading-note]')&&status.value==='notes')draw();});
 addEventListener('hashchange',reveal);
 const params=new URLSearchParams(location.search);search.value=params.get('q')||'';
 for(const [el,key] of [[topic,'topic'],[source,'book'],[status,'status']]){const v=params.get(key);if(v&&Array.from(el.options).some(o=>o.value===v))el.value=v;}
 controls.hidden=false;draw();reveal();
})();
