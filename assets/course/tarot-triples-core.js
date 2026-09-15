(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./tarot-pairs-core.js'));
  else root.TarotTriples=factory(root.TarotPairs);
})(typeof globalThis==='object'?globalThis:this,function(P){
  'use strict';
  const LENSES={
    system:{label:'Три аспекта целого',roles:['Аспект А','Аспект Б','Аспект В']},
    situation:{label:'Ситуация → опора → шаг',roles:['Ситуация','На что опереться','Какой шаг попробовать']},
    development:{label:'Замысел → способ → проверка',roles:['Исходная задача','Способ действия','Критерий проверки']},
    mediation:{label:'Два начала → условие согласования',roles:['Первое начало','Второе начало','Условие согласования']},
    center:{label:'Соседи и центральная карта',roles:['Левый сосед','Центральная тема','Правый сосед']}
  };
  const FIELDS=['question','reading','evidence','alternative','step'];
  const CHECKS=['images','positions','third','tradition'];
  const PERMUTATIONS=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  const choose=(n,k)=>k===2?n*(n-1)/2:k===3?n*(n-1)*(n-2)/6:0;
  const quoted=s=>'«'+s+'»';
  const supported=code=>code==='same'||code==='friendly';
  function relation(a,b){
    if(!a.suit||!b.suit)return 'unassigned';
    const x=a.card.group,y=b.card.group,k=[x,y].sort().join('');
    if(x===y)return 'same';
    if(['cw','ps'].includes(k))return 'opposed';
    if(['cs','sw','pw'].includes(k))return 'friendly';
    return 'unspecified';
  }
  const RELATION_LABELS={same:'Одна масть',opposed:'Противоположные масти',friendly:'Дружественные масти',unspecified:'В перечне не оговорено',unassigned:'Правило мастей не применяется'};
  function dignities(a,b,c){
    const ab=relation(a,b),bc=relation(b,c),ac=relation(a,c),name=b.card.name;
    const base={center:b.card.id,edges:[ab,bc,ac],source:'Book T, Of the Dignities'};
    if([a,b,c].some(m=>!m.suit))return {...base,code:'unassigned',title:'Для всей тройки правило мастей не вычисляем',text:'Среди карт есть Старший аркан. Сохраняем его буквенное и астрологическое соответствие; планету не заменяем автоматически одной стихией. Центральную тему '+quoted(b.profile.principle)+' рассматриваем через образы и роли позиций.'};
    if(ac==='opposed')return {...base,code:'outer-opposition',title:'Крайние противоположны: влияние на центр ограничено',text:a.suit.name+' и '+c.suit.name+' противоположны по перечню Book T. Текст указывает, что взаимно противоположные крайние мало влияют на центральную карту. Поэтому '+quoted(name)+' нельзя оценить простым сложением связей слева и справа.'};
    if(ab==='same'&&bc==='same')return {...base,code:'same-suit',title:'Общая масть усиливает центральную тему',text:'Обе крайние принадлежат той же масти, что и '+quoted(name)+'. В Book T это усиливает её проявление, включая возможный избыток. Общее поле тройки — '+b.suit.field+'. Усиление не равно благоприятному исходу.'};
    if(ab==='opposed'&&bc==='opposed')return {...base,code:'both-opposed',title:'Оба соседа ослабляют центральную масть',text:'С обеих сторон '+quoted(name)+' стоят карты противоположной масти. По Book T это сильное ослабление её проявления. В учебном прочтении проверьте, не заглушается ли тема '+quoted(b.profile.principle)+' преобладанием другой области.'};
    if(supported(ab)&&supported(bc))return {...base,code:'supported',title:'Оба соседа могут поддержать центр',text:'Каждая крайняя связана с центром общей или дружественной мастью, а взаимного противопоставления крайних нет. Учебный вывод: тема '+quoted(b.profile.principle)+' получает поддержку с двух сторон. Проверяем по изображениям, что именно поддерживается.'};
    if(ab==='unspecified'||bc==='unspecified')return {...base,code:'partial',title:'Полной оценки по этому перечню нет',text:'Связь Кубков и Пентаклей в коротком перечне Book T отдельно не названа. Отсутствующее правило не считаем ни враждой, ни дружбой. Для '+quoted(name)+' используем известные связи и уточняем остальное по вопросу.'};
    return {...base,code:'mixed',title:'Соседи задают разные условия',text:'Связь слева: '+RELATION_LABELS[ab].toLowerCase()+'. Справа: '+RELATION_LABELS[bc].toLowerCase()+'. Текст не даёт числовых весов для сложения этих влияний. Рассмотрите, какую сторону центральной темы затрагивает каждый сосед.'};
  }
  function create(cards,method,content){
    const n=cards.length,indices=new Map(cards.map((c,i)=>[c.id,i])),metas=new Map(cards.map(c=>[c.id,P.cardMeta(c,method)])),pairCache=new Map();
    const fallback=['p4','p5','p6'].every(id=>indices.has(id))?['p4','p5','p6']:cards.slice(0,3).map(c=>c.id);
    function normalize(input={}){
      const used=new Set(),given=Array.isArray(input.ids)?input.ids:[],rev=Array.isArray(input.reversed)?input.reversed:[];
      let entries=[0,1,2].map((_,i)=>{let id=indices.has(given[i])&&!used.has(given[i])?given[i]:fallback[i];if(used.has(id))id=cards.find(c=>!used.has(c.id)).id;used.add(id);return{id,rev:input.reversals===true&&rev[i]===true};});
      const order=input.order==='group'?'group':'sequence';
      if(order==='group')entries.sort((a,b)=>indices.get(a.id)-indices.get(b.id));
      return {ids:entries.map(e=>e.id),reversed:entries.map(e=>e.rev),reversals:input.reversals===true,order,lens:order==='group'?'system':(['situation','development','mediation','center'].includes(input.lens)?input.lens:'situation')};
    }
    function count(order='sequence',reversals=false){return (order==='group'?choose(n,3):n*(n-1)*(n-2))*(reversals?8:1);}
    function at(index,input={}){
      const s=normalize(input),total=count(s.order,s.reversals);let r=Number.isFinite(index)?((Math.trunc(index)%total)+total)%total:0;
      const bit=s.reversals?r%8:0;if(s.reversals)r=Math.floor(r/8);
      let i,j,k;
      if(s.order==='sequence'){
        i=Math.floor(r/((n-1)*(n-2)));r%=((n-1)*(n-2));j=Math.floor(r/(n-2));if(j>=i)j++;
        k=r%(n-2);const lo=Math.min(i,j),hi=Math.max(i,j);if(k>=lo)k++;if(k>=hi)k++;
      }else{
        i=0;while(r>=choose(n-i-1,2)){r-=choose(n-i-1,2);i++;}
        j=i+1;while(r>=n-j-1){r-=n-j-1;j++;}k=j+1+r;
      }
      return {...s,ids:[cards[i].id,cards[j].id,cards[k].id],reversed:[!!(bit&4),!!(bit&2),!!(bit&1)]};
    }
    function indexOf(input){
      const s=normalize(input),[i,j,k]=s.ids.map(id=>indices.get(id));
      const base=s.order==='sequence'?i*(n-1)*(n-2)+(j-(j>i?1:0))*(n-2)+k-(k>i?1:0)-(k>j?1:0):choose(n,3)-choose(n-i,3)+choose(n-i-1,2)-choose(n-j,2)+k-j-1;
      return s.reversals?base*8+4*Number(s.reversed[0])+2*Number(s.reversed[1])+Number(s.reversed[2]):base;
    }
    function key(input){const s=normalize(input);return [s.order,...s.ids,s.reversals?1:0,...s.reversed.map(Number),s.lens].join('|');}
    function permute(input,positions){const s=normalize(input);return normalize({...s,order:'sequence',lens:s.lens==='system'?'situation':s.lens,ids:positions.map(i=>s.ids[i]),reversed:positions.map(i=>s.reversed[i])});}
    function permutations(input){return PERMUTATIONS.map(p=>permute(input,p));}
    function pair(a,b){const k=a.card.id+'|'+b.card.id;if(!pairCache.has(k))pairCache.set(k,P.analyze({a:a.card.id,b:b.card.id,order:'sequence',lens:'development'},cards,method));return pairCache.get(k);}
    function structure(ms){
      const numbers=ms.filter(m=>m.kind==='number'),majors=ms.filter(m=>m.kind==='major'),courts=ms.filter(m=>m.kind==='court');
      if(numbers.length===3){
        const ranks=numbers.map(m=>m.card.rank).sort((a,b)=>a-b),sig=ranks.join(','),triad=content.triads[sig],worlds=[...new Set(ms.map(m=>m.suit.world))];
        if(triad)return {code:'triad-'+sig,title:triad.title,text:triad.explanation+' '+(worlds.length===1?'Все три ранга представлены в одном мире — '+worlds[0]+'.':'Миры мастей различаются: '+worlds.join(', ')+'. Сходство рангов не делает области одинаковыми.'),meaning:triad.focus,question:triad.question,source:'Мазерс, введение, §§ 43–55; учебные вопросы курса'};
        if(new Set(ranks).size===1)return {code:'one-sefira',title:'Одна сефира в трёх мирах: '+ms[0].sefira.name,text:'Общий ранг объединяет тему '+quoted(ms[0].sefira.focus)+', а миры '+worlds.join(', ')+' показывают разные области её проявления. Три сцены позволяют проверить, согласованы ли эти области между собой.',meaning:'Один принцип должен выдержать проверку в трёх областях жизни',question:'Где один и тот же принцип действует по-разному и что позволит согласовать эти проявления?'};
        if(new Set(ranks).size===2){const repeated=ms.find(m=>ranks.filter(r=>r===m.card.rank).length===2),other=ms.find(m=>m.card.rank!==repeated.card.rank);return {code:'repeated-sefira',title:'Повторяется '+repeated.sefira.name+', добавляется '+other.sefira.name,text:'Две карты подчёркивают тему '+quoted(repeated.sefira.focus)+'. Карта '+quoted(other.card.name)+' вводит '+quoted(other.sefira.focus)+'. В учебном прочтении это дополнительное условие, через которое можно проверить повторяющуюся тему.',meaning:'Повторяющийся принцип проверяется через отличающееся начало',question:'Что изменяет отличающаяся сефира в связи двух карт одинакового ранга?'};}
        return {code:'three-sefirot',title:ms.map(m=>m.sefira.name).join(' · '),text:'Рассматриваем три принципа: '+ms.map(m=>m.sefira.name+' — '+m.sefira.focus).join('; ')+'. Эти ранги не образуют одну из трёх полных триад 1–2–3, 4–5–6, 7–8–9 в выбранной схеме. Связь строим через вопрос и образы.',meaning:'Три разных принципа задают условия друг для друга',question:'Какое существенное условие исчезнет, если убрать любую из трёх карт?'};
      }
      if(majors.length===3)return {code:'three-paths',title:'Три пути Старших арканов',text:ms.map(m=>m.card.name+': '+m.major.name+' — '+m.major.attribution).join('; ')+'. Это буквенные и астрологические соответствия. Соседство карт не доказывает соседства путей на Древе; номера арканов не превращаем в сефирот.',meaning:'Три общих принципа меняют рамку прочтения друг друга',question:'Как третья тема меняет условия, в которых можно совместить две другие?'};
      if(courts.length===3){const same=new Set(ms.map(m=>m.card.rank)).size===1;return {code:'three-courts',title:same?'Один способ участия в трёх мастях':'Три способа участия',text:ms.map(m=>m.card.name+': '+m.court.role+' в области '+quoted(m.suit.field)).join('; ')+'. Водный, огненный, воздушный или земной способ фигуры рассматривается внутри стихии масти. Роли не предписывают пол или возраст участника.',meaning:'Результат зависит от распределения ролей и ответа участников',question:'Какой способ участия поддерживает остальные, а какой способен их вытеснить?'};}
      const parts=[];if(majors.length)parts.push('Общие принципы: '+majors.map(m=>m.card.name+' ('+m.major.name+')').join(', '));if(numbers.length)parts.push('Ситуации и условия: '+numbers.map(m=>m.card.name+' ('+m.sefira.name+', '+m.suit.world+')').join(', '));if(courts.length)parts.push('Способы участия: '+courts.map(m=>m.card.name+' — '+m.court.role).join(', '));
      return {code:'mixed-levels',title:'Разные уровни одного вопроса',text:parts.join('. ')+'. Общую тему проверяем по конкретным условиям и способу участия. Это учебная связь уровней, а не правило, что Старший аркан всегда важнее остальных.',meaning:'Принцип получает смысл через условия и способ участия',question:'Что меняется в общем принципе, когда становятся видны конкретные обстоятельства или роль человека?'};
    }
    function thirdEffect(ms,hiddenIndex=2){
      const c=ms[hiddenIndex],ab=ms.filter((_,i)=>i!==hiddenIndex),a=ab[0],b=ab[1],role=content.thirdRoles[content.cardRoles[c.card.id]],rel=pair(a,b);
      return {card:c.card.id,role:role.label,before:'Пара '+quoted(a.card.name)+' и '+quoted(b.card.name)+' ставит рядом '+quoted(a.profile.principle)+' и '+quoted(b.profile.principle)+'. '+rel.structure.question,after:quoted(c.card.name)+' '+role.label+'. Связь первых двух теперь можно проверить через '+role.shift+': '+c.profile.action+'. Так тема '+quoted(a.profile.principle)+' должна соотноситься с темой '+quoted(b.profile.principle)+' с учётом этого дополнительного условия.',question:role.question,evidence:'Основание третьего условия: '+c.card.scene+' Учебный принцип карты — '+c.profile.principle+'.',alternative:'Другая возможность: '+c.profile.excess+'. Тогда третья карта способна закрепить затруднение пары вместо его разрешения. Уточните обстоятельства.'};
    }
    function narrative(ms,lens){
      const [a,b,c]=ms,q=quoted;
      if(lens==='system')return 'В этой тройке нужно совместить '+ms.map(m=>q(m.profile.principle)).join(', ')+'. Возможная задача — выстроить такие условия, при которых каждое начало поддерживает общее дело, сохраняя свои границы. Для проверки рассмотрите по очереди действия: '+ms.map(m=>q(m.profile.action)).join('; ')+'.';
      if(lens==='center')return 'Центральная тема — '+q(b.profile.principle)+'. Левый образ ставит вопрос о '+q(a.profile.principle)+', правый — о '+q(c.profile.principle)+'. Возможная задача — '+b.profile.action+', учитывая оба условия. Вывод о центре уточняется отношениями крайних между собой.';
      if(lens==='mediation')return 'Первое начало предлагает '+q(a.profile.action)+', второе — '+q(b.profile.action)+'. В качестве условия их согласования можно рассмотреть задачу '+q(c.profile.action)+'. Это решение подходит, только если оно сохраняет существенное в обоих началах; третья карта может также показать, почему согласование пока не получается.';
      if(lens==='development')return 'Исходную задачу '+q(a.profile.action)+' можно проверить через способ '+q(b.profile.action)+'. Третий образ вводит критерий: удаётся ли '+q(c.profile.action)+'? Если нет, следует пересмотреть способ, даже когда первые две карты кажутся согласованными.';
      return 'Ситуацию можно рассмотреть через тему '+q(a.profile.principle)+'. Возможная опора — '+q(b.profile.action)+'. Следующая проба — '+q(c.profile.action)+'. Её смысл в том, чтобы проверить, помогает ли выбранная опора работать с исходной ситуацией.';
    }
    function analyze(input){
      const s=normalize(input),ms=s.ids.map(id=>metas.get(id)),layout=structure(ms),effect=thirdEffect(ms),centers=ms.map((b,i)=>{const sides=ms.filter((_,j)=>i!==j);return dignities(sides[0],b,sides[1]);}),pairs=[[0,1],[1,2],[0,2]].map(([i,j])=>({ids:[s.ids[i],s.ids[j]],code:relation(ms[i],ms[j]),analysis:pair(ms[i],ms[j])}));
      const conditions=s.ids.map((id,i)=>({id,reversed:s.reversed[i],profile:metas.get(id).profile}));
      const orientation=s.reversals?(s.reversed.some(Boolean)?'Перевёрнуты: '+ms.filter((_,i)=>s.reversed[i]).map(m=>m.card.name).join(', ')+'. Их буквы, сефирот и миры сохраняются. Для этих карт отдельно проверьте недостаток, избыток и искажение; положение не выбирает один вариант за Вас.':'Все три положения прямые. Это не исключает избытка или искажения: их проверяют по вопросу и позициям.'):'Положение карт сейчас не учитывается. Способ проявления можно уточнять по вопросу и роли каждой карты.';
      const alternative=s.order==='group'?'Проверьте другую гипотезу: одно из начал вытесняет остальные. Возможные формы избытка — '+ms.map(m=>m.card.name+': '+m.profile.excess).join('; ')+'.':effect.alternative;
      return {state:s,metas:ms,structure:layout,pairs,centers,central:centers[1],effect,conditions,orientation,reading:narrative(ms,s.lens),alternative,roles:LENSES[s.lens].roles,example:content.examples.find(ex=>ex.cards.join('|')===s.ids.join('|')&&ex.lens===s.lens&&!s.reversed.some(Boolean))||null};
    }
    function emptyNote(s){return {state:normalize(s),...Object.fromEntries(FIELDS.map(f=>[f,''])),observations:{},conditions:{},experiments:{},checks:[],updated:''};}
    function cleanNote(value){
      if(!value||typeof value!=='object'||!value.state||!Array.isArray(value.state.ids)||value.state.ids.length!==3||new Set(value.state.ids).size!==3||!value.state.ids.every(id=>indices.has(id))||!['group','sequence'].includes(value.state.order))throw Error('В файле есть некорректная тройка. Импорт отменён.');
      const out=emptyNote(value.state);
      for(const f of FIELDS){if(value[f]!==undefined&&typeof value[f]!=='string')throw Error('Некорректное поле записи.');if((value[f]||'').length>8000)throw Error('Поле записи превышает 8 000 знаков.');out[f]=value[f]||'';}
      for(const id of out.state.ids){const v=value.observations?.[id]||'';if(typeof v!=='string'||v.length>8000)throw Error('Некорректное наблюдение.');out.observations[id]=v;out.conditions[id]=P.CONDITIONS.includes(value.conditions?.[id])?value.conditions[id]:'open';}
      for(const id of out.state.ids){out.experiments[id]={};for(const f of ['before','after']){const v=value.experiments?.[id]?.[f]||'';if(typeof v!=='string'||v.length>8000)throw Error('Некорректная запись упражнения.');out.experiments[id][f]=v;}}
      out.checks=Array.isArray(value.checks)?CHECKS.filter(k=>value.checks.includes(k)):[];out.updated=typeof value.updated==='string'&&Number.isFinite(Date.parse(value.updated))?value.updated:'';return out;
    }
    function hasWork(note){return FIELDS.some(f=>note[f]?.trim())||Object.values(note.observations).some(v=>v.trim())||Object.values(note.conditions).some(v=>v!=='open')||Object.values(note.experiments).some(e=>e.before?.trim()||e.after?.trim())||note.checks.length>0;}
    function mergeText(a='',b=''){if(!b||a===b||a.includes(b))return a;const s=a?a+'\n\n— Из импортированной записи —\n'+b:b;if(s.length>8000)throw Error('Объединённый текст длиннее 8 000 знаков. Импорт отменён; текущие записи сохранены.');return s;}
    function merge(existing,incoming){const result=Object.assign(Object.create(null),existing);for(const [k,note] of Object.entries(incoming)){if(!result[k]){result[k]=note;continue;}const prev=result[k],out={...prev,observations:{...prev.observations},conditions:{...prev.conditions},experiments:{...prev.experiments},checks:[...new Set([...prev.checks,...note.checks])]};for(const f of FIELDS)out[f]=mergeText(prev[f],note[f]);for(const id of note.state.ids){out.observations[id]=mergeText(prev.observations[id],note.observations[id]);out.experiments[id]={before:mergeText(prev.experiments?.[id]?.before,note.experiments?.[id]?.before),after:mergeText(prev.experiments?.[id]?.after,note.experiments?.[id]?.after)};const old=prev.conditions[id]||'open',next=note.conditions[id]||'open';if(old==='open')out.conditions[id]=next;else if(next!=='open'&&next!==old)out.alternative=mergeText(out.alternative,'В импортированной записи '+metas.get(id).card.name+': '+P.CONDITION_LABELS[next]+'.');}out.updated=new Date().toISOString();result[k]=out;}return result;}
    function readNotebook(value){if(!value||value.app!=='eliora-tarot-triples'||value.version!==1||!Array.isArray(value.notes))throw Error('Нужен JSON-файл тетради троек версии 1.');let result=Object.create(null);for(const row of value.notes){const note=cleanNote(row);if(hasWork(note)){const k=key(note.state);result[k]=result[k]?merge({[k]:result[k]},{[k]:note})[k]:note;}}return result;}
    return {normalize,count,at,indexOf,key,permute,permutations,analyze,thirdEffect,metas,emptyNote,cleanNote,hasWork,merge,readNotebook};
  }
  return {create,LENSES,FIELDS,CHECKS,PERMUTATIONS,relation,dignities,RELATION_LABELS};
});
