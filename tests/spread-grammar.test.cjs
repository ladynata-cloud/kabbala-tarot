'use strict';
const assert=require('node:assert/strict'),{test}=require('node:test');
const G=require('../assets/course/spread-grammar-core.js'),cards=require('../content/tarot.json').cards,D=require('../content/spread-grammar.json'),P=require('../assets/course/tarot-pairs-core.js'),method=require('../content/tarot-pairs.json');
const E=G.create(cards,D.lessons),start=D.lessons[0].default;
test('Twelve lessons have valid card sets, sources and varied objective answers',()=>{
 assert.equal(D.lessons.length,12);assert.equal(new Set(D.lessons.map(l=>l.slug)).size,12);
 const answerCount=[0,0,0];
 for(const [i,l]of D.lessons.entries()){
  assert.equal(l.id,i+1);assert.ok(l.sections.length>=2&&l.sections.every(s=>s.text.length>=2));
  assert.ok(l.example.reading&&l.example.evidence&&l.example.alternative);assert.ok(l.refs.every(r=>D.sources[r]));
  const c=E.strictConfig(l.default);assert.equal(c.ids.length,G.LAYOUTS[c.layout].n);
  assert.equal(l.quiz.length,2);for(const q of l.quiz){assert.equal(q.options.length,3);assert.ok(q.why);answerCount[q.answer]++;}
 }
 assert.ok(answerCount.every(n=>n>=6));
});
test('Every card can occupy every supported layout position without repetition',()=>{
 for(const layout of Object.keys(G.LAYOUTS))for(let pos=0;pos<G.LAYOUTS[layout].n;pos++)for(const card of cards){
  const ids=Array.from({length:G.LAYOUTS[layout].n},(_,i)=>cards[(i+13)%78].id);ids[pos]=card.id;
  const c=E.normalize({layout,ids});assert.equal(c.ids.length,G.LAYOUTS[layout].n);assert.equal(new Set(c.ids).size,c.ids.length);
  assert.ok(c.ids.every(id=>cards.some(c=>c.id===id)));assert.ok(c.ids.includes(c.focus));
 }
});
test('Three partitions exhaust the pairings, while square and triads keep their named connections',()=>{
 const edges=new Set();for(let partition=0;partition<3;partition++)for(const g of E.groups({...start,layout:'pairs',partition}))edges.add(g.indices.join(','));
 assert.equal(edges.size,6);assert.deepEqual(E.groups({...start,layout:'square'}).map(g=>g.indices),[[0,1],[2,3],[0,2],[1,3]]);
 const six=E.normalize({layout:'triads',ids:D.lessons[8].default.ids});assert.deepEqual(E.groups(six).map(g=>g.indices),[[0,1,2],[3,4,5],[0,3],[1,4],[2,5]]);
 assert.deepEqual(E.groups({...start,layout:'two-three'}).map(g=>g.indices),[[0,1],[2,3,4]]);
});
test('Positions and orientation are distinct; focus follows the same card when swapped',()=>{
 const c=E.normalize({...start,layout:'tree',reversed:[true,false,false,false],focus:start.ids[0]});const swapped=E.swap(c,0,3);
 assert.equal(swapped.ids[3],c.ids[0]);assert.equal(swapped.reversed[3],true);assert.equal(swapped.reversed[0],false);assert.equal(swapped.focus,c.focus);assert.deepEqual(swapped.roles,c.roles);
 assert.deepEqual(E.swap(swapped,0,3),c);assert.equal(P.cardMeta(cards.find(c=>c.id==='p8'),method).sefira.name,'Ход');
 assert.equal(P.cardMeta(cards.find(c=>c.id==='8'),method).sefira,undefined);
 assert.notEqual(E.key(1,c),E.key(1,{...c,focus:c.ids[1]}));assert.notEqual(E.key(1,c),E.key(2,c));
 assert.notEqual(E.key(1,{...c,layout:'pairs',partition:0}),E.key(1,{...c,layout:'pairs',partition:1}));
 assert.notEqual(E.key(1,{...c,layout:'custom4',roles:['А','Б','В','Г']}),E.key(1,{...c,layout:'custom4',roles:['А','Б','В','Д']}));
});
test('Snapshots stay fixed while a draft changes; observations and records survive JSON round trips',()=>{
 const s=E.empty(),n=E.blank(1,start);n.question='Как помочь?';n.reading='Первое объяснение';n.observations.p6='Весы';n.before='Без практики';n.after='С практикой';
 const key=E.key(1,n.config);s.records[key]=n;s.completed['1']=true;s.selections['1']=n.config;
 s.snapshots.push({id:'baseline',at:'2026-09-15T10:00:00.000Z',note:E.cleanNote(n)});n.reading='Позднее объяснение';
 s.observations.push({id:'return-1',snapshot:'baseline',at:'2026-09-16T11:00:00.000Z',date:'2026-09-16',facts:'Выполнены две работы',revision:'Условие оказалось посильным'});
 const normalized=E.validate(JSON.parse(JSON.stringify(s)));assert.equal(normalized.snapshots[0].note.reading,'Первое объяснение');assert.equal(normalized.records[key].reading,'Позднее объяснение');assert.equal(normalized.observations[0].facts,'Выполнены две работы');assert.equal(normalized.records[key].observations.p6,'Весы');
 assert.deepEqual(E.merge(normalized,normalized),normalized);
 const incoming=structuredClone(normalized);incoming.records[key].reading='Другая гипотеза';const merged=E.merge(normalized,incoming);
 assert.ok(merged.records[key].reading.includes('Позднее объяснение')&&merged.records[key].reading.includes('Другая гипотеза'));assert.equal(normalized.records[key].reading,'Позднее объяснение');
 assert.deepEqual(E.merge(merged,incoming),merged);
 const conflict=structuredClone(incoming);conflict.snapshots[0].note.reading='Изменён снимок';assert.throws(()=>E.merge(normalized,conflict),/снимки/);assert.equal(normalized.snapshots[0].note.reading,'Первое объяснение');
 const large=structuredClone(incoming);large.records[key].reading='x'.repeat(12000);assert.throws(()=>E.merge(normalized,large),/12 000/);assert.equal(normalized.records[key].reading,'Позднее объяснение');
 const wrong=structuredClone(normalized);wrong.observations[0].snapshot='missing';assert.throws(()=>E.validate(wrong),/возвращение/);
 assert.throws(()=>E.validate({...normalized,app:'eliora-tarot-triples'}),/JSON/);
});
