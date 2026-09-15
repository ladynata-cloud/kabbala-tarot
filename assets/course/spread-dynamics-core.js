(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./spread-grammar-core.js'));else root.SpreadDynamics=factory(root.SpreadGrammar);})(typeof globalThis==='object'?globalThis:this,function(G){
 'use strict';
 const APP='eliora-spread-dynamics';
 function create(cards,lessons,options={}){
  const E=G.create(cards,lessons,{...options,app:APP}),byId=new Map(cards.map(c=>[c.id,c]));
  const card=(n,i)=>i<n.config.ids.length?{id:n.config.ids[i],name:byId.get(n.config.ids[i]).name,reversed:n.config.reversed[i],role:n.config.roles[i]}:null;
  function compare(rawA,rawB){
   const a=E.cleanNote(rawA),b=E.cleanNote(rawB),ac=a.config,bc=b.config;
   const positions=Array.from({length:Math.max(ac.ids.length,bc.ids.length)},(_,i)=>{const before=card(a,i),after=card(b,i);return {position:i+1,before,after,cardChanged:before?.id!==after?.id,roleChanged:before?.role!==after?.role,orientationChanged:!!before&&!!after&&before.id===after.id&&before.reversed!==after.reversed};});
   const retained=ac.ids.filter(id=>bc.ids.includes(id)).map(id=>{const from=ac.ids.indexOf(id),to=bc.ids.indexOf(id);return {id,name:byId.get(id).name,from:from+1,to:to+1,moved:from!==to,turned:ac.reversed[from]!==bc.reversed[to],detailChanged:(a.observations[id]||'')!==(b.observations[id]||'')};});
   const added=bc.ids.filter(id=>!ac.ids.includes(id)).map(id=>({id,name:byId.get(id).name})),removed=ac.ids.filter(id=>!bc.ids.includes(id)).map(id=>({id,name:byId.get(id).name}));
   const textChanges=G.FIELDS.filter(f=>a[f]!==b[f]).map(field=>({field,label:G.LABELS[field],before:a[field],after:b[field]}));
   const warnings=[];
   if(a.lesson!==b.lesson)warnings.push('Выбраны разные занятия: сначала сопоставьте задачи упражнений.');
   if(a.question.trim()!==b.question.trim())warnings.push('Вопрос изменился: эти записи могут относиться к разным предметам исследования.');
   if(ac.layout!==bc.layout||ac.ids.length!==bc.ids.length)warnings.push('Схема или число карт изменились: одинаковый номер места не гарантирует одинаковой функции.');
   if(positions.some(p=>p.roleChanged))warnings.push('Вопросы позиций различаются. Сначала сравните их смысл, затем карты.');
   if(ac.layout==='pairs'&&bc.layout==='pairs'&&ac.partition!==bc.partition)warnings.push('Изменилось разбиение на пары: состав карт прежний не обязательно означает прежние связи.');
   return {a,b,positions,retained,added,removed,textChanges,warnings,focusChanged:ac.focus!==bc.focus,partitionChanged:ac.layout==='pairs'&&bc.layout==='pairs'&&ac.partition!==bc.partition,sameConfiguration:JSON.stringify(ac)===JSON.stringify(bc)};
  }
  return {compare,cleanNote:E.cleanNote};
 }
 return {APP,create};
});
