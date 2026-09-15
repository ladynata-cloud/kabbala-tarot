(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./tarot-pairs-core.js'));else root.MixedReading=factory(root.TarotPairs);})(typeof globalThis==='object'?globalThis:this,function(P){
 'use strict';
 const APP='eliora-mixed-reading',KINDS={number:'Числовая карта',court:'Придворная',major:'Старший аркан'};
 function create(cards,method,paths){
  const byId=new Map(cards.map(c=>[c.id,c])),meta=new Map(cards.map(c=>[c.id,P.cardMeta(c,method)])),byPath=new Map(paths.map((p,i)=>[p.id,{...p,number:11+i}]));
  if(byId.size!==cards.length||byPath.size!==paths.length||paths.some(p=>!byId.has(p.id)||byId.get(p.id).group!=='major'||![p.a,p.b].every(n=>Number.isInteger(n)&&n>=1&&n<=10)||p.a===p.b))throw Error('Некорректный справочник путей.');
  function describe(id){const m=meta.get(id);if(!m)throw Error('Неизвестная карта.');const c=m.card,out={id,kind:m.kind,kindName:KINDS[m.kind],name:c.name,question:m.question};
   if(m.kind==='number')return {...out,rank:c.rank,sefira:m.sefira.name,suit:c.group,world:m.suit.world,correspondence:c.rank+' · '+m.sefira.name+'; '+m.suit.name+' · '+m.suit.world};
   if(m.kind==='court'){const letterName=c.rank===14?'Йод':c.rank===13?'Первая хе':c.rank===12?'Вав':'Последняя хе';return {...out,suit:c.group,world:m.suit.world,letterName,correspondence:m.court.element+' (ранг); '+m.suit.element+' (масть); '+letterName+'; '+m.suit.world};}
   const path=byPath.get(id);if(!path)throw Error('Для Старшего аркана не указан путь.');return {...out,path,correspondence:m.major.name+' · '+m.major.letter+'; путь '+path.number+': '+method.sefirot[path.a-1].name+' — '+method.sefirot[path.b-1].name};
  }
  function inspect(ids){if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!byId.has(id)))throw Error('Нужен набор разных известных карт.');const rows=ids.map(describe),numbers=rows.filter(r=>r.kind==='number'),majors=rows.filter(r=>r.kind==='major');
   const counts=Object.fromEntries(Object.keys(KINDS).map(kind=>[kind,rows.filter(r=>r.kind===kind).length]));
   const repeats=[...new Set(numbers.map(c=>c.rank))].sort((a,b)=>a-b).map(rank=>({rank,sefira:method.sefirot[rank-1].name,cards:numbers.filter(c=>c.rank===rank)})).filter(r=>r.cards.length>1);
   const links=majors.map(c=>({card:c,endpoints:[c.path.a,c.path.b].map(rank=>({rank,sefira:method.sefirot[rank-1].name,cards:numbers.filter(n=>n.rank===rank)}))}));
   return {rows,counts,repeats,links};
  }
  return {describe,inspect};
 }
 return {APP,KINDS,create};
});
