(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SpreadGrammar=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const APP='eliora-spread-grammar',FIELDS=['question','before','after','reading','basis','alternative','step'];
 const LABELS={question:'Вопрос',before:'До возвращения карты',after:'После возвращения карты',reading:'Толкование целого',basis:'Изображения, соответствия и источник',alternative:'Другая гипотеза',step:'Как проверить или уточнить'};
 const LAYOUTS={
  worlds:{name:'Четыре мира',n:4,roles:['Ацилут · ведущий принцип','Брия · какое целое возникает','Йецира · устройство связей','Асия · осуществление'],help:'Четыре уровня рассмотрения одного вопроса. Практические формулировки — учебная адаптация; это не четыре даты.'},
  'three-one':{name:'Тройка + условие',n:4,roles:['Первое начало','Второе начало','Связь первых двух','Дополнительное условие'],help:'Сначала прочитайте тройку, затем проверьте её связь через четвёртую карту. Дополнение может поддержать или осложнить прежнее объяснение.'},
  pairs:{name:'Две пары',n:4,roles:['Карта А','Карта Б','Карта В','Карта Г'],help:'Объясните связь внутри каждой пары, затем зависимость между двумя связями. Переключатель задаёт три разбиения без внутреннего порядка.'},
  square:{name:'Квадрат: участник × уровень',n:4,roles:['Я · намерение','Другой · намерение','Я · действие','Другой · действие'],help:'Верхняя строка — намерения, нижняя — действия. Левый столбец — моя сторона, правый — другой участник. Диагонали автоматически не добавляются.'},
  tree:{name:'Четыре функции Древа',n:4,roles:['Хесед · поддержка','Гвура · ограничение','Тиферет · согласование','Малхут · осуществление'],help:'Выбраны четыре функции для упражнения. Это список позиций, не полная геометрия Древа. Собственные соответствия карт сохраняются.'},
  'two-three':{name:'Пара + тройка',n:5,roles:['Начало А','Начало Б','Способ действия','Необходимое условие','Критерий проверки'],help:'Пара ставит вопрос; тройка предлагает способ, условие и критерий. Проверьте, отвечает ли этот процесс именно на вопрос пары.'},
  triads:{name:'Две тройки',n:6,roles:['Замысел · начало','Замысел · способ','Замысел · критерий','Осуществление · начало','Осуществление · способ','Осуществление · критерий'],help:'Читайте два ряда отдельно и сравнивайте соответствующие столбцы: начало с началом, способ со способом, критерий с критерием.'},
  line:{name:'Ряд с условными переходами',n:4,roles:['Исходное положение','Необходимое условие','Действие','Возможное следствие'],help:'Ряд задаёт условные переходы. Он не указывает даты и не гарантирует последнюю позицию. Назовите условия между этапами.'},
  custom4:{name:'Своя схема · 4 карты',n:4,roles:['Позиция 1','Позиция 2','Позиция 3','Позиция 4'],help:'Задайте роли позиций до чтения. В обосновании укажите, какие связи между ними нужны и на какую каббалистическую схему Вы опираетесь.'},
  custom5:{name:'Своя схема · 5 карт',n:5,roles:['Позиция 1','Позиция 2','Позиция 3','Позиция 4','Позиция 5'],help:'Пятая карта должна выполнять отдельную, названную Вами функцию. Геометрия и связи не выводятся только из числа карт.'},
  custom6:{name:'Своя схема · 6 карт',n:6,roles:['Позиция 1','Позиция 2','Позиция 3','Позиция 4','Позиция 5','Позиция 6'],help:'Опишите роли и способ чтения групп. Добавление карт полезно, когда помогает различить существенные стороны вопроса.'}
 };
 const PARTITIONS=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
 const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const text=(v,max=12000)=>{if(v===undefined)return '';if(typeof v!=='string'||v.length>max)throw Error('В тетради есть некорректный или слишком длинный текст. Импорт отменён.');return v;};
 function create(cards,lessons){
  const byId=new Map(cards.map(c=>[c.id,c])),byLesson=new Map(lessons.map(l=>[String(l.id),l]));
  function normalize(raw={}){
   const layout=LAYOUTS[raw.layout]?raw.layout:'pairs',spec=LAYOUTS[layout],used=new Set();
   const ids=Array.from({length:spec.n},(_,i)=>{let id=raw.ids?.[i];if(!byId.has(id)||used.has(id))id=cards.find(c=>!used.has(c.id)).id;used.add(id);return id;});
   const roles=layout.startsWith('custom')?spec.roles.map((r,i)=>typeof raw.roles?.[i]==='string'&&raw.roles[i].trim()?raw.roles[i].trim().slice(0,100):r):[...spec.roles];
   return {layout,ids,reversed:ids.map((_,i)=>raw.reversed?.[i]===true),roles,partition:layout==='pairs'&&[0,1,2].includes(raw.partition)?raw.partition:0,focus:ids.includes(raw.focus)?raw.focus:ids.at(-1)};
  }
  function strictConfig(raw){if(!object(raw)||!LAYOUTS[raw.layout]||!Array.isArray(raw.ids)||raw.ids.length!==LAYOUTS[raw.layout].n||new Set(raw.ids).size!==raw.ids.length||!raw.ids.every(id=>byId.has(id)))throw Error('В тетради есть некорректный набор карт. Импорт отменён.');if(raw.roles!==undefined&&(!Array.isArray(raw.roles)||raw.roles.some(r=>typeof r!=='string'||r.length>100)))throw Error('Некорректные роли позиций.');return normalize(raw);}
  function key(lesson,config){return String(lesson)+'|'+JSON.stringify(normalize(config));}
  function swap(raw,i,j){const c=normalize(raw);if(i<0||j<0||i>=c.ids.length||j>=c.ids.length)return c;[c.ids[i],c.ids[j]]=[c.ids[j],c.ids[i]];[c.reversed[i],c.reversed[j]]=[c.reversed[j],c.reversed[i]];return c;}
  function groups(raw){const c=normalize(raw),all=c.ids.map((_,i)=>i);if(c.layout==='pairs')return PARTITIONS[c.partition].map((indices,i)=>({name:'Пара '+(i+1),indices}));if(c.layout==='three-one')return [{name:'Исходная тройка',indices:[0,1,2]},{name:'Дополнительное условие',indices:[3]}];if(c.layout==='two-three')return [{name:'Два начала',indices:[0,1]},{name:'Процесс и проверка',indices:[2,3,4]}];if(c.layout==='triads')return [{name:'Замысел',indices:[0,1,2]},{name:'Осуществление',indices:[3,4,5]},...[0,1,2].map((i)=>({name:['Начало: сопоставить','Способ: сопоставить','Критерий: сопоставить'][i],indices:[i,i+3]}))];if(c.layout==='square')return [{name:'Намерения участников',indices:[0,1]},{name:'Действия участников',indices:[2,3]},{name:'Моя сторона',indices:[0,2]},{name:'Другой участник',indices:[1,3]}];return [{name:c.layout==='line'?'Условная последовательность':'Рассмотреть целое',indices:all}];}
  const blank=(lesson,config)=>({lesson:String(lesson),config:normalize(config),...Object.fromEntries(FIELDS.map(f=>[f,''])),observations:{},updated:''});
  function cleanNote(raw){if(!object(raw)||!byLesson.has(String(raw.lesson)))throw Error('Неизвестное занятие в тетради.');const n=blank(raw.lesson,strictConfig(raw.config));for(const f of FIELDS)n[f]=text(raw[f]);for(const id of n.config.ids)n.observations[id]=text(raw.observations?.[id]);n.updated=text(raw.updated,100);return n;}
  const hasWork=n=>FIELDS.some(f=>n[f]?.trim())||Object.values(n.observations||{}).some(v=>v.trim());
  const empty=()=>({app:APP,version:1,records:{},completed:{},selections:{},snapshots:[],observations:[]});
  function validate(raw){
   if(!object(raw)||raw.app!==APP||raw.version!==1||!object(raw.records)||!object(raw.completed)||!object(raw.selections)||!Array.isArray(raw.snapshots)||!Array.isArray(raw.observations))throw Error('Выберите JSON-тетрадь модуля «Четыре карты» версии 1.');
   const out=empty();for(const value of Object.values(raw.records)){const n=cleanNote(value),k=key(n.lesson,n.config);if(out.records[k])throw Error('Повтор одного варианта в файле.');out.records[k]=n;}
   for(const [id,v] of Object.entries(raw.completed)){if(!byLesson.has(id)||typeof v!=='boolean')throw Error('Некорректная отметка занятия.');out.completed[id]=v;}
   for(const [id,v] of Object.entries(raw.selections)){if(!byLesson.has(id))throw Error('Неизвестное занятие.');out.selections[id]=strictConfig(v);}
   const used=new Set();for(const row of raw.snapshots){if(!object(row)||typeof row.id!=='string'||!row.id||used.has(row.id)||typeof row.at!=='string'||!Number.isFinite(Date.parse(row.at)))throw Error('Некорректный снимок разбора.');used.add(row.id);out.snapshots.push({id:text(row.id,120),at:row.at,note:cleanNote(row.note)});}
   const obsIds=new Set();for(const row of raw.observations){if(!object(row)||typeof row.id!=='string'||!row.id||obsIds.has(row.id)||!used.has(row.snapshot)||typeof row.at!=='string'||!Number.isFinite(Date.parse(row.at))||!/^\d{4}-\d{2}-\d{2}$/.test(row.date||'')||!Number.isFinite(Date.parse(row.date)))throw Error('Некорректное возвращение к разбору.');obsIds.add(row.id);out.observations.push({id:text(row.id,120),snapshot:row.snapshot,at:row.at,date:row.date,facts:text(row.facts),revision:text(row.revision)});}
   return out;
  }
  function combine(a,b){if(!b||a===b||a.includes(b))return a;const result=a?a+'\n\n— Другая сохранённая версия —\n'+b:b;if(result.length>12000)throw Error('Объединённый текст превышает 12 000 знаков. Импорт отменён; текущая тетрадь сохранена.');return result;}
  function merge(old,incoming){const out=validate(old),inc=validate(incoming);for(const [k,n] of Object.entries(inc.records)){if(!out.records[k]){out.records[k]=n;continue;}const prev=out.records[k];for(const f of FIELDS)prev[f]=combine(prev[f],n[f]);for(const id of n.config.ids)prev.observations[id]=combine(prev.observations[id]||'',n.observations[id]||'');if(n.updated>prev.updated)prev.updated=n.updated;}
   for(const [id,v] of Object.entries(inc.completed))out.completed[id]=out.completed[id]||v;
   for(const [id,c] of Object.entries(inc.selections))if(!out.selections[id])out.selections[id]=c;
   for(const field of ['snapshots','observations']){const rows=new Map(out[field].map(r=>[r.id,r]));for(const row of inc[field]){if(rows.has(row.id)){if(JSON.stringify(rows.get(row.id))!==JSON.stringify(row))throw Error('Сохранённые снимки или наблюдения с одним номером различаются. Импорт отменён; обе копии следует сохранить отдельно.');}else{out[field].push(row);rows.set(row.id,row);}}}return out;
  }
  return {normalize,strictConfig,key,swap,groups,blank,cleanNote,hasWork,empty,validate,merge};
 }
 return {APP,FIELDS,LABELS,LAYOUTS,PARTITIONS,create};
});
