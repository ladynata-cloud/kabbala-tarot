(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CourtRelations=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const APP='eliora-court-relations';
 const LAYOUTS={court1:{name:'Одна фигура',n:1,roles:['Способ участия']},court2:{name:'Диалог двух функций',n:2,roles:['Что предлагается','Как это принимается и меняется']},court4:{name:'Четыре функции',n:4,roles:['Задать направление','Принять и развить','Связать и передать','Воплотить и проверить']},pairs:{name:'Две пары',n:4,roles:['Карта А','Карта Б','Карта В','Карта Г']}};
 const LABELS={question:'Вопрос исследования',before:'Первое чтение или чтение без скрытой карты',after:'Что меняется после возвращения, перестановки или переворота',reading:'Моё чтение отношений и целого',basis:'Источник / соответствие / моя гипотеза',alternative:'Другая гипотеза и недостающие сведения',step:'Какое действие или наблюдение поможет уточнить'};
 const PARTITIONS=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
 function create(cards){
  const byId=new Map(cards.map(c=>[c.id,c]));
  function selected(ids){if(!Array.isArray(ids)||ids.length<1||ids.length>4||new Set(ids).size!==ids.length||ids.some(id=>!byId.has(id)))throw Error('Выберите от одной до четырёх разных придворных карт.');return ids.map(id=>byId.get(id));}
  function permutations(ids){selected(ids);const run=xs=>xs.length===1?[[...xs]]:xs.flatMap((x,i)=>run(xs.filter((_,j)=>j!==i)).map(t=>[x,...t]));return run(ids);}
  function compare(a,b){const [x,y]=selected([a,b]);return {sameRank:x.rank===y.rank,sameSuit:x.suitId===y.suitId,transpose:x.rankElement===y.suitElement&&y.rankElement===x.suitElement};}
  function analyze(ids){const cs=selected(ids),ranks=[...new Set(cs.map(c=>c.rank))],suits=[...new Set(cs.map(c=>c.suitId))],pairs=[];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)pairs.push({ids:[ids[i],ids[j]],...compare(ids[i],ids[j])});return {ranks,suits,pairs,orders:permutations(ids),partitions:ids.length===4?PARTITIONS.map(gs=>gs.map(indices=>indices.map(i=>ids[i]))):[]};}
  function reorder(config,ids){selected(ids);if(ids.length!==config.ids.length||!ids.every(id=>config.ids.includes(id)))throw Error('Перестановка должна сохранять выбранные карты.');return {...config,ids:[...ids],reversed:ids.map(id=>config.reversed[config.ids.indexOf(id)])};}
  return {analyze,compare,permutations,reorder};
 }
 return {APP,LAYOUTS,LABELS,PARTITIONS,create};
});
