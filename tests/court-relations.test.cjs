const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),P=require('../assets/course/court-relations-core.js'),G=require('../assets/course/spread-grammar-core.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/course/court-relations-atlas.js'),'utf8'),ctx);
const cards=JSON.parse(JSON.stringify(ctx.window.CourtRelationsAtlas.cards)),D=require('../content/court-relations.json'),M=P.create(cards),E=G.create(cards,D.lessons,{app:P.APP,title:D.title,layouts:P.LAYOUTS}),byId=new Map(cards.map(c=>[c.id,c]));
assert.equal(cards.length,16);assert.equal(new Set(cards.map(c=>c.id)).size,16);assert.equal(D.lessons.length,6);assert.equal(D.lessons.flatMap(l=>l.quiz).length,12);
for(const l of D.lessons){assert.equal(E.strictConfig(l.default).ids.length,P.LAYOUTS[l.default.layout].n);for(const q of l.quiz)assert.ok(q.answer>=0&&q.answer<q.options.length);}
for(const suit of ['w','c','s','p'])for(const rank of ['14','13','12','11']){const c=byId.get(suit+rank);assert.ok(c&&c.question&&c.risk&&c.relation);assert.equal(c.suitId,suit);assert.equal(c.rank,rank);assert.equal(c.rankElement,{'14':'Огонь','13':'Вода','12':'Воздух','11':'Земля'}[rank]);assert.equal(c.letterName,{'14':'Йод','13':'Первая хе','12':'Вав','11':'Последняя хе'}[rank]);}
assert.equal(byId.get('w13').formula,'Вода Огня');assert.equal(byId.get('c14').formula,'Огонь Воды');assert.equal(byId.get('w13').world,'Ацилут');assert.equal(byId.get('c14').world,'Брия');assert.equal(M.compare('w13','c14').transpose,true);assert.equal(M.compare('w13','s13').sameRank,true);assert.equal(M.compare('w13','w11').sameSuit,true);
assert.throws(()=>M.analyze(['w13','w13']));assert.throws(()=>M.analyze(['0']));assert.throws(()=>M.reorder({ids:['w13','c14'],reversed:[false,true]},['w13','s14']));
let pairCount=0,quartetCount=0,orderedQuartets=0;
for(let a=0;a<16;a++)for(let b=a+1;b<16;b++){
 const pair=M.analyze([cards[a].id,cards[b].id]);assert.equal(pair.orders.length,2);pairCount++;
 for(let c=b+1;c<16;c++)for(let d=c+1;d<16;d++){
  const ids=[a,b,c,d].map(i=>cards[i].id),info=M.analyze(ids);quartetCount++;assert.equal(info.orders.length,24);assert.equal(new Set(info.orders.map(x=>x.join(','))).size,24);assert.equal(info.pairs.length,6);assert.equal(info.partitions.length,3);
  const flattened=new Set();for(const partition of info.partitions){assert.deepEqual([...partition.flat()].sort(),[...ids].sort());for(const row of partition)flattened.add([...row].sort().join(','));}assert.equal(flattened.size,6);
  const config=E.normalize({layout:'court4',ids,reversed:[true,false,true,false],focus:ids[1]});
  for(const order of info.orders){const next=M.reorder(config,order);assert.equal(next.focus,config.focus);assert.deepEqual(next.roles,config.roles);for(let i=0;i<4;i++)assert.equal(next.reversed[i],config.reversed[ids.indexOf(order[i])]);orderedQuartets++;}
 }
}
assert.equal(pairCount,120);assert.equal(quartetCount,1820);assert.equal(orderedQuartets,43680);
const c=E.normalize(D.lessons[4].default);assert.notEqual(E.key(5,c),E.key(5,{...c,partition:1}));assert.notEqual(E.key(5,c),E.key(5,{...c,focus:c.ids[0]}));assert.notEqual(E.key(5,c),E.key(5,{...c,reversed:[true,false,false,false]}));
const n=E.blank(5,c);n.question='Как связаны функции?';n.reading='Первая версия';n.basis='Book T / наша адаптация / гипотеза';let state=E.empty();state.records[E.key(5,c)]=n;state.snapshots.push({id:'s1',at:'2026-09-15T12:00:00Z',note:E.cleanNote(n)});n.reading='Изменённый черновик';state.observations.push({id:'o1',snapshot:'s1',at:'2026-09-16T12:00:00Z',date:'2026-09-16',facts:'Уточнили договорённости',revision:'Нужна другая форма'});state=E.validate(JSON.parse(JSON.stringify(state)));assert.equal(state.snapshots[0].note.reading,'Первая версия');assert.equal(state.observations.length,1);assert.deepEqual(E.merge(state,state),state);assert.throws(()=>E.validate({...state,app:'eliora-pathways'}));assert.throws(()=>G.create(cards,D.lessons).validate(state));const conflict=structuredClone(state);conflict.snapshots[0].note.reading='Переписать прошлое';assert.throws(()=>E.merge(state,conflict));assert.equal(state.snapshots[0].note.reading,'Первая версия');
console.log('16 court mappings; 120 pairs; 1,820 quartets / 43,680 orders; all pair partitions; orientation/position preservation; isolated notebook, immutable snapshots and imports passed.');
