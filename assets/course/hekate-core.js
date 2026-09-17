/* Local notebook format is deliberately independent of the other course lines. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HekateState=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FORMAT='eliora-hekate',VERSION=1,FIELDS=['before','confidence','draft','revision','transfer','recall'];
const empty=()=>({format:FORMAT,version:VERSION,entries:{}});
function validDate(v){return typeof v==='string'&&v.length<40&&Number.isFinite(Date.parse(v));}
function parse(raw){
 const d=typeof raw==='string'?JSON.parse(raw):raw;
 if(!d||d.format!==FORMAT||d.version!==VERSION||!d.entries||typeof d.entries!=='object'||Array.isArray(d.entries))throw Error('Это не тетрадь линии Гекаты версии 1. Выберите JSON, скачанный в этом разделе.');
 const out=empty();
 for(const [id,e] of Object.entries(d.entries)){
  if(!/^(?:[1-9]|1[0-9]|2[0-8])$/.test(id)||!e||typeof e!=='object'||Array.isArray(e))throw Error('В файле есть неизвестное занятие или повреждённая запись.');
  const t={};
  for(const f of FIELDS){if(e[f]!==undefined){if(typeof e[f]!=='string'||e[f].length>150000)throw Error('Запись имеет неподдерживаемый формат или слишком велика.');t[f]=e[f];}}
  if(t.confidence&&!['low','medium','high'].includes(t.confidence))throw Error('Неизвестная оценка уверенности.');
  if(e.done!==undefined&&typeof e.done!=='boolean')throw Error('Повреждена отметка занятия.');
  t.done=!!e.done;
  for(const f of ['completed','due','updated','reviewed']){if(e[f]!==undefined){if(!validDate(e[f]))throw Error('Повреждена дата записи.');t[f]=e[f];}}
  if(e.stage!==undefined){if(!Number.isInteger(e.stage)||e.stage<0||e.stage>3)throw Error('Повреждён шаг повторения.');t.stage=e.stage;}
  out.entries[id]=t;
 }
 return out;
}
function merge(a,b){
 const out=parse(a),incoming=parse(b);
 for(const [id,e] of Object.entries(incoming.entries)){
  const old=out.entries[id]||{},next={...old};
  for(const f of FIELDS){const v=e[f]||'';if(!v)continue;if(!next[f])next[f]=v;else if(f!=='confidence'&&next[f]!==v&&!next[f].includes(v))next[f]+='\n\n[Импортированная версия]\n'+v;}
  next.done=!!(old.done||e.done);
  for(const f of ['completed','due','updated','reviewed','stage'])if(next[f]===undefined&&e[f]!==undefined)next[f]=e[f];
  out.entries[id]=next;
 }
 return out;
}
function after(days,now=Date.now()){return new Date(now+days*86400000).toISOString();}
function complete(e,done,now=Date.now()){const r={...e,done,updated:new Date(now).toISOString()};if(done&&!r.completed){r.completed=r.updated;r.stage=0;r.due=after(1,now);}return r;}
function review(e,remembered,now=Date.now()){
 const r={...e,reviewed:new Date(now).toISOString(),updated:new Date(now).toISOString()};
 if(remembered){r.stage=Math.min(3,(e.stage||0)+1);r.due=after(r.stage===1?3:7,now);}else{r.stage=0;r.due=after(1,now);}return r;
}
function toText(d,lessons){let s='Геката: источники, каббала и Таро\nЛичная тетрадь\n\n';const labels={before:'Первый ответ',confidence:'Уверенность',draft:'Черновик',revision:'Уточнённая версия',transfer:'Новый случай',recall:'Ответ по памяти'};const conf={low:'Нужно разобраться',medium:'Есть предположение',high:'Могу обосновать'};for(const l of lessons){const e=d.entries[l.id];if(!e)continue;s+=l.id+'. '+l.title+'\n'+(e.done?'Пройдено':'В работе')+'\n';for(const f of FIELDS)if(e[f])s+='\n'+labels[f]+':\n'+(f==='confidence'?conf[e[f]]:e[f])+'\n';if(e.due&&e.done)s+='\nВозвращение: '+new Date(e.due).toLocaleDateString('ru-RU')+'\n';s+='\n────────\n\n';}return s;}
return {FORMAT,VERSION,FIELDS,empty,parse,merge,complete,review,toText};
});
