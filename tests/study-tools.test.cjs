const {test}=require('node:test');const assert=require('node:assert/strict');
const {create}=require('../assets/course/study-tools-core.js');
const C=create({'comment:p1':['literal','evidence'],'compare:c1':['difference']});
test('first attempt and revision survive round trip and another exercise',()=>{
 const s=C.empty(),r=C.record(s,'comment:p1');r.fields.literal='Первая попытка';assert.equal(C.snapshot(s,'comment:p1','2026-09-15T12:00:00Z'),true);
 r.fields.literal='Уточнённая мысль';C.snapshot(s,'comment:p1','2026-09-16T12:00:00Z');C.record(s,'compare:c1').fields.difference='Другая задача';
 const n=C.validate(JSON.parse(JSON.stringify(s)));assert.equal(n.records['comment:p1'].revisions[0].fields.literal,'Первая попытка');assert.equal(n.records['comment:p1'].fields.literal,'Уточнённая мысль');assert.equal(n.records['compare:c1'].fields.difference,'Другая задача');assert.equal(C.snapshot(n,'comment:p1'),false);
});
test('import preserves both drafts and distinct revisions, repeated import is idempotent',()=>{
 const a=C.empty(),b=C.empty();C.record(a,'comment:p1').fields.literal='На этом устройстве';C.record(b,'comment:p1').fields.literal='С другого устройства';C.snapshot(a,'comment:p1','2026-09-15T12:00:00Z');C.snapshot(b,'comment:p1','2026-09-16T12:00:00Z');
 const m=C.merge(a,b);assert.match(m.records['comment:p1'].fields.literal,/На этом устройстве/);assert.match(m.records['comment:p1'].fields.literal,/С другого устройства/);assert.equal(m.records['comment:p1'].revisions.length,2);assert.deepEqual(C.merge(m,b),m);assert.equal(a.records['comment:p1'].fields.literal,'На этом устройстве');
});
test('wrong notebook, unknown records, oversized text and bad dates reject atomically',()=>{
 const a=C.empty();C.record(a,'comment:p1').fields.literal='Оставить';const before=JSON.stringify(a);
 for(const b of [{app:'another',version:1,records:{}},{...C.empty(),records:{'comment:unknown':{fields:{},revisions:[]}}},{...C.empty(),records:{'comment:p1':{fields:{literal:'x'.repeat(40001)},revisions:[]}}},{...C.empty(),records:{'comment:p1':{fields:{},revisions:[{at:'invalid',fields:{}}]}}}]){assert.throws(()=>C.merge(a,b));assert.equal(JSON.stringify(a),before);}
});
test('Pardes uses an isolated notebook and does not accept other books',()=>{
 const {create}=require('../assets/course/study-state.js').StudyState;const c=create('pardes-rimmonim');assert.equal(c.empty().course,'eliora-book-pardes-rimmonim-v1');assert.throws(()=>c.merge(c.empty(),create('shaarei-orah').empty()));
});
