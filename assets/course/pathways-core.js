(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TarotPathways=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const APP='eliora-pathways';
 const LAYOUTS={path1:{name:'Один путь',n:1,roles:['Путь']},path2:{name:'Два пути в выбранном порядке',n:2,roles:['Первый путь','Второй путь']},path3:{name:'Три пути в выбранном порядке',n:3,roles:['Первый путь','Второй путь','Третий путь']}};
 const LABELS={question:'Вопрос исследования',before:'Первое направление или первое объяснение',after:'Что меняется при другом направлении или порядке',reading:'Моё чтение отношений',basis:'Источник / соответствие / моя гипотеза',alternative:'Другая гипотеза и недостающие сведения',step:'Какое действие или наблюдение поможет уточнить'};
 function create(paths){
  const byId=new Map(paths.map(p=>[p.id,p]));
  function edges(ids){if(!Array.isArray(ids)||ids.length<1||ids.length>3||new Set(ids).size!==ids.length||ids.some(id=>!byId.has(id)))throw Error('Выберите от одного до трёх разных Старших арканов.');return ids.map(id=>byId.get(id));}
  function walks(ids){const es=edges(ids);let rows=[[es[0].a,es[0].b],[es[0].b,es[0].a]];for(const e of es.slice(1)){const next=[];for(const row of rows){const last=row.at(-1);if(e.a===last)next.push([...row,e.b]);else if(e.b===last)next.push([...row,e.a]);}rows=next;}return rows;}
  function permutations(ids){edges(ids);if(ids.length===1)return [[...ids]];const run=xs=>xs.length===1?[[...xs]]:xs.flatMap((x,i)=>run(xs.filter((_,j)=>j!==i)).map(t=>[x,...t]));return run(ids);}
  function connected(ids){const es=edges(ids),visited=new Set([es[0].a]);let changed=true;while(changed){changed=false;for(const e of es)if(visited.has(e.a)||visited.has(e.b))for(const n of [e.a,e.b])if(!visited.has(n)){visited.add(n);changed=true;}}return es.every(e=>visited.has(e.a)&&visited.has(e.b));}
  function analyze(ids){const es=edges(ids),routes=walks(ids),orders=permutations(ids).map(order=>({ids:order,routes:walks(order)})),joins=[];for(let i=0;i<es.length;i++)for(let j=i+1;j<es.length;j++)joins.push({indices:[i,j],nodes:[es[i].a,es[i].b].filter(n=>n===es[j].a||n===es[j].b)});
   const type=routes.length?'walk':!connected(ids)?'disconnected':orders.some(x=>x.routes.length)?'order':'branch';
   return {type,routes,orders,joins,cycle:routes.some(row=>row[0]===row.at(-1))};
  }
  function reverse(config){return {...config,ids:[...config.ids].reverse(),reversed:[...config.reversed].reverse()};}
  return {walks,permutations,connected,analyze,reverse};
 }
 return {APP,LAYOUTS,LABELS,create};
});
