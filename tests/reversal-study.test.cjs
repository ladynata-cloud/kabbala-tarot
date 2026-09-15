const assert=require('node:assert/strict');
const R=require('../assets/course/reversal-study-core.js'),G=require('../assets/course/spread-grammar-core.js');
const cards=require('../content/tarot.json').cards,method=require('../content/tarot-pairs.json'),D=require('../content/reversal-study.json');
const E=G.create(cards,D.lessons,{app:D.app,title:D.title,layoutIds:D.layoutIds}),M=R.create(cards,method);
assert.equal(D.app,R.APP);assert.equal(D.lessons.length,6);assert.equal(D.lessons.flatMap(l=>l.quiz).length,12);
for(const l of D.lessons){const c=E.strictConfig(l.default);assert.equal(c.ids.length,G.LAYOUTS[c.layout].n);assert.equal(c.reversed.length,c.ids.length);assert.ok(l.reading.url&&l.reading.context);assert.ok(l.refs.every(k=>D.sources[k]));}
for(let n=4;n<=6;n++){
 const patterns=R.patterns(n);assert.equal(patterns.length,2**n);assert.equal(new Set(patterns.map(p=>p.label)).size,2**n);
 const config=E.normalize({layout:'custom'+n,ids:cards.slice(0,n).map(c=>c.id),roles:cards.slice(0,n).map((_,i)=>'Вопрос '+i)}),before=JSON.stringify(config);
 for(const p of patterns){assert.equal(R.mask(p.reversed),p.value);const next=R.apply(config,p.value);assert.deepEqual(next.ids,config.ids);assert.deepEqual(next.roles,config.roles);assert.equal(next.focus,config.focus);assert.equal(next.layout,config.layout);assert.equal(R.mask(next.reversed),p.value);assert.notEqual(next.ids,config.ids);assert.notEqual(next.roles,config.roles);assert.equal(JSON.stringify(config),before);
  for(let i=0;i<n;i++){const changed=R.flip(next,config.ids[i]);assert.equal(changed.reversed.filter((v,j)=>v!==next.reversed[j]).length,1);assert.equal(changed.reversed[i],!next.reversed[i]);assert.deepEqual(R.flip(changed,config.ids[i]),next);const j=(i+1)%n,moved=E.swap(next,i,j);assert.equal(moved.reversed[j],next.reversed[i]);assert.equal(moved.ids[j],next.ids[i]);assert.deepEqual(moved.roles,next.roles);}
 }
 assert.throws(()=>R.apply(config,2**n));assert.throws(()=>R.apply(config,-1));assert.throws(()=>R.flip(config,'unknown'));
}
assert.throws(()=>R.count(3));assert.throws(()=>R.count(7));assert.throws(()=>R.mask([true,false,0,false]));assert.throws(()=>R.orientations(4,1.5));
for(const c of cards){const d=M.describe(c.id);assert.equal(d.id,c.id);assert.equal(d.hypotheses.length,4);assert.ok(d.rows.length);assert.ok(d.hypotheses.every(h=>h.text&&h.question));}
assert.throws(()=>M.describe('unknown'));
// Changing only orientation saves an independent explanation; returning restores its identity.
const initial=E.normalize(D.lessons[0].default),upright=R.apply(initial,0),state=E.empty();
for(const [c,reading] of [[initial,'Исходная гипотеза'],[upright,'Все прямо']]){const note=E.blank(1,c);note.question='Как продолжить? Правило: сравнение.';note.reading=reading;note.basis='Источник и собственная аналогия';state.records[E.key(1,c)]=note;}
assert.notEqual(E.key(1,initial),E.key(1,upright));assert.equal(Object.keys(state.records).length,2);assert.equal(state.records[E.key(1,R.apply(upright,R.mask(initial.reversed)))].reading,'Исходная гипотеза');
state.snapshots.push({id:'first',at:'2026-09-15T15:00:00Z',note:E.cleanNote(state.records[E.key(1,initial)])});state.records[E.key(1,initial)].reading='Новая редакция';state.observations.push({id:'return',snapshot:'first',at:'2026-09-16T15:00:00Z',date:'2026-09-16',facts:'Уточнили договорённость',revision:'Пересмотрели меру'});
const loaded=E.validate(JSON.parse(JSON.stringify(state)));assert.equal(loaded.snapshots[0].note.reading,'Исходная гипотеза');assert.deepEqual(E.merge(loaded,loaded),loaded);assert.throws(()=>E.validate({...loaded,app:'eliora-mixed-reading'}));
console.log('All 16/32/64 orientations, single-card flips, preservation of order/roles/focus, all 78 profiles and independent notebook variants passed.');
