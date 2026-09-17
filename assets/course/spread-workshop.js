(function(){
 'use strict';
 const source=document.getElementById('spread-grammar-data');
 if(!source)return;
 const data=JSON.parse(source.textContent),lesson=data.lessons.find(l=>l.id===data.current);
 if(!data.spreadWorkshop||!lesson)return;
 const select=document.getElementById('sw-support'),status=document.getElementById('sw-support-status');
 const modes=['guided','hints','independent'];
 // Assistance preferences contain no writing; all work is kept by the shared notebook.
 const key=data.app+'-support-'+lesson.id;
 let mode=lesson.support,remember=true;
 try{const saved=localStorage.getItem(key);if(modes.includes(saved))mode=saved;}catch{remember=false;}
 function render(){
  select.value=mode;
  document.querySelectorAll('[data-sw-hints]').forEach(n=>n.hidden=mode==='independent');
  document.querySelectorAll('[data-sw-model]').forEach(n=>n.hidden=mode!=='guided');
  const comparison=document.getElementById('comparison');
  // The initial comparison contains model answers, so it follows the same reveal rule.
  if(comparison)comparison.hidden=mode!=='guided';
  document.querySelectorAll('a[href="#comparison"]').forEach(n=>n.hidden=mode!=='guided');
  status.textContent={guided:'Доступны подсказки, разбор и сравнение. Сначала запишите собственную версию и зафиксируйте её.',hints:'Доступны подсказки. Разбор и сравнение скрыты: после своей попытки выберите подробный режим.',independent:'Разбор, подсказки и сравнение скрыты. Сохраните свою работу, затем выберите подробный режим для сопоставления.'}[mode];
  if(!remember)status.textContent+=' Настройка помощи действует до закрытия страницы.';
 }
 select.addEventListener('change',()=>{mode=modes.includes(select.value)?select.value:lesson.support;try{localStorage.setItem(key,mode);}catch{remember=false;}render();});
 select.disabled=false;render();
 document.querySelectorAll('[data-sg-answer]').forEach(n=>n.addEventListener('change',()=>{
  const feedback=document.getElementById('sg-feedback-'+n.dataset.sgAnswer);
  if(feedback)feedback.textContent='';
  document.getElementById('sg-check-status').textContent='Ответ изменён. Проверьте ответы ещё раз.';
 }));
})();
