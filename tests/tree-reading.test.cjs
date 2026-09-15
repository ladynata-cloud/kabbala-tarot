const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../assets/course/spread-grammar-core.js'),P=require('../assets/course/tarot-pairs-core.js');
const D=require('../content/tree-reading.json'),cards=require('../content/tarot.json').cards,method=require('../content/tarot-pairs.json');
const E=G.create(cards,D.lessons,{app:D.app,title:D.title,layoutIds:D.layoutIds});
test('source-led module has complete lessons, valid cards and two objective questions per lesson',()=>{
 assert.equal(D.lessons.length,8);assert.equal(new Set(D.lessons.map(l=>l.slug)).size,8);
 for(const l of D.lessons){assert.equal(l.quiz.length,2);assert.ok(l.reading.context&&l.reading.question&&l.bridge);assert.ok(l.sections.length>=2);for(const q of l.quiz)assert.ok(q.options[q.answer]&&q.why);for(const key of l.refs)assert.ok(D.sources[key]);assert.equal(E.strictConfig(l.default).ids.length,l.default.ids.length);}
});
test('the ten-position groups and pillars each cover every position exactly once',()=>{
 const c=E.normalize(D.lessons[6].default);
 for(const mode of ['triads','pillars','whole']){const indices=E.groups(c,mode).flatMap(g=>g.indices);assert.deepEqual(indices.slice().sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8,9]);}
 assert.deepEqual(E.groups(c,'pillars').map(g=>g.indices),[[1,3,6],[2,4,7],[0,5,8,9]]);
 const six=E.groups(D.lessons[5].default);assert.deepEqual(six.map(g=>g.indices),[[0,1,2],[3,4,5],[0,3],[1,4],[2,5]]);
});
test('all 78 cards can occupy any tree position without repeats; swaps preserve orientation and position roles',()=>{
 const base=E.normalize(D.lessons[6].default);
 for(let i=0;i<10;i++)for(const card of cards){const ids=base.ids.slice(),existing=ids.indexOf(card.id);if(existing>=0)[ids[i],ids[existing]]=[ids[existing],ids[i]];else ids[i]=card.id;const c=E.strictConfig({...base,ids});assert.equal(c.ids[i],card.id);assert.equal(new Set(c.ids).size,10);}
 base.reversed[0]=true;const moved=E.swap(base,0,9);assert.equal(moved.ids[9],base.ids[0]);assert.equal(moved.reversed[9],true);assert.deepEqual(moved.roles,base.roles);
 const eight=P.cardMeta(cards.find(c=>c.id==='p8'),method),strength=P.cardMeta(cards.find(c=>c.id==='8'),method);assert.equal(eight.kind,'number');assert.equal(strength.kind,'major');assert.ok(eight.rows.some(r=>r.join(' ').includes('Ход')));
});
test('new and old notebooks stay isolated, reject foreign imports and preserve immutable observations',()=>{
 const oldD=require('../content/spread-grammar.json'),old=G.create(cards,oldD.lessons);assert.notEqual(E.empty().app,old.empty().app);assert.throws(()=>E.validate(old.empty()));assert.throws(()=>old.validate(E.empty()));assert.throws(()=>E.strictConfig({layout:'pairs',ids:['p1','p2','p3','p4']}));
 const state=E.empty(),n=E.blank(7,D.lessons[6].default);n.question='Вопрос';n.reading='Исходная гипотеза';n.basis='Текст / соответствие / гипотеза';state.records[E.key(7,n.config)]=n;state.snapshots.push({id:'one',at:'2026-09-15T10:00:00Z',note:E.cleanNote(n)});n.reading='Уточнённый черновик';state.observations.push({id:'obs',snapshot:'one',at:'2026-09-15T11:00:00Z',date:'2026-09-15',facts:'Факт',revision:'Уточнение'});const copy=E.validate(JSON.parse(JSON.stringify(state)));assert.equal(copy.snapshots[0].note.reading,'Исходная гипотеза');assert.deepEqual(E.merge(copy,copy),copy);
 const conflict=structuredClone(copy);conflict.snapshots[0].note.reading='Подмена';assert.throws(()=>E.merge(copy,conflict));assert.equal(copy.snapshots[0].note.reading,'Исходная гипотеза');
});
